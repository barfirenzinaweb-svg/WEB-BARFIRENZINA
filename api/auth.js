// Inicia el login OAuth con GitHub para el panel /admin (Decap CMS).
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('Falta configurar GITHUB_CLIENT_ID en Vercel.');
    return;
  }
  const host = req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] || 'https');
  const redirectUri = `${proto}://${host}/api/callback`;
  const url =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    '&scope=repo' +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.writeHead(302, { Location: url });
  res.end();
}
