/**
 * Custom time-ago function without third-party libraries.
 * Converts a date string or Date object to a human-readable relative time.
 */

interface TimeUnit {
    unit: string;
    seconds: number;
}

const TIME_UNITS: TimeUnit[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
];

export function timeAgo(date: string | Date): string {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;

    // Handle invalid dates
    if (isNaN(past.getTime())) {
        return 'Invalid date';
    }

    const secondsAgo = Math.floor((now.getTime() - past.getTime()) / 1000);

    // Handle future dates
    if (secondsAgo < 0) {
        return 'In the future';
    }

    // Handle "just now" case
    if (secondsAgo < 5) {
        return 'Just now';
    }

    // Find the appropriate time unit
    for (const { unit, seconds } of TIME_UNITS) {
        const interval = Math.floor(secondsAgo / seconds);

        if (interval >= 1) {
            // Handle pluralization
            const plural = interval === 1 ? '' : 's';
            return `${interval} ${unit}${plural} ago`;
        }
    }

    return 'Just now';
}

/**
 * Format a date for display with both relative and absolute time.
 */
export function formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
