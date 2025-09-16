import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { Mail } from "lucide-react";
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
import { type LoginRequest, loginRequestSchema } from "../shared/schemas/auth";
import { useAuthStore } from "../shared/store/authStore";

interface LoginSearch {
	verified?: string;
	passwordReset?: string;
}

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => {
		return {
			verified: typeof search.verified === "string" ? search.verified : undefined,
			passwordReset: typeof search.passwordReset === "string" ? search.passwordReset : undefined,
		};
	},
	beforeLoad: () => {
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: Login,
});

function Login() {
	const { login, isLoading } = useAuthStore();
	const navigate = useNavigate();
	const { verified, passwordReset } = useSearch({ from: "/login" });

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
	} = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		mode: "onBlur",
	});

	const onSubmit = async (data: LoginRequest) => {
		try {
			await login(data.email, data.password);
			navigate({ to: "/" });
		} catch (error) {
			const { message: errorMessage } = error as NormalizedApiError;
			setError("root", {
				type: "manual",
				message: `Login failed: ${errorMessage}`,
			});
		}
	};

	return (
		<AuthLayout>
			<AuthContainer title="Bienvenido de vuelta" subtitle="Inicia sesión en tu cuenta">
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Success Messages */}
					{verified === "true" && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<p className="text-sm text-green-600 text-center">
								¡Email verificado exitosamente! Ahora puedes iniciar sesión.
							</p>
						</div>
					)}

					{passwordReset === "true" && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<p className="text-sm text-green-600 text-center">
								¡Contraseña restablecida exitosamente! Inicia sesión con tu nueva contraseña.
							</p>
						</div>
					)}

					{errors.root && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600">{errors.root.message}</p>
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

					<AuthPasswordField
						{...register("password")}
						label="Contraseña"
						placeholder="Ingresa tu contraseña"
						error={errors.password}
						disabled={isSubmitting || isLoading}
						required
					/>

					{/* Forgot Password */}
					<div className="text-right">
						<AuthLink href="/forgot-password">¿Olvidaste tu contraseña?</AuthLink>
					</div>

					<AuthButton
						type="submit"
						loading={isSubmitting || isLoading}
						loadingText="Iniciando sesión..."
					>
						Iniciar Sesión
					</AuthButton>
				</form>

				{/* Sign Up Link */}
				<div className="mt-8 text-center">
					<p className="text-gray-600">
						¿No tienes una cuenta? <AuthLink href="/signup">Regístrate</AuthLink>
					</p>
				</div>
			</AuthContainer>
		</AuthLayout>
	);
}
