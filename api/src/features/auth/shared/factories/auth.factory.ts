import type { PrismaClient } from "@prisma/client";
import { ChangePasswordService } from "../../domain/password/changePassword.service.js";
import { ForgotPasswordService } from "../../domain/password/forgotPassword.service.js";
import { ResetPasswordService } from "../../domain/password/resetPassword.service.js";
import { MeService } from "../../domain/profile/me.service.js";
import { EmailVerificationService } from "../../domain/registration/emailVerification.service.js";
import { RegisterService } from "../../domain/registration/register.service.js";
import { ResendService } from "../../domain/registration/resend.service.js";
import { LoginService } from "../../domain/session/login.service.js";
import { LogoutService } from "../../domain/session/logout.service.js";

/**
 * Auth Services Interface
 * Defines all authentication-related services available through the factory
 */
export interface AuthServices {
	registerService: RegisterService;
	emailVerificationService: EmailVerificationService;
	resendService: ResendService;
	loginService: LoginService;
	logoutService: LogoutService;
	meService: MeService;
	forgotPasswordService: ForgotPasswordService;
	resetPasswordService: ResetPasswordService;
	changePasswordService: ChangePasswordService;
}

/**
 * Create Auth Services Factory
 * Factory pattern for dependency injection and easier testing
 * @param prisma - Prisma client instance (can be mocked for testing)
 * @returns Object containing all auth services
 */
export function createAuthServices(prisma: PrismaClient): AuthServices {
	return {
		registerService: new RegisterService(prisma),
		emailVerificationService: new EmailVerificationService(prisma),
		resendService: new ResendService(prisma),
		loginService: new LoginService(prisma),
		logoutService: new LogoutService(prisma),
		meService: new MeService(prisma),
		forgotPasswordService: new ForgotPasswordService(prisma),
		resetPasswordService: new ResetPasswordService(prisma),
		changePasswordService: new ChangePasswordService(prisma),
	};
}

/**
 * Create Mock Auth Services Factory (for testing)
 * @param overrides - Partial services to override
 * @returns Mocked auth services
 */
export function createMockAuthServices(overrides?: Partial<AuthServices>): AuthServices {
	return {
		registerService: overrides?.registerService || ({} as RegisterService),
		emailVerificationService:
			overrides?.emailVerificationService || ({} as EmailVerificationService),
		resendService: overrides?.resendService || ({} as ResendService),
		loginService: overrides?.loginService || ({} as LoginService),
		logoutService: overrides?.logoutService || ({} as LogoutService),
		meService: overrides?.meService || ({} as MeService),
		forgotPasswordService: overrides?.forgotPasswordService || ({} as ForgotPasswordService),
		resetPasswordService: overrides?.resetPasswordService || ({} as ResetPasswordService),
		changePasswordService: overrides?.changePasswordService || ({} as ChangePasswordService),
	};
}
