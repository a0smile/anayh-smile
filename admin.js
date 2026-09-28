const ADMIN_SESSION_KEY = 'smile_admin_active';
var adminActive = false;
window.adminActive = false;

/* ===== واجهة زر دخول المالك (مخفي تماماً) + شريط الأدوات + إشعارات ===== */
(function fixAdminUIStyle(){
  const css = `
  #adminEntryBtn{
    position: fixed!important;
    bottom: 14px!important;
    right: 14px!important;
    z-index: 99999!important;
    width: 46px!important;
    height: 46px!important;
    border-radius: 50%!important;
    background: linear-gradient(135deg,#7F53D1 0%,#3B1E6D 100%)!important;
    color: #fff!important;
    border: 2px solid rgba(255,255,255,0.65)!important;
    box-shadow: 0 6px 16px rgba(59,30,109,0.4)!important;
    font-size: 20px!important;
    line-height: 1!important;
    opacity: 1!important;
    cursor: pointer!important;
    display: flex!important;
    align-items: center!important;
    justify-content: center!important;
    padding: 0!important;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  #adminEntryBtn:hover{
    transform: translateY(-2px) scale(1.05)!important;
    box-shadow: 0 8px 20px rgba(59,30,109,0.5)!important;
  }
  #adminEntryBtn:active{ transform: scale(0.96)!important; }
  #adminToolbar{
    position: fixed!important;
    bottom: 0!important;
    left: 0!important;
    right: 0!important;
    z-index: 99998!important;
    background: rgba(59,30,109,0.97)!important;
    backdrop-filter: blur(8px);
    padding: 10px 12px!important;
    display: flex!important;
    gap: 8px!important;
    justify-content: center!important;
    flex-wrap: wrap!important;
    border-top: 2px solid #8F6ADB!important;
  }
  #adminToolbar[hidden]{ display: none!important; }
  body:not(.admin-mode).admin-edit-bar,
  body:not(.admin-mode).edit-btn{ display: none!important; }

  .admin-edit-bar{
    position: absolute!important;
    top: 4px!important;
    left: 4px!important;
    z-index: 9990!important;
    display: flex!important;
    gap: 4px!important;
    flex-wrap: wrap!important;
    background: rgba(255,255,255,0.95)!important;
    border: 1px solid #C4B0F0!important;
    border-radius: 10px!important;
    padding: 3px!important;
    box-shadow: 0 4px 12px rgba(59,30,109,0.2)!important;
  }
  .admin-op-btn{
    border: none!important;
    font-family: inherit!important;
    font-size: 0.68rem!important;
    font-weight: 800!important;
    padding: 4px 8px!important;
    border-radius: 8px!important;
    cursor: pointer!important;
    color: #fff!important;
    line-height: 1.2!important;
  }
  .op-edit{ background: #7F53D1!important; }
  .op-add{ background: #25D366!important; }
  .op-del{ background: #ef4444!important; }
  .op-save{ background: #3B1E6D!important; }

  #smileToast{
    position: fixed!important;
    top: 20px!important;
    left: 50%!important;
    transform: translateX(-50%) translateY(-20px)!important;
    background: #3B1E6D!important;
    color: #fff!important;
    font-family: inherit!important;
    font-weight: 800!important;
    font-size: 0.9rem!important;
    padding: 12px 22px!important;
    border-radius: 50px!important;
    box-shadow: 0 8px 24px rgba(59,30,109,0.35)!important;
    z-index: 999999!important;
    opacity: 0!important;
    pointer-events: none!important;
    transition: opacity 0.3s ease, transform 0.3s ease!important;
    max-width: 90vw!important;
    text-align: center!important;
  }
  #smileToast.show{
    opacity: 1!important;
    transform: translateX(-50%) translateY(0)!important;
  }
  #smileToast.success{ background: #128C7E!important; }
  #smileToast.error{ background: #c0392b!important; }
  `;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
})();

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminCode(code) {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (res.ok) {
      const data = await res.json();
      return data && data.ok === true;
    }
  } catch (e) {
    /* لا يوجد سيرفر (استضافة ثابتة) — ننتقل للتحقق المحلي */
  }

  /* تحقق محلي: أول استخدام على هذا الجهاز يعتمد الكود ويُخزّن بصمته فقط.
     الحفظ في content.json يبقى بحاجة لسيرفر، لذا لا يمكن للزوار الكتابة عن بُعد. */
  try {
    const KEY = 'smile_owner_hash';
    const hash = await sha256Hex(code);
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      localStorage.setItem(KEY, hash);
      return true;
    }
    return stored === hash;
  } catch (e) {
    console.error('تعذر التحقق المحلي من كود المالك', e);
    return false;
  }
}

