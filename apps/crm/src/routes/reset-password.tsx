import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { NormalizedApiError } from "../shared/api/errors";
import {
	AuthButton,
	AuthContainer,
	AuthLayout,
	AuthLink,
	AuthPasswordField,
} from "../shared/components/auth";
import { CountdownTimer } from "../shared/components/forms/CountdownTimer";
import { OTPInput } from "../shared/components/forms/OTPInput";
import { PasswordConfirmField } from "../shared/components/forms/PasswordConfirmField";
import { PasswordStrengthIndicator } from "../shared/components/forms/PasswordStrengthIndicator";
import { resetPasswordRequestSchema } from "../shared/schemas/auth";
import { useAuthStore } from "../shared/store/authStore";

interface ResetPasswordSearch {
	email?: string;
}

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
		return {
			email: typeof search.email === "string" ? search.email : undefined,
		};
	},
	component: ResetPassword,
});

function ResetPassword() {
	const { resetPassword, isLoading } = useAuthStore();
	const navigate = useNavigate();
	const { email } = useSearch({ from: "/reset-password" });

	const [otpCode, setOtpCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
	const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		watch,
	} = useForm<{ email: string; newPassword: string; confirmPassword: string }>({
		resolver: zodResolver(
			z
				.object({
					email: z.string().email(),
					newPassword: resetPasswordRequestSchema.shape.newPassword,
					confirmPassword: z.string().min(1, "Confirma tu contraseña"),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					message: "Las contraseñas no coinciden",
					path: ["confirmPassword"],
				}),
		),
		mode: "onBlur",
		defaultValues: {
			email: email || "",
		},
	});

	const watchedNewPassword = watch("newPassword", "");

	// Redirect if no email provided
	useEffect(() => {
		if (!email) {
			navigate({ to: "/forgot-password" });
		}
	}, [email, navigate]);

	// Set initial OTP expiry (15 minutes from now as default)
	useEffect(() => {
		if (!otpExpiresAt) {
			setOtpExpiresAt(new Date(Date.now() + 15 * 60 * 1000));
		}
	}, [otpExpiresAt]);

	const onSubmit = async (formData: {
		email: string;
		newPassword: string;
		confirmPassword: string;
	}) => {
		if (!email || otpCode.length !== 6) return;

		// Validate OTP code manually since it's not part of the form
		if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
			setError("El código debe tener exactamente 6 dígitos");
			return;
		}

		setError(null);
		setSuccess(null);

		try {
			await resetPassword({
				email: formData.email,
				otpCode,
				newPassword: formData.newPassword,
			});

			setSuccess("¡Contraseña restablecida exitosamente!");

			// Redirect to login after 3 seconds
			setTimeout(() => {
				navigate({
					to: "/login",
					search: { passwordReset: "true" },
				});
			}, 3000);
		} catch (error: unknown) {
			const normalized = error as NormalizedApiError<{ message?: string; waitSeconds?: number }>;
			const errorMessage = normalized.message || "Error al restablecer contraseña";

			// Extract attempts remaining from error message if available
			const attemptsMatch = errorMessage.match(/(\d+) attempts remaining/);
			if (attemptsMatch) {
				setAttemptsRemaining(Number.parseInt(attemptsMatch[1], 10));
			}

			setError(errorMessage);
		}
	};

	if (!email) {
		return null; // Will redirect to forgot-password
	}

	return (
		<AuthLayout
			visualProps={{
				title: "Nueva contraseña",
				subtitle: "casi terminamos",
				description:
					"Ingresa el código que enviamos a tu email y crea una nueva contraseña segura para tu cuenta.",
				stats: [
					{ value: "15min", label: "Validez" },
					{ value: "6", label: "Dígitos" },
					{ value: "100%", label: "Seguro" },
				],
			}}
		>
			<AuthContainer
				title="Restablecer contraseña"
				subtitle="Ingresa el código y tu nueva contraseña"
				showLogo={false}
			>
				<div className="space-y-6">
					{/* Email Display */}
					<div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
						<Mail className="w-5 h-5 text-blue-600" />
						<span className="text-blue-800 font-medium">{email}</span>
					</div>

					{/* Success Message */}
					{success && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<p className="text-sm text-green-600 text-center">{success}</p>
							<p className="text-xs text-green-500 text-center mt-1">
								Redirigiendo al inicio de sesión...
							</p>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600 text-center">{error}</p>
							{attemptsRemaining !== null && (
								<p className="text-xs text-red-500 text-center mt-1">
									Intentos restantes: {attemptsRemaining}
								</p>
							)}
						</div>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{/* OTP Input Section */}
						<div className="space-y-4">
							<div className="text-center">
								<div className="block text-sm font-medium text-gray-700 mb-3">
									Código de verificación
								</div>
								<div className="flex justify-center">
									<OTPInput
										value={otpCode}
										onChange={setOtpCode}
										disabled={isLoading || !!success}
										error={!!error && otpCode.length === 6}
									/>
								</div>
							</div>

							{/* Timer */}
							<div className="text-center space-y-2">
								{otpExpiresAt && (
									<CountdownTimer
										targetDate={otpExpiresAt}
										prefix="Expira en: "
										className="text-sm"
										onExpire={() =>
											setError(
												"El código ha expirado. Solicita un nuevo restablecimiento de contraseña.",
											)
										}
									/>
								)}
								<p className="text-xs text-gray-500">
									Ingresa el código de 6 dígitos que enviamos a tu email
								</p>
							</div>
						</div>

						{/* New Password Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2 mb-4">
								<Lock className="w-5 h-5 text-gray-600" />
								<span className="text-sm font-medium text-gray-700">Nueva contraseña</span>
							</div>

							<div className="space-y-2">
								<AuthPasswordField
									{...register("newPassword")}
									label="Nueva contraseña"
									placeholder="Crea una contraseña segura"
									error={errors.newPassword}
									disabled={isSubmitting || isLoading || !!success}
									required
								/>
								<PasswordStrengthIndicator password={watchedNewPassword} />
							</div>

							<PasswordConfirmField
								{...register("confirmPassword")}
								name="confirmPassword"
								label="Confirmar nueva contraseña"
								placeholder="Confirma tu nueva contraseña"
								password={watchedNewPassword}
								error={errors.confirmPassword}
								disabled={isSubmitting || isLoading || !!success}
								required
							/>
						</div>

						<AuthButton
							type="submit"
							loading={isSubmitting || isLoading}
							loadingText="Restableciendo contraseña..."
							disabled={otpCode.length !== 6 || !!success}
						>
							Restablecer Contraseña
						</AuthButton>
					</form>

					{/* Help Links */}
					<div className="text-center space-y-2 pt-4 border-t">
						<p className="text-sm text-gray-600">¿No recibiste el código?</p>
						<AuthLink href="/forgot-password">Solicitar nuevo código</AuthLink>
					</div>
				</div>
			</AuthContainer>
		</AuthLayout>
	);
}
