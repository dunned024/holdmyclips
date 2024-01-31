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

export function readableTimestamp(timestamp: Date) {
  const isoStrings = timestamp.toISOString().split('T');
  return `${isoStrings[0]} @ ${isoStrings[1].substring(0, 5)}`;
}
