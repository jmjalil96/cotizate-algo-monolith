import { forwardRef } from "react";
import type { FormFieldProps } from "../../types/forms";

/**
 * Reusable form field component with consistent styling
 * Maintains the same Tailwind classes as the original login form
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
	(
		{ name, label, type = "text", placeholder, error, required, disabled, className, ...props },
		ref,
	) => {
		const inputId = `form-field-${name}`;

		return (
			<div className={className}>
				<label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
				<input
					{...props}
					ref={ref}
					id={inputId}
					name={name}
					type={type}
					placeholder={placeholder}
					disabled={disabled}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={error ? `${inputId}-error` : undefined}
					className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
						error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
					}`}
				/>
				{error && (
					<p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
						{error.message}
					</p>
				)}
			</div>
		);
	},
);

FormField.displayName = "FormField";
