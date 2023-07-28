
export async function getUsername() {
  const res = await fetch('/user');
  const data = await res.json();
  return data.username
}
