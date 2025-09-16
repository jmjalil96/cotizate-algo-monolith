import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Mail, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import {
	AuthButton,
	AuthContainer,
	AuthFormField,
	AuthLayout,
	AuthLink,
} from "../shared/components/auth";
import { type ForgotPasswordRequest, forgotPasswordRequestSchema } from "../shared/schemas/auth";
import { useAuthStore } from "../shared/store/authStore";

export const Route = createFileRoute("/forgot-password")({
	beforeLoad: () => {
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: ForgotPassword,
});

function ForgotPassword() {
	const { forgotPassword, isLoading } = useAuthStore();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
	} = useForm<ForgotPasswordRequest>({
		resolver: zodResolver(forgotPasswordRequestSchema),
		mode: "onBlur",
	});

	const onSubmit = async (data: ForgotPasswordRequest) => {
		try {
			await forgotPassword(data);
			// Always redirect to reset password page (security design)
			navigate({
				to: "/reset-password",
				search: { email: data.email },
			});
		} catch (_error) {
			// Even on error, show generic message for security (prevent email enumeration)
			const errorMessage = "Ha ocurrido un error. Por favor intenta nuevamente.";
			setError("root", {
				type: "manual",
				message: errorMessage,
			});
		}
	};

	return (
		<AuthLayout
			visualProps={{
				title: "Recuperación segura",
				subtitle: "de contraseña",
				description: "Te ayudaremos a recuperar el acceso a tu cuenta de forma segura y rápida.",
				stats: [
					{ value: "15min", label: "Validez" },
					{ value: "6", label: "Dígitos" },
					{ value: "100%", label: "Seguro" },
				],
			}}
		>
			<AuthContainer title="Recuperar contraseña" subtitle="Ingresa tu correo electrónico">
				<div className="space-y-6">
					{/* Security Notice */}
					<div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
						<Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
						<div className="text-sm text-blue-800">
							<p className="font-medium mb-1">Proceso seguro</p>
							<p>
								Te enviaremos un código de verificación para restablecer tu contraseña de forma
								segura.
							</p>
						</div>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{errors.root && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-600 text-center">{errors.root.message}</p>
							</div>
						)}

						<AuthFormField
							{...register("email")}
							label="Correo electrónico"
							type="email"
							placeholder="Ingresa tu correo electrónico"
							icon={Mail}
							error={errors.email}
							disabled={isSubmitting || isLoading}
							required
						/>

						<AuthButton
							type="submit"
							loading={isSubmitting || isLoading}
							loadingText="Enviando código..."
						>
							Enviar Código de Recuperación
						</AuthButton>
					</form>

					{/* Back to Login */}
					<div className="text-center">
						<AuthLink href="/login">Volver al inicio de sesión</AuthLink>
					</div>
				</div>
			</AuthContainer>
		</AuthLayout>
	);
}