async function enterAdminMode() {
  if (adminActive) return;
  const code = prompt('أدخل كود المالك لتفعيل وضع التعديل:');
  if (code === null) return;

  const ok = await verifyAdminCode(code);
  if (!ok) {
    showSavedToast('الكود غير صحيح — فقط المالك يستطيع التعديل', 'error');
    return;
  }

  adminActive = true;
  window.adminActive = true;
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  sessionStorage.setItem('smile_admin_code', code);
  lastAdminCode = code;
  document.body.classList.add('admin-mode');
  const tb = document.getElementById('adminToolbar');
  if (tb) tb.hidden = false;
  const entry = document.getElementById('adminEntryBtn');
  if (entry) entry.style.display = 'none';
  if (typeof renderCatalog === 'function') renderCatalog();
  attachEditButtons();
  if (typeof window.activateClinicImageManagement === 'function') {
    window.activateClinicImageManagement();
  }
  notifyAdminChanged();
  showSavedToast('تم تفعيل وضع المالك ✓', 'success');
}

function exitAdminMode() {
  adminActive = false;
  window.adminActive = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem('smile_admin_code');
  lastAdminCode = '';
  document.body.classList.remove('admin-mode');
  const tb = document.getElementById('adminToolbar');
  if (tb) tb.hidden = true;
  const entry = document.getElementById('adminEntryBtn');
  if (entry) {
    entry.style.display = 'flex';
    entry.style.opacity = '1';
  }
  removeEditButtons();
  notifyAdminChanged();
  showSavedToast('تم الخروج من وضع المالك', 'success');
}

function notifyAdminChanged() {
  document.dispatchEvent(new CustomEvent('adminModeChanged'));
}

let lastAdminCode = sessionStorage.getItem('smile_admin_code') || '';

async function persistToServer(actionLabel) {
  const data = window.getSiteData && window.getSiteData();
  if (!data) {
    showSavedToast((actionLabel || 'تم الحفظ') + ' محلياً ✓', 'success');
    return;
  }

  if (!lastAdminCode) {
    const code = prompt('أدخل كود المالك مرة واحدة لربط الحفظ التلقائي:');
    if (!code) {
      showSavedToast((actionLabel || 'تم') + ' محلياً — لم يُرسل للملف', 'error');
      return;
    }
    lastAdminCode = code;
    sessionStorage.setItem('smile_admin_code', code);
  }

  try {
    const res = await fetch('/api/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lastAdminCode, content: data })
    });
    const result = await res.json().catch(() => ({}));

    if (res.status === 401) {
      lastAdminCode = '';
      sessionStorage.removeItem('smile_admin_code');
      showSavedToast('رمز غير صحيح — الحفظ محلي فقط', 'error');
      return;
    }

    if (result && result.ok && result.remote) {
      showSavedToast((actionLabel || 'تم الحفظ') + ' ✓ وتم إرساله بنجاح', 'success');
      return;
    }

    if (result && result.ok && result.remote === false) {
      showSavedToast((actionLabel || 'تم الحفظ') + ' محلياً ✓', 'success');
      return;
    }

    showSavedToast((actionLabel || 'تم الحفظ') + ' محلياً ✓', 'success');
  } catch (e) {
    showSavedToast((actionLabel || 'تم الحفظ') + ' محلياً ✓', 'success');
  }
}

window.persistToServer = persistToServer;

function showSavedToast(msg, type) {
  let toast = document.getElementById('smileToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smileToast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg || 'تم الحفظ بنجاح ✓';
  toast.className = 'show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show', 'success', 'error');
  }, 2200);
}

function pathParts(path) {
  return String(path || '').split('.').filter(Boolean);
}

function parentArrayPath(path) {
  const parts = pathParts(path);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];
  if (/^\d+$/.test(last)) return parts.slice(0, -1).join('.');
  if (/^\d+$/.test(prev) && parts.length >= 3) return parts.slice(0, -2).join('.');
  return null;
}

function itemIndexFromPath(path) {
  const parts = pathParts(path);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(parts[i])) return Number(parts[i]);
  }
  return -1;
}

