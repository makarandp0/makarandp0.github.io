export async function getCreds(env) {
  const auth = await import('../app/server/twilio_credentials.json');
  return auth[env];
}
