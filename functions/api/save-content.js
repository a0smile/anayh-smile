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

  const stored = (context.env.ADMIN_PASSWORD || '').trim();
  if (!stored) {
    return new Response(JSON.stringify({ ok: false, message: 'not configured' }), { status: 500, headers });
  }

  try {
    const body = await context.request.json();
    const submitted = body && typeof body.code === 'string' ? body.code.trim() : '';
    const content = body ? body.content : null;

    if (submitted !== stored) {
      return new Response(JSON.stringify({ ok: false }), { status: 401, headers });
    }

    if (!content) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
    }

    const token = (context.env.GITHUB_TOKEN || '').trim();
    const repo = (context.env.GITHUB_REPO || '').trim();
    const branch = (context.env.GITHUB_BRANCH || 'main').trim() || 'main';

    if (!token || !repo) {
      return new Response(JSON.stringify({ ok: true, remote: false }), { status: 200, headers });
    }

    const path = 'content.json';
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

    let sha = null;
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'anayh-smile'
      }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const contentStr = JSON.stringify(content, null, 2);
    const contentB64 = btoa(unescape(encodeURIComponent(contentStr)));

    const payload = {
      message: `Update content - ${new Date().toISOString()}`,
      content: contentB64,
      branch: branch
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'anayh-smile'
      },
      body: JSON.stringify(payload)
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return new Response(JSON.stringify({ ok: false, error: t.slice(0, 300) }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ ok: true, remote: true }), { status: 200, headers });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400, headers });
  }
}