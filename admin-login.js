export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // معالجة طلبات OPTIONS (يفتح الاتصال بين المتصفح والخادم)
  if (context.request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  // نقبل طلبات POST فقط (إرسال كلمة المرور)
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), { status: 405, headers });
  }

  // نقرأ كلمة المرور الصحيحة من متغير Cloudflare السري (ليست في أي ملف)
  const stored = context.env.ADMIN_PASSWORD || '';

  // لو المتغير غير مضبوط في Cloudflare، نُخبر بأنه غير مُهيّأ
  if (!stored) {
    return new Response(JSON.stringify({ ok: false, message: 'not configured' }), {
      status: 500,
      headers
    });
  }

  try {
    // نقرأ ما أرسله المتصفح ونقارنه بكلمة المرور الحقيقية
    const body = await context.request.json();
    const submitted = body && typeof body.code === 'string' ? body.code : '';
    const ok = submitted === stored;

    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 401,
      headers
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }
}