import { useEffect, useState } from "react";

interface CountdownTimerProps {
	targetDate: Date;
	onExpire?: () => void;
	className?: string;
	prefix?: string;
	expiredText?: string;
}

export function CountdownTimer({
	targetDate,
	onExpire,
	className = "",
	prefix = "",
	expiredText = "Expirado",
}: CountdownTimerProps) {
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		const updateTimer = () => {
			const now = Date.now();
			const target = targetDate.getTime();
			const difference = target - now;

			if (difference <= 0) {
				setTimeLeft(0);
				if (!isExpired) {
					setIsExpired(true);
					onExpire?.();
				}
			} else {
				setTimeLeft(difference);
				setIsExpired(false);
			}
		};

		// Update immediately
		updateTimer();

		// Update every second
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [targetDate, onExpire, isExpired]);

	const formatTime = (milliseconds: number) => {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	if (isExpired) {
		return <span className={`text-red-600 ${className}`}>{expiredText}</span>;
	}

	return (
		<span className={`text-gray-600 ${className}`}>
			{prefix}
			{formatTime(timeLeft)}
		</span>
	);
}
