export function formatTime(value: number) {
  return new Date(value).toISOString().slice(14, 19);
}
