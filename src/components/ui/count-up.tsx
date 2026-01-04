import { useEffect, useState } from "react";

interface CountUpProps {
    end: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function CountUp({
    end,
    duration = 1000,
    decimals = 0,
    prefix = "",
    suffix = "",
    className = ""
}: CountUpProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCount(progress * end);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [end, duration]);

    // Format the formatting
    const formattedCount = count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span className={className}>
            {prefix}{formattedCount}{suffix}
        </span>
    );
}
