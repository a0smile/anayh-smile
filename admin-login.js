export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), { status: 405, headers });
  }

  const stored = context.env.ADMIN_PASSWORD || '';

  if (!stored) {
    return new Response(JSON.stringify({ ok: false, message: 'not configured' }), {
      status: 500,
      headers
    });
  }

  try {
    const body = await context.request.json();
    const submitted = body && typeof body.code === 'string' ? body.code.trim() : '';
    const ok = submitted !== '' && submitted === stored.trim();

    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 401,
      headers
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }
}