function attachEditButtons() {
  removeEditButtons();
  if (!adminActive) return;

  document.querySelectorAll('[data-edit]').forEach(el => {
    if (el.closest('.admin-edit-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'admin-edit-bar edit-btn';
    bar.setAttribute('dir', 'rtl');

    const path = el.dataset.edit || '';
    const type = el.dataset.editType || 'text';

    const mk = (txt, cls, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'admin-op-btn ' + cls;
      b.textContent = txt;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      });
      return b;
    };

    bar.appendChild(mk('تعديل', 'op-edit', () => handleEdit(el)));

    if (type === 'list' || parentArrayPath(path)) {
      bar.appendChild(mk('إضافة', 'op-add', () => handleAdd(el)));
    }

    if (parentArrayPath(path) && itemIndexFromPath(path) >= 0) {
      bar.appendChild(mk('حذف', 'op-del', () => handleDelete(el)));
    }

    bar.appendChild(mk('حفظ', 'op-save', () => {
      persistToServer('تم الحفظ بنجاح');
    }));

    const host = (type === 'image') ? el : (el.parentElement || el);
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    host.appendChild(bar);
  });
}

function removeEditButtons() {
  document.querySelectorAll('.admin-edit-bar,.edit-btn').forEach(b => b.remove());
}

function handleEdit(el) {
  const path = el.dataset.edit;
  const type = el.dataset.editType;
  const label = el.dataset.editLabel || path;

  if (type === 'image') {
    openImageUploader(path);
    return;
  }

  const current = window.getOverrideValue(path);

  if (type === 'list') {
    const arr = Array.isArray(current) ? current : [];
    const value = prompt(
      'تعديل: ' + label + '\n\nكل بند في سطر مستقل:\n(احذف سطراً للحذف · أضف سطراً للإضافة)',
      arr.join('\n')
    );
    if (value === null) return;
    const items = value.split(/[\n,،]/).map(s => s.trim()).filter(Boolean);
    window.saveOverride(path, items);
    rerender();
    persistToServer('تم التعديل بنجاح');
    return;
  }

  const value = prompt('تعديل: ' + label + '\n\nالقيمة الحالية:', current != null ? String(current) : '');
  if (value === null) return;

  let finalValue = value;
  if (value === 'true' || value === 'false') finalValue = value === 'true';
  else if (/^\d+(\.\d+)?$/.test(value)) finalValue = Number(value);
  window.saveOverride(path, finalValue);
  rerender();
  persistToServer('تم التعديل بنجاح');
}

function handleAdd(el) {
  const path = el.dataset.edit;
  const type = el.dataset.editType;
  const label = el.dataset.editLabel || path;

  if (type === 'list') {
    const current = window.getOverrideValue(path);
    const arr = Array.isArray(current) ? current.slice() : [];
    const value = prompt('إضافة عنصر جديد إلى: ' + label);
    if (value === null || !String(value).trim()) return;
    arr.push(String(value).trim());
    window.saveOverride(path, arr);
    rerender();
    persistToServer('تم الإضافة بنجاح');
    return;
  }

  const arrPath = parentArrayPath(path);
  if (!arrPath) {
    showSavedToast('لا يمكن الإضافة على هذا الحقل مباشرة', 'error');
    return;
  }

  const arr = window.getOverrideValue(arrPath);
  if (!Array.isArray(arr)) {
    showSavedToast('هذا القسم ليس قائمة قابلة للإضافة', 'error');
    return;
  }

  let template = {};
  if (arrPath === 'doctors') {
    const name = prompt('اسم الطبيب الجديد:');
    if (name === null || !name.trim()) return;
    template = {
      name: name.trim(),
      specialty: prompt('التخصص:') || 'طب أسنان',
      experience: prompt('سنوات الخبرة:') || '5+ سنوات',
      initial: (name.trim()[0] || 'د')
    };
  } else if (arrPath === 'reviews') {
    const name = prompt('اسم صاحب التعليق:');
    if (name === null || !name.trim()) return;
    template = {
      name: name.trim(),
      text: prompt('نص التعليق:') || '',
      rating: Number(prompt('التقييم من 5:') || 5)
    };
  } else if (arrPath === 'features' || arrPath === 'tips') {
    const title = prompt('عنوان العنصر الجديد:');
    if (title === null || !title.trim()) return;
    template = {
      title: title.trim(),
      description: prompt('الوصف:') || '',
      icon: 'tooth'
    };
  } else if (arrPath.includes('serviceCategories') && arrPath.endsWith('items')) {
    const name = prompt('اسم الخدمة الجديدة:');
    if (name === null || !name.trim()) return;
    template = {
      name: name.trim(),
      price: Number(prompt('السعر بعد الخصم:') || 0),
      oldPrice: Number(prompt('السعر قبل (اختياري):') || 0) || undefined
    };
  } else {
    const val = prompt('قيمة العنصر الجديد:');
    if (val === null) return;
    template = val;
  }

  const next = arr.slice();
  next.push(template);
  window.saveOverride(arrPath, next);
  rerender();
  persistToServer('تم الإضافة بنجاح');
}

