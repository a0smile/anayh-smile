/**
 * POST /api/save-content
 * Body: { code: string, content: object }
 *
 * يحفظ content.json تلقائياً في مستودع GitHub (إن وُجدت الأسرار)
 * الأسرار المطلوبة في Cloudflare Pages → Settings → Environment variables:
 *   ADMIN_PASSWORD   (موجود مسبقاً)
 *   GITHUB_TOKEN     (Personal Access Token بصلاحية contents:write)
 *   GITHUB_REPO      (مثال: username/smile-care)
 *   GITHUB_BRANCH    (اختياري، افتراضي main)
 *   GITHUB_PATH      (اختياري، افتراضي content.json)
 */
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
    return new Response(JSON.stringify({ ok: false, message: 'method' }), {
      status: 405,
      headers
    });
  }

  const adminPass = context.env.ADMIN_PASSWORD || '';
  if (!adminPass) {
    return new Response(
      JSON.stringify({ ok: false, message: 'not configured' }),
      { status: 500, headers }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: 'bad json' }), {
      status: 400,
      headers
    });
  }

  const code = body && typeof body.code === 'string' ? body.code : '';
  if (code !== adminPass) {
    return new Response(JSON.stringify({ ok: false, message: 'unauthorized' }), {
      status: 401,
      headers
    });
  }

  const content = body && body.content;
  if (!content || typeof content !== 'object') {
    return new Response(JSON.stringify({ ok: false, message: 'no content' }), {
      status: 400,
      headers
    });
  }

  const token = context.env.GITHUB_TOKEN || '';
  const repo = context.env.GITHUB_REPO || '';
  const branch = context.env.GITHUB_BRANCH || 'main';
  const path = context.env.GITHUB_PATH || 'content.json';

  // بدون GitHub: نحفظ محلياً فقط ونخبر المستخدم
  if (!token || !repo) {
    return new Response(
      JSON.stringify({
        ok: true,
        remote: false,
        message:
          'saved-local-only: أضف GITHUB_TOKEN و GITHUB_REPO في Cloudflare ليتم التحديث التلقائي للملف'
      }),
      { status: 200, headers }
    );
  }

  try {
    const fileUrl =
      'https://api.github.com/repos/' + repo + '/contents/' + path + '?ref=' + encodeURIComponent(branch);

    // جلب الـ sha الحالي إن وُجد
    let sha = null;
    const getRes = await fetch(fileUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'smile-care-admin'
      }
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha || null;
    }

    const jsonText = JSON.stringify(content, null, 2);
    // base64 بدون Buffer (Workers)
    const bytes = new TextEncoder().encode(jsonText);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const contentB64 = btoa(binary);

    const putBody = {
      message: 'تحديث محتوى الموقع من لوحة المالك',
      content: contentB64,
      branch
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(
      'https://api.github.com/repos/' + repo + '/contents/' + path,
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'smile-care-admin'
        },
        body: JSON.stringify(putBody)
      }
    );

    if (!putRes.ok) {
      const errText = await putRes.text();
      return new Response(
        JSON.stringify({
          ok: false,
          remote: false,
          message: 'github error',
          detail: errText.slice(0, 300)
        }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        remote: true,
        message: 'تم الحفظ وإرساله إلى content.json بنجاح'
      }),
      { status: 200, headers }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'exception',
        detail: String(e && e.message ? e.message : e)
      }),
      { status: 500, headers }
    );
  }
}
