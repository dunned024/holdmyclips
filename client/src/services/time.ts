export function formatTime(value: number) {
  return new Date(value).toISOString().slice(14, 19);
}

export function secondsToMMSS(value: number) {
  const secondsPastMinute = Math.floor(value % 60);
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secondsPastMinute}`;
}
