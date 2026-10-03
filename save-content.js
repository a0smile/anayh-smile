/**
 * POST /api/save-content
 * Body: { code: string, content: object }
 *
 * يحفظ content.json في مستودع GitHub عبر GitHub Contents API.
 *
 * متغيرات البيئة المطلوبة (Cloudflare Pages → Settings → Environment variables):
 *   ADMIN_PASSWORD   كلمة سر لوحة المالك (مطلوبة)
 *   GITHUB_TOKEN     Personal Access Token بصلاحية contents:write
 *   GITHUB_REPO      مثال: a0smile/anayh-smile
 *   GITHUB_BRANCH    اختياري، افتراضي main
 *   GITHUB_PATH      اختياري، افتراضي content.json
 *
 * ملاحظة: هذه الدالة تعمل فقط على منصّة تدعم Functions
 * (Cloudflare Pages / Netlify). GitHub Pages لا ينفّذها.
 */

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_CONTENT_BYTES = 900 * 1024;

// نجيب متغيّر البيئة من env إن وُجد، وإلا من process.env (يغطي Netlify وبيئات Node)
function readEnv(context, key) {
  if (context && context.env && context.env[key] != null) return String(context.env[key]).trim();
  return String(process.env[key] || '').trim();
}

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// مقارنة بزمن ثابت لتقليل خطر هجوم التوقيت
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function isValidRepo(repo) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function isValidBranch(branch) {
  return branch.length > 0 && branch.length <= 255 && !/[\r\n]/.test(branch);
}

function isValidPath(path) {
  return path.length > 0 && path.length <= 500 && !/[\r\n]/.test(path);
}

export async function onRequest(context) {
  const request = context.request;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ ok: false, message: 'method' }, 405);

  const adminPass = readEnv(context, 'ADMIN_PASSWORD');
  if (!adminPass) return json({ ok: false, message: 'not configured' }, 500);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ ok: false, message: 'request too large' }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, message: 'bad json' }, 400);
  }

  const code = body && typeof body.code === 'string' ? body.code : '';
  if (!safeEqual(code, adminPass)) return json({ ok: false, message: 'unauthorized' }, 401);

  const content = body && body.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return json({ ok: false, message: 'no content' }, 400);
  }

  let contentJson;
  try {
    contentJson = JSON.stringify(content, null, 2);
  } catch (e) {
    return json({ ok: false, message: 'invalid content' }, 400);
  }

  if (new TextEncoder().encode(contentJson).length > MAX_CONTENT_BYTES) {
    return json({ ok: false, message: 'content too large' }, 413);
  }

  const token = readEnv(context, 'GITHUB_TOKEN');
  const repo = readEnv(context, 'GITHUB_REPO');
  const branch = readEnv(context, 'GITHUB_BRANCH') || 'main';
  const path = readEnv(context, 'GITHUB_PATH') || 'content.json';

  if (!token || !repo) {
    return json({ ok: true, remote: false, message: 'saved-local-only: أضف GITHUB_TOKEN و GITHUB_REPO لتفعيل الحفظ التلقائي' }, 200);
  }

  if (!isValidRepo(repo) || !isValidBranch(branch) || !isValidPath(path)) {
    return json({ ok: false, remote: false, message: 'invalid github configuration' }, 500);
  }

  try {
    // رابط ثابت مقيّد بالمستودع لتفادي إرسال الرمز لأي مضيف آخر
    const base = 'https://api.github.com/repos/' + repo + '/contents/' + path + '?ref=' + encodeURIComponent(branch);
    const authHeaders = {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'anayh-smile-admin'
    };

    let sha = null;
    const getRes = await fetch(base, { headers: authHeaders });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData && fileData.sha ? fileData.sha : null;
    } else if (getRes.status !== 404) {
      const detail = await getRes.text();
      console.error('github file lookup failed', getRes.status, detail.slice(0, 300));
      return json({ ok: false, remote: false, message: 'github lookup error' }, 502);
    }

    const payload = {
      message: 'تحديث محتوى الموقع من لوحة المالك',
      content: encodeBase64(contentJson),
      branch
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(
      'https://api.github.com/repos/' + repo + '/contents/' + path,
      {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders),
        body: JSON.stringify(payload)
      }
    );

    if (!putRes.ok) {
      const detail = await putRes.text();
      console.error('github save failed', putRes.status, detail.slice(0, 300));
      return json({ ok: false, remote: false, message: 'github error' }, 502);
    }

    return json({ ok: true, remote: true, message: 'تم الحفظ وإرساله بنجاح' }, 200);
  } catch (e) {
    console.error('save-content exception', e);
    return json({ ok: false, message: 'exception' }, 500);
  }
}
