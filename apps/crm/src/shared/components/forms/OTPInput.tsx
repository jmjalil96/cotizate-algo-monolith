import { forwardRef, type KeyboardEvent, useEffect, useRef } from "react";

interface OTPInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
	disabled?: boolean;
	error?: boolean;
	className?: string;
}

export const OTPInput = forwardRef<HTMLDivElement, OTPInputProps>(
	({ value, onChange, length = 6, disabled = false, error = false, className = "" }, ref) => {
		const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

		// Initialize refs array
		useEffect(() => {
			inputRefs.current = inputRefs.current.slice(0, length);
		}, [length]);

		const handleChange = (index: number, newValue: string) => {
			// Only allow digits
			if (newValue && !/^\d$/.test(newValue)) return;

			const newOtp = value.split("");
			newOtp[index] = newValue;

			// Pad with empty strings if needed
			while (newOtp.length < length) {
				newOtp.push("");
			}

			onChange(newOtp.join(""));

			// Auto-focus next input if value was entered
			if (newValue && index < length - 1) {
				inputRefs.current[index + 1]?.focus();
			}
		};

		const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
			// Handle backspace - move to previous input if current is empty
			if (e.key === "Backspace" && !value[index] && index > 0) {
				inputRefs.current[index - 1]?.focus();
			}
			// Handle arrow keys for navigation
			else if (e.key === "ArrowLeft" && index > 0) {
				inputRefs.current[index - 1]?.focus();
			} else if (e.key === "ArrowRight" && index < length - 1) {
				inputRefs.current[index + 1]?.focus();
			}
		};

		const handlePaste = (e: React.ClipboardEvent) => {
			e.preventDefault();
			const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

			if (pastedData.length > 0) {
				const newValue = pastedData.slice(0, length).padEnd(length, "");
				onChange(newValue);

				// Focus the next empty input or the last input
				const nextIndex = Math.min(pastedData.length, length - 1);
				inputRefs.current[nextIndex]?.focus();
			}
		};

		return (
			<div ref={ref} className={`flex gap-3 ${className}`}>
				{Array.from({ length }, (_, index) => (
					<input
						// biome-ignore lint/suspicious/noArrayIndexKey: Static array order for OTP digit positions
						key={`otp-digit-${length}-${index}`}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={value[index] || ""}
						onChange={(e) => handleChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onPaste={handlePaste}
						disabled={disabled}
						className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-4 transition-all duration-200 ${
							error
								? "border-red-300 focus:border-red-500 focus:ring-red-100"
								: "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
						} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
						style={
							{
								"--tw-ring-color": error ? "rgba(239, 68, 68, 0.1)" : "rgba(9, 63, 180, 0.1)",
							} as React.CSSProperties
						}
					/>
				))}
			</div>
		);
	},
);

OTPInput.displayName = "OTPInput";
