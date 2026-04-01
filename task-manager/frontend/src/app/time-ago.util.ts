const TIME_SEGMENTS = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return 'invalid date';
  }

  const secondsElapsed = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondsElapsed <= 4) {
    return 'just now';
  }

  if (secondsElapsed < 0) {
    return 'in the future';
  }

  for (const segment of TIME_SEGMENTS) {
    const amount = Math.floor(secondsElapsed / segment.seconds);

    if (amount >= 1) {
      return `${amount} ${segment.unit}${amount === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return 'invalid date';
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
