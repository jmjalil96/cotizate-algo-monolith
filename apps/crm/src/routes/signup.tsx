import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Building2, Mail, User } from "lucide-react";
import { useForm } from "react-hook-form";
import type { NormalizedApiError } from "../shared/api/errors";
import {
	AuthButton,
	AuthContainer,
	AuthFormField,
	AuthLayout,
	AuthLink,
	AuthPasswordField,
} from "../shared/components/auth";
import { PasswordStrengthIndicator } from "../shared/components/forms/PasswordStrengthIndicator";
import { type RegisterRequest, registerRequestSchema } from "../shared/schemas/auth";
import { useAuthStore } from "../shared/store/authStore";

export const Route = createFileRoute("/signup")({
	beforeLoad: () => {
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: Signup,
});

function Signup() {
	const { register: registerUser, isLoading } = useAuthStore();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
		watch,
	} = useForm<RegisterRequest>({
		resolver: zodResolver(registerRequestSchema),
		mode: "onBlur",
	});

	// Watch password for strength indicator
	const watchedPassword = watch("password", "");

	const onSubmit = async (data: RegisterRequest) => {
		try {
			await registerUser(data);
			// Redirect to verification with email parameter
			navigate({
				to: "/verify-email",
				search: { email: data.email },
			});
		} catch (error) {
			const normalized = error as NormalizedApiError<{ errors?: Record<string, string> }>;

			// Handle field-specific errors from backend
			const fieldErrors = normalized.data?.errors;
			if (fieldErrors) {
				// Map backend field errors to React Hook Form
				Object.entries(fieldErrors).forEach(([field, message]) => {
					if (
						field === "email" ||
						field === "firstName" ||
						field === "lastName" ||
						field === "password" ||
						field === "organizationName"
					) {
						setError(field as keyof RegisterRequest, {
							type: "server",
							message,
						});
					}
				});
			} else {
				// Generic error for root
				setError("root", {
					type: "manual",
					message: `Error en el registro: ${normalized.message}`,
				});
			}
		}
	};

	return (
		<AuthLayout
			visualProps={{
				title: "Únete a la revolución",
				subtitle: "de seguros",
				description:
					"Crea tu cuenta y accede a la plataforma más avanzada para gestión de seguros.",
				stats: [
					{ value: "1000+", label: "Empresas" },
					{ value: "50K+", label: "Pólizas" },
					{ value: "99.9%", label: "Uptime" },
				],
			}}
		>
			<AuthContainer title="Crear cuenta" subtitle="Únete a CotízateAlgo">
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{errors.root && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600">{errors.root.message}</p>
						</div>
					)}

					{/* Name Fields Row */}
					<div className="grid grid-cols-2 gap-4">
						<AuthFormField
							{...register("firstName")}
							label="Nombre"
							type="text"
							placeholder="Tu nombre"
							icon={User}
							error={errors.firstName}
							disabled={isSubmitting || isLoading}
							required
						/>

						<AuthFormField
							{...register("lastName")}
							label="Apellido"
							type="text"
							placeholder="Tu apellido"
							icon={User}
							error={errors.lastName}
							disabled={isSubmitting || isLoading}
							required
						/>
					</div>

					<AuthFormField
						{...register("email")}
						label="Correo electrónico"
						type="email"
						placeholder="tu@email.com"
						icon={Mail}
						error={errors.email}
						disabled={isSubmitting || isLoading}
						required
					/>

					<div className="space-y-2">
						<AuthPasswordField
							{...register("password")}
							label="Contraseña"
							placeholder="Crea una contraseña segura"
							error={errors.password}
							disabled={isSubmitting || isLoading}
							required
						/>
						<PasswordStrengthIndicator password={watchedPassword} />
					</div>

					<AuthFormField
						{...register("organizationName")}
						label="Nombre de la organización"
						type="text"
						placeholder="Nombre de tu empresa"
						icon={Building2}
						error={errors.organizationName}
						disabled={isSubmitting || isLoading}
						required
					/>

					<AuthButton
						type="submit"
						loading={isSubmitting || isLoading}
						loadingText="Creando cuenta..."
					>
						Crear Cuenta
					</AuthButton>
				</form>

				{/* Login Link */}
				<div className="mt-8 text-center">
					<p className="text-gray-600">
						¿Ya tienes una cuenta? <AuthLink href="/login">Inicia sesión</AuthLink>
					</p>
				</div>
			</AuthContainer>
		</AuthLayout>
	);
}