function handleDelete(el) {
  const path = el.dataset.edit;
  const arrPath = parentArrayPath(path);
  const idx = itemIndexFromPath(path);
  if (!arrPath || idx < 0) {
    showSavedToast('لا يمكن حذف هذا العنصر', 'error');
    return;
  }
  if (!confirm('هل تريد حذف هذا العنصر نهائياً من الموقع؟')) return;
  const arr = window.getOverrideValue(arrPath);
  if (!Array.isArray(arr)) return;
  const next = arr.slice();
  next.splice(idx, 1);
  window.saveOverride(arrPath, next);
  rerender();
  persistToServer('تم الحذف بنجاح');
}

const fileInput = document.getElementById('adminFileInput');
let pendingImagePath = null;

function openImageUploader(path) {
  pendingImagePath = path;
  if (!fileInput) return;
  fileInput.value = '';
  fileInput.click();
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file || !pendingImagePath) return;
    if (!file.type.startsWith('image/')) {
      showSavedToast('الرجاء اختيار ملف صورة صحيح', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      window.saveOverride(pendingImagePath, reader.result);
      pendingImagePath = null;
      rerender();
      persistToServer('تم رفع الصورة بنجاح');
    };
    reader.readAsDataURL(file);
  });
}

function rerender() {
  const data = window.getSiteData();
  if (!data) return;
  if (typeof renderSite === 'function') {
    renderSite(data);
    document.dispatchEvent(new CustomEvent('siteRendered'));
  }
  if (adminActive) setTimeout(attachEditButtons, 30);
}

function downloadUpdatedJson() {
  const data = window.getSiteData();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'content.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showSavedToast('تم تحميل content.json ✓', 'success');
}

function resetOverrides() {
  if (!confirm('هل تريد التراجع عن كل التعديلات المحفوظة في هذا المتصفح؟')) return;
  localStorage.removeItem(window.OVERRIDES_KEY || 'smile_overrides');
  showSavedToast('تم التراجع عن التعديلات', 'success');
  location.reload();
}

const entryBtnEl = document.getElementById('adminEntryBtn');
const exitBtnEl = document.getElementById('adminExitBtn');
const downloadBtnEl = document.getElementById('adminDownloadBtn');
const resetBtnEl = document.getElementById('adminResetBtn');
const galleryBtnEl = document.getElementById('adminGalleryBtn');

if (entryBtnEl) {
  entryBtnEl.textContent = '🔒';
  entryBtnEl.title = 'دخول المالك';
  entryBtnEl.addEventListener('click', enterAdminMode);
}
if (exitBtnEl) exitBtnEl.addEventListener('click', exitAdminMode);
if (downloadBtnEl) downloadBtnEl.addEventListener('click', downloadUpdatedJson);
if (resetBtnEl) resetBtnEl.addEventListener('click', resetOverrides);
if (galleryBtnEl) {
  galleryBtnEl.addEventListener('click', () => {
    if (window.adminActive) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    location.href = 'catalog.html';
  });
}

(function restoreSessionSecure(){
  const isAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  const tb = document.getElementById('adminToolbar');
  const entry = document.getElementById('adminEntryBtn');
  if (isAdmin) {
    adminActive = true;
    window.adminActive = true;
    document.body.classList.add('admin-mode');
    if (tb) tb.hidden = false;
    if (entry) entry.style.display = 'none';
    if (typeof renderCatalog === 'function') renderCatalog();
  } else {
    adminActive = false;
    window.adminActive = false;
    document.body.classList.remove('admin-mode');
    if (tb) tb.hidden = true;
    if (entry) {
      entry.style.display = 'flex';
      entry.style.opacity = '1';
    }
    removeEditButtons();
  }
})();

document.addEventListener('siteRendered', () => {
  if (adminActive) attachEditButtons();
  else {
    const tb = document.getElementById('adminToolbar');
    if (tb) tb.hidden = true;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const tb = document.getElementById('adminToolbar');
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== '1' && tb) {
    tb.hidden = true;
  }
  if (adminActive) setTimeout(attachEditButtons, 80);
});