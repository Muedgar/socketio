export async function getDemoToken(userId: string, role: 'user' | 'admin' = 'user') {
  const response = await fetch(`http://localhost:3001/auth/demo-token/${userId}?role=${role}`);

  if (!response.ok) {
    throw new Error(`Could not get demo token: ${response.status}`);
  }

  const data = (await response.json()) as { token: string };
  return data.token;
}
