// Recibe el código de GitHub, lo cambia por un token y se lo entrega a Decap CMS.
export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('Faltan GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET en Vercel.');
    return;
  }

  let content, status;
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const data = await r.json();
    if (data.access_token) {
      status = 'success';
      content = { token: data.access_token, provider: 'github' };
    } else {
      status = 'error';
      content = { error: data.error_description || 'No se pudo obtener el token' };
    }
  } catch (e) {
    status = 'error';
    content = { error: 'Error de red al autenticar' };
  }

  const payload = JSON.stringify(content);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:${status}:${payload.replace(/"/g, '\\"')}',
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script>
<p>Autenticando… podés cerrar esta ventana.</p>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
