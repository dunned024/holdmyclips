export function formatTime(value: number) {
  return new Date(value).toISOString().slice(14, 19);
}

export function secondsToMMSS(value: number) {
  const secondsPastMinute = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secondsPastMinute}`;
}

export function readableTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const yyyymmdd = date.toISOString().split('T')[0];
  const hhmmss = date.toTimeString().split(' ')[0];
  return `${yyyymmdd} @ ${hhmmss}`;
}

export function getTimeSinceString(timestamp: number) {
  const timestampInSeconds = Math.round(timestamp / 1000);
  const nowInSeconds = Math.round(Date.now() / 1000);
  const timeDiff = nowInSeconds - timestampInSeconds;

  const [
    HOUR_IN_SECONDS,
    DAY_IN_SECONDS,
    WEEK_IN_SECONDS,
    MONTH_IN_SECONDS,
    YEAR_IN_SECONDS
  ] = [3600, 86400, 604800, 2592000, 31536000];

  if (timeDiff <= HOUR_IN_SECONDS) {
    return '< 1 hour ago';
  } else if (timeDiff <= DAY_IN_SECONDS) {
    const hours = Math.floor(timeDiff / HOUR_IN_SECONDS);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (timeDiff <= WEEK_IN_SECONDS) {
    const days = Math.floor(timeDiff / DAY_IN_SECONDS);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (timeDiff <= MONTH_IN_SECONDS) {
    const weeks = Math.floor(timeDiff / WEEK_IN_SECONDS);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (timeDiff <= YEAR_IN_SECONDS) {
    const months = Math.floor(timeDiff / MONTH_IN_SECONDS);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(timeDiff / YEAR_IN_SECONDS);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
