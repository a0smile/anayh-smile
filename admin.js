const ADMIN_SESSION_KEY = 'smile_admin_active';
var adminActive = false;
window.adminActive = false;

/* كود الدخول: يُتحقق منه من جهة الخادم (Cloudflare Pages Function)
   كلمة المرور محفوظة في المتغير البيئي ADMIN_PASSWORD بموقع Cloudflare */
async function verifyAdminCode(code) {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.ok === true;
  } catch (e) {
    console.error('تعذر التحقق من كود المالك', e);
    return false;
  }
}

async function enterAdminMode() {
  if (adminActive) return;
  const code = prompt(' أدخل كود المالك لتفعيل وضع التعديل:');
  if (code === null) return;

  const ok = await verifyAdminCode(code);
  if (!ok) {
    alert('الكود غير صحيح. فقط مالك الموقع يستطيع التعديل.');
    return;
  }

  adminActive = true;
  window.adminActive = true;
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  document.body.classList.add('admin-mode');
  const tb = document.getElementById('adminToolbar');
  if (tb) tb.hidden = false;
  attachEditButtons();
  if (typeof renderCatalog === 'function') renderCatalog();
  
  //  ربط حقيقي: إظهار لوحة التحكم بالصور فوراً عند إدخال الرقم السري الصحيح
  if (typeof window.activateClinicImageManagement === 'function') {
    window.activateClinicImageManagement();
  }

  notifyAdminChanged();
}

function exitAdminMode() {
  adminActive = false;
  window.adminActive = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  document.body.classList.remove('admin-mode');
  const tb = document.getElementById('adminToolbar');
  if (tb) tb.hidden = true;
  removeEditButtons();
  notifyAdminChanged();
}

function notifyAdminChanged() {
  document.dispatchEvent(new CustomEvent('adminModeChanged'));
}


function attachEditButtons() {
  removeEditButtons();
  document.querySelectorAll('[data-edit]').forEach(el => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'edit-btn';
    btn.innerHTML = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em"><path d="M33 7l8 8-22 22-10 2 2-10z"/><path d="M29 11l8 8"/></svg> تعديل';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleEdit(el);
    });
    el.style.position = el.style.position || 'relative';
    if (el.dataset.editType === 'image') {
      el.appendChild(btn);
    } else {
      el.parentElement.appendChild(btn);
      const parent = el.parentElement;
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      btn.style.position = 'absolute';
      btn.style.top = '-12px';
      btn.style.left = '-4px';
    }
  });
}

function removeEditButtons() {
  document.querySelectorAll('.edit-btn').forEach(b => b.remove());
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
    const value = prompt(` تعديل: ${label}\n\nكل بند في سطر مستقل:\n(احذف سطراً لحذف البند وأضف سطراً لإضافة بند)`, arr.join('\n'));
    if (value === null) return;
    const items = value.split(/[\n,،]/).map(s => s.trim()).filter(Boolean);
    window.saveOverride(path, items);
    rerender();
    showSavedToast();
    return;
  }

  const value = prompt(` تعديل: ${label}\n\nالقيمة الحالية:`, current != null ? String(current) : '');
  if (value === null) return;

  let finalValue = value;
  if (value === 'true' || value === 'false') finalValue = value === 'true';
  else if (/^\d+$/.test(value)) finalValue = Number(value);
  window.saveOverride(path, finalValue);

  rerender();
  showSavedToast();
}

function showSavedToast() {
  let toast = document.getElementById('smileToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smileToast';
    document.body.appendChild(toast);
  }
  toast.textContent = 'تم حفظ التعديل';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

/* ===== رفع الصور ===== */
/* adminFileInput موجود في الصفحة الرئيسية فقط؛ إن لم يوجد (صفحة الكتالوج)
   نُهيّئ هذا الجزء بأمان دون إيقاف بقية admin.js */
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
      alert('الرجاء اختيار ملف صورة صحيح.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      window.saveOverride(pendingImagePath, reader.result);
      pendingImagePath = null;
      rerender();
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
  if (adminActive) attachEditButtons();
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
  alert('تم تحميل content.json بالتعديلات.\nارفعها على استضافتك حتى تظهر للزوار كلهم.');
}

function resetOverrides() {
  if (!confirm('هل تريد التراجع عن كل التعديلات المحفوظة في هذا المتصفح؟')) return;
  localStorage.removeItem(OVERRIDES_KEY);
  location.reload();
}

const entryBtnEl = document.getElementById('adminEntryBtn');
const exitBtnEl = document.getElementById('adminExitBtn');
const downloadBtnEl = document.getElementById('adminDownloadBtn');
const resetBtnEl = document.getElementById('adminResetBtn');

if (entryBtnEl) entryBtnEl.addEventListener('click', enterAdminMode);
if (exitBtnEl) exitBtnEl.addEventListener('click', exitAdminMode);
if (downloadBtnEl) downloadBtnEl.addEventListener('click', downloadUpdatedJson);
if (resetBtnEl) resetBtnEl.addEventListener('click', resetOverrides);

/* ===== استعادة الجلسة ===== */
if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
  adminActive = true;
  window.adminActive = true;
  document.body.classList.add('admin-mode');
  const tb = document.getElementById('adminToolbar');
  if (tb) tb.hidden = false;
  if (typeof renderCatalog === 'function') renderCatalog();
}

document.addEventListener('siteRendered', () => {
  if (adminActive) attachEditButtons();
});