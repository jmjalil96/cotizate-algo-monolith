import type { FormErrorProps } from "../../types/forms";

/**
 * Standalone form error component for displaying validation errors
 */
export function FormError({ error, className = "" }: FormErrorProps) {
	if (!error) return null;

	return (
		<p className={`text-sm text-red-600 ${className}`} role="alert">
			{error.message}
		</p>
	);
}
