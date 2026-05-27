// Serverless function — crea una preferencia de Mercado Pago y devuelve init_point
// Requiere ENV var en Vercel: MP_ACCESS_TOKEN
// Opcional ENV var: SITE_URL (default: https://www.barfirenzina.com.ar)

export default async function handler(req, res) {
  // CORS para llamadas desde el mismo dominio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel' });
  }

  const SITE_URL = process.env.SITE_URL || 'https://www.barfirenzina.com.ar';

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'No hay items en el carrito' });
    }

    const cleanItems = items.map((it) => ({
      id: String(it.id || ''),
      title: String(it.title || 'Producto BARFirenzina').slice(0, 256),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      unit_price: Math.max(0, Number(it.unit_price) || 0),
      currency_id: it.currency_id || 'ARS',
      picture_url: it.picture_url || undefined,
    }));

    const preference = {
      items: cleanItems,
      back_urls: {
        success: `${SITE_URL}/gracias`,
        failure: `${SITE_URL}/error`,
        pending: `${SITE_URL}/pendiente`,
      },
      auto_return: 'approved',
      statement_descriptor: 'BARFIRENZINA',
      binary_mode: false,
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error('MP error:', data);
      return res.status(mpRes.status).json({ error: 'Mercado Pago rechazó la preferencia', detail: data });
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno', detail: String(err) });
  }
}
