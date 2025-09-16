import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Mail, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { NormalizedApiError } from "../shared/api/errors";
import { AuthButton, AuthContainer, AuthLayout, AuthLink } from "../shared/components/auth";
import { CountdownTimer } from "../shared/components/forms/CountdownTimer";
import { OTPInput } from "../shared/components/forms/OTPInput";
import { useAuthStore } from "../shared/store/authStore";

interface VerifyEmailSearch {
	email?: string;
}

export const Route = createFileRoute("/verify-email")({
	validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => {
		return {
			email: typeof search.email === "string" ? search.email : undefined,
		};
	},
	component: VerifyEmail,
});

function VerifyEmail() {
	const { verifyEmail, resendCode, isLoading } = useAuthStore();
	const navigate = useNavigate();
	const { email } = useSearch({ from: "/verify-email" });

	const [otpCode, setOtpCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
	const [resendCooldownUntil, setResendCooldownUntil] = useState<Date | null>(null);
	const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

	// Redirect if no email provided
	useEffect(() => {
		if (!email) {
			navigate({ to: "/signup" });
		}
	}, [email, navigate]);

	// Set initial OTP expiry (15 minutes from now as default)
	useEffect(() => {
		if (!otpExpiresAt) {
			setOtpExpiresAt(new Date(Date.now() + 15 * 60 * 1000));
		}
	}, [otpExpiresAt]);

	const handleVerify = async () => {
		if (!email || otpCode.length !== 6) return;

		setError(null);
		setSuccess(null);

		try {
			await verifyEmail({ email, otpCode });
			setSuccess("¡Email verificado exitosamente!");

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate({
					to: "/login",
					search: { verified: "true" },
				});
			}, 2000);
		} catch (error: unknown) {
			const normalized = error as NormalizedApiError<{ message?: string; waitSeconds?: number }>;
			const errorMessage = normalized.message || "Error de verificación";

			// Extract attempts remaining from error message if available
			const attemptsMatch = errorMessage.match(/(\d+) attempts remaining/);
			if (attemptsMatch) {
				setAttemptsRemaining(Number.parseInt(attemptsMatch[1], 10));
			}

			// Handle rate limiting errors
			if (normalized.status === 429) {
				// Priority: API data > Retry-After header > fixed fallback
				const waitSeconds = normalized.data?.waitSeconds || normalized.retryAfterSeconds || 60;
				setResendCooldownUntil(new Date(Date.now() + waitSeconds * 1000));
			}

			setError(errorMessage);
		}
	};

	const handleResend = async () => {
		if (!email) return;

		setError(null);
		setSuccess(null);

		try {
			const response = await resendCode({ email });
			setSuccess("Nuevo código enviado a tu email");

			// Set new expiry time if provided
			if (response.otpExpiresAt) {
				setOtpExpiresAt(new Date(response.otpExpiresAt));
			}

			// Set cooldown period (60 seconds)
			setResendCooldownUntil(new Date(Date.now() + 60 * 1000));

			// Clear OTP input
			setOtpCode("");
		} catch (error: unknown) {
			const normalized = error as NormalizedApiError<{ message?: string; waitSeconds?: number }>;
			const errorMessage = normalized.message || "Error al reenviar código";

			// Handle rate limiting
			if (normalized.status === 429) {
				// Priority: API data > Retry-After header > fixed fallback
				const waitSeconds = normalized.data?.waitSeconds || normalized.retryAfterSeconds || 60;
				setResendCooldownUntil(new Date(Date.now() + waitSeconds * 1000));
			}

			setError(errorMessage);
		}
	};

	const canResend = !resendCooldownUntil || new Date() > resendCooldownUntil;

	if (!email) {
		return null; // Will redirect to signup
	}

	return (
		<AuthLayout
			visualProps={{
				title: "Verificación segura",
				subtitle: "casi listo",
				description:
					"Hemos enviado un código de verificación a tu correo electrónico para confirmar tu identidad.",
				stats: [
					{ value: "15min", label: "Validez" },
					{ value: "6", label: "Dígitos" },
					{ value: "99.9%", label: "Entrega" },
				],
			}}
		>
			<AuthContainer
				title="Verifica tu correo"
				subtitle="Hemos enviado un código a tu email"
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

					{/* OTP Input */}
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
									error={!!error}
								/>
							</div>
						</div>

						{/* Timer and Instructions */}
						<div className="text-center space-y-2">
							{otpExpiresAt && (
								<CountdownTimer
									targetDate={otpExpiresAt}
									prefix="Expira en: "
									className="text-sm"
									onExpire={() => setError("El código ha expirado. Solicita uno nuevo.")}
								/>
							)}
							<p className="text-xs text-gray-500">
								Ingresa el código de 6 dígitos que enviamos a tu email
							</p>
						</div>
					</div>

					{/* Verify Button */}
					<AuthButton
						type="button"
						onClick={handleVerify}
						loading={isLoading}
						loadingText="Verificando..."
						disabled={otpCode.length !== 6 || !!success}
					>
						Verificar Email
					</AuthButton>

					{/* Resend Section */}
					<div className="text-center space-y-3">
						<p className="text-sm text-gray-600">¿No recibiste el código?</p>

						{canResend ? (
							<AuthButton
								type="button"
								variant="secondary"
								onClick={handleResend}
								loading={isLoading}
								loadingText="Reenviando..."
								icon={false}
							>
								<RefreshCcw className="w-4 h-4 mr-2" />
								Reenviar código
							</AuthButton>
						) : (
							<div className="text-sm text-gray-500">
								Podrás reenviar en{" "}
								{resendCooldownUntil && (
									<CountdownTimer targetDate={resendCooldownUntil} className="font-medium" />
								)}
							</div>
						)}
					</div>

					{/* Back to Signup */}
					<div className="text-center pt-4 border-t">
						<AuthLink href="/signup">Volver al registro</AuthLink>
					</div>
				</div>
			</AuthContainer>
		</AuthLayout>
	);
}
