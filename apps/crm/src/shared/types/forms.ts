/**
 * Form-specific types and utilities for React Hook Form integration
 */

import type { FieldError, FieldPath, FieldValues } from "react-hook-form";

/**
 * Generic form field props for reusable components
 */
export interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> {
	name: FieldPath<TFieldValues>;
	label: string;
	type?: "text" | "email" | "password" | "tel" | "url";
	placeholder?: string;
	error?: FieldError;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

/**
 * Form error display props
 */
export interface FormErrorProps {
	error?: FieldError;
	className?: string;
}

/**
 * Form state helpers
 */
export type FormState = {
	isSubmitting: boolean;
	isValid: boolean;
	isDirty: boolean;
};
