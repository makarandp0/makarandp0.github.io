export async function getCreds(env) {
  const auth = await import('../app/server/twilio_credentials.json');
  console.log('auth:', auth);
  return auth[env];
}
