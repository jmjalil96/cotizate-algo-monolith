import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError, conflict, emailNotVerified } from "../../../../shared/errors/AppError.js";
import { createOrganization } from "../../shared/repositories/organization.repository.js";
import { createOtpSession, createOtpToken } from "../../shared/repositories/otp.repository.js";
import { assignOwnerRole } from "../../shared/repositories/role.repository.js";
import { createUser, getUserByEmail } from "../../shared/repositories/user.repository.js";
import type { RegisterInput, RegisterResult } from "../../shared/types/registration.types.js";
import { logOtpInDevelopment } from "../../shared/utils/email.util.js";
import { generateOTP } from "../../shared/utils/otp.util.js";
import { hashPassword } from "../../shared/utils/password.util.js";
import { generateUniqueSlug } from "../../shared/utils/slug.util.js";

/**
 * Registration Service
 * Handles the complete user registration flow including organization setup,
 * user creation, role assignment, and OTP generation
 */

export class RegisterService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main registration method - orchestrates the entire registration flow
	 * @param registrationData - User registration input data
	 * @param logger - Request-scoped logger for tracing
	 * @returns Registration result with user info and next steps
	 */
	async register(registrationData: RegisterInput, logger?: Logger): Promise<RegisterResult> {
		try {
			// Check email availability and verification status first (outside transaction for early exit)
			const existingUser = await getUserByEmail(this.prisma, registrationData.email);
			if (existingUser) {
				if (!existingUser.verified) {
					throw emailNotVerified(registrationData.email);
				}
				throw conflict("Email already registered");
			}

			// Hash password before transaction
			const passwordHash = await hashPassword(registrationData.password);

			// Execute registration in transaction
			const result = await this.prisma.$transaction(async (tx) => {
				// 1. Generate unique organization slug
				const slug = await generateUniqueSlug(tx, registrationData.organizationName);

				// 2. Create organization
				const organization = await createOrganization(tx, registrationData.organizationName, slug);

				// 3. Create user with profile
				const user = await createUser(tx, {
					email: registrationData.email,
					passwordHash,
					organizationId: organization.id,
					firstName: registrationData.firstName,
					lastName: registrationData.lastName,
				});

				// 4. Assign owner role (will throw if role doesn't exist - fail fast)
				await assignOwnerRole(tx, user.id, organization.id);

				// 5. Generate OTP
				const otpCode = generateOTP();

				// 6. Create OTP session
				const otpSession = await createOtpSession(tx, {
					userId: user.id,
					organizationId: organization.id,
					email: registrationData.email,
					ipAddress: registrationData.ipAddress,
					userAgent: registrationData.userAgent,
				});

				// 7. Create OTP token
				const otpToken = await createOtpToken(tx, otpSession.id, otpCode);

				// 8. Log OTP in development
				logOtpInDevelopment(registrationData.email, otpCode, otpToken.expiresAt, "registration");

				// 9. Create audit log
				await tx.auditLog.create({
					data: {
						userId: user.id,
						organizationId: organization.id,
						action: "USER_REGISTERED",
						resource: "USER",
						resourceId: user.id,
						metadata: {
							email: registrationData.email,
							organizationName: registrationData.organizationName,
							ipAddress: registrationData.ipAddress,
							userAgent: registrationData.userAgent,
						},
					},
				});

				// Log successful registration
				logger?.info(
					{
						userId: user.id,
						organizationId: organization.id,
						email: registrationData.email,
					},
					"User registration completed",
				);

				return {
					otpExpiresAt: otpToken.expiresAt,
				};
			});

			return result;
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger?.error(
					{
						email: registrationData.email,
						ipAddress: registrationData.ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during registration",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
