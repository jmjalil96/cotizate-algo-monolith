import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
	password: string;
	className?: string;
}

interface PasswordRule {
	label: string;
	test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
	{
		label: "Al menos 8 caracteres",
		test: (password) => password.length >= 8,
	},
	{
		label: "Una letra mayúscula",
		test: (password) => /[A-Z]/.test(password),
	},
	{
		label: "Una letra minúscula",
		test: (password) => /[a-z]/.test(password),
	},
	{
		label: "Un número",
		test: (password) => /[0-9]/.test(password),
	},
];

export function PasswordStrengthIndicator({
	password,
	className = "",
}: PasswordStrengthIndicatorProps) {
	const passedRules = passwordRules.filter((rule) => rule.test(password));
	const strength = passedRules.length;
	const isComplete = strength === passwordRules.length;

	// Don't show indicator if password is empty
	if (!password) return null;

	const getStrengthColor = () => {
		if (strength <= 1) return "bg-red-500";
		if (strength <= 2) return "bg-orange-500";
		if (strength <= 3) return "bg-yellow-500";
		return "bg-green-500";
	};

	const getStrengthText = () => {
		if (strength <= 1) return "Muy débil";
		if (strength <= 2) return "Débil";
		if (strength <= 3) return "Buena";
		return "Excelente";
	};

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Strength Bar */}
			<div className="space-y-1">
				<div className="flex justify-between text-xs">
					<span className="text-gray-600">Seguridad de la contraseña</span>
					<span className={`font-medium ${isComplete ? "text-green-600" : "text-gray-600"}`}>
						{getStrengthText()}
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
						style={{ width: `${(strength / passwordRules.length) * 100}%` }}
					/>
				</div>
			</div>

			{/* Rules Checklist */}
			<div className="space-y-1">
				{passwordRules.map((rule) => {
					const isPassed = rule.test(password);
					return (
						<div key={rule.label} className="flex items-center gap-2 text-xs">
							{isPassed ? (
								<Check className="w-3 h-3 text-green-500" />
							) : (
								<X className="w-3 h-3 text-gray-400" />
							)}
							<span className={isPassed ? "text-green-600" : "text-gray-500"}>{rule.label}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
