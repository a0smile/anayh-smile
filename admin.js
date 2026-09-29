const ADMIN_SESSION_KEY = 'smile_admin_active';

let adminActive = false;
window.adminActive = false;

let lastAdminCode = sessionStorage.getItem('smile_admin_code') || '';
let pendingImagePath = null;

/* =========================================================
   ADMIN UI
   ========================================================= */
(function injectAdminUIStyle() {
  const css = `
    #adminEntryBtn {
      position: fixed!important;
      right: 18px!important;
      bottom: 18px!important;
      width: 48px!important;
      height: 48px!important;
      min-width: 48px!important;
      min-height: 48px!important;
      padding: 0!important;
      margin: 0!important;
      border: 1px solid rgba(218,180,82,.85)!important;
      border-radius: 50%!important;
      opacity: 1!important;
      visibility: visible!important;
      pointer-events: auto!important;
      overflow: hidden!important;
      z-index: 99997!important;
      display: flex!important;
      align-items: center!important;
      justify-content: center!important;
      background: linear-gradient(135deg,#241438,#3B1E6D)!important;
      color: #fff!important;
      box-shadow: 0 10px 28px rgba(59,30,109,.35)!important;
      cursor: pointer!important;
      font-size: 22px!important;
      line-height: 1!important;
    }

    #adminEntryBtn:hover {
      transform: translateY(-2px)!important;
      filter: brightness(1.08)!important;
    }

    #adminEntryBtn:active {
      transform: translateY(0)!important;
    }

    body.admin-mode #adminEntryBtn {
      display: none!important;
    }

    #adminToolbar {
      position: fixed!important;
      bottom: 0!important;
      left: 0!important;
      right: 0!important;
      z-index: 99998!important;
      background:
        linear-gradient(
          135deg,
          rgba(28,18,48,.98),
          rgba(59,30,109,.98)
        )!important;
      backdrop-filter: blur(14px)!important;
      -webkit-backdrop-filter: blur(14px)!important;
      padding: 10px 12px!important;
      display: flex!important;
      gap: 8px!important;
      justify-content: center!important;
      align-items: center!important;
      flex-wrap: wrap!important;
      border-top: 1px solid rgba(218,180,82,.55)!important;
      box-shadow: 0 -8px 30px rgba(0,0,0,.18)!important;
    }

    #adminToolbar[hidden] {
      display: none!important;
    }

    body:not(.admin-mode) .admin-edit-bar,
    body:not(.admin-mode) .edit-btn,
    body:not(.admin-mode) #adminToolbar,
    body:not(.admin-mode) #adminManagerOverlay {
      display: none!important;
    }

    .admin-edit-bar {
      position: absolute!important;
      top: 4px!important;
      left: 4px!important;
      z-index: 9990!important;
      display: flex!important;
      gap: 4px!important;
      flex-wrap: wrap!important;
      align-items: center!important;
      background: rgba(255,255,255,.97)!important;
      border: 1px solid rgba(127,83,209,.35)!important;
      border-radius: 10px!important;
      padding: 4px!important;
      box-shadow: 0 6px 18px rgba(59,30,109,.20)!important;
      direction: rtl!important;
    }

    .admin-op-btn {
      border: 0!important;
      font-family: inherit!important;
      font-size: .68rem!important;
      font-weight: 800!important;
      padding: 5px 9px!important;
      border-radius: 8px!important;
      cursor: pointer!important;
      color: #fff!important;
      line-height: 1.2!important;
    }

    .admin-op-btn:hover {
      filter: brightness(1.08)!important;
      transform: translateY(-1px)!important;
    }

    .op-edit { background: #7F53D1!important; }
    .op-add { background: #128C7E!important; }
    .op-del { background: #c0392b!important; }
    .op-save { background: #3B1E6D!important; }
    .op-manage { background: #b58b28!important; }

    #smileToast {
      position: fixed!important;
      top: 20px!important;
      left: 50%!important;
      transform: translateX(-50%) translateY(-20px)!important;
      background: #3B1E6D!important;
      color: #fff!important;
      font-family: inherit!important;
      font-weight: 800!important;
      font-size: .9rem!important;
      padding: 12px 22px!important;
      border-radius: 50px!important;
      box-shadow: 0 8px 24px rgba(59,30,109,.35)!important;
      z-index: 999999!important;
      opacity: 0!important;
      pointer-events: none!important;
      transition: opacity .3s ease, transform .3s ease!important;
      max-width: 90vw!important;
      text-align: center!important;
    }

    #smileToast.show {
      opacity: 1!important;
      transform: translateX(-50%) translateY(0)!important;
    }

    #smileToast.success { background: #128C7E!important; }
    #smileToast.error { background: #c0392b!important; }

    #adminManagerOverlay {
      position: fixed!important;
      inset: 0!important;
      z-index: 999997!important;
      background: rgba(10,7,15,.72)!important;
      backdrop-filter: blur(10px)!important;
      -webkit-backdrop-filter: blur(10px)!important;
      display: flex!important;
      align-items: center!important;
      justify-content: center!important;
      padding: 18px!important;
      direction: rtl!important;
    }

    #adminManager {
      width: min(1100px, 100%)!important;
      max-height: min(88vh, 900px)!important;
      overflow: hidden!important;
      display: flex!important;
      flex-direction: column!important;
      background: #fffaf2!important;
      border: 1px solid rgba(181,139,40,.45)!important;
      border-radius: 22px!important;
      box-shadow: 0 30px 90px rgba(0,0,0,.35)!important;
    }

    .admin-manager-head {
      display: flex!important;
      align-items: center!important;
      justify-content: space-between!important;
      gap: 12px!important;
      padding: 18px 20px!important;
      color: #fff!important;
      background: linear-gradient(135deg,#241438,#3B1E6D)!important;
      border-bottom: 1px solid rgba(218,180,82,.45)!important;
    }

    .admin-manager-title {
      font-size: 1.08rem!important;
      font-weight: 900!important;
      margin: 0!important;
    }

    .admin-manager-subtitle {
      margin: 4px 0 0!important;
      opacity: .78!important;
      font-size: .78rem!important;
    }

    .admin-manager-close {
      border: 0!important;
      width: 38px!important;
      height: 38px!important;
      border-radius: 50%!important;
      background: rgba(255,255,255,.12)!important;
      color: #fff!important;
      cursor: pointer!important;
      font-size: 20px!important;
      font-weight: 900!important;
    }

    .admin-manager-tools {
      display: grid!important;
      grid-template-columns: 1fr auto auto auto!important;
      gap: 8px!important;
      padding: 12px!important;
      border-bottom: 1px solid #eadfce!important;
      background: #fffdf9!important;
    }

    .admin-manager-search {
      min-width: 0!important;
      border: 1px solid #d9cdbb!important;
      border-radius: 12px!important;
      padding: 10px 12px!important;
      background: #fff!important;
      color: #241438!important;
      font-family: inherit!important;
      outline: none!important;
    }

    .admin-manager-tool-btn {
      border: 0!important;
      border-radius: 11px!important;
      padding: 9px 12px!important;
      cursor: pointer!important;
      font-family: inherit!important;
      font-weight: 800!important;
      background: #3B1E6D!important;
      color: #fff!important;
    }

    .admin-manager-tool-btn.gold {
      background: #b58b28!important;
    }

    .admin-manager-tool-btn.red {
      background: #c0392b!important;
    }

    .admin-manager-list {
      overflow: auto!important;
      padding: 14px!important;
    }

    .admin-manager-group {
      margin-bottom: 14px!important;
      border: 1px solid #eadfce!important;
      border-radius: 15px!important;
      background: #fff!important;
      overflow: hidden!important;
    }

    .admin-manager-group-title {
      padding: 11px 13px!important;
      background: #f6efe4!important;
      color: #3B1E6D!important;
      font-weight: 900!important;
      border-bottom: 1px solid #eadfce!important;
    }

    .admin-field-row {
      display: grid!important;
      grid-template-columns: minmax(130px,.7fr) minmax(180px,1.5fr) auto!important;
      gap: 9px!important;
      align-items: center!important;
      padding: 9px 11px!important;
      border-bottom: 1px solid #f0e8dc!important;
    }

    .admin-field-row:last-child {
      border-bottom: 0!important;
    }

    .admin-field-path {
      direction: ltr!important;
      text-align: left!important;
      font-family: ui-monospace,SFMono-Regular,Menlo,monospace!important;
      font-size: .7rem!important;
      color: #735f82!important;
      overflow-wrap: anywhere!important;
    }

    .admin-field-value {
      min-width: 0!important;
      color: #251a30!important;
      font-size: .82rem!important;
      overflow-wrap: anywhere!important;
      max-height: 90px!important;
      overflow: auto!important;
    }

    .admin-field-actions {
      display: flex!important;
      gap: 5px!important;
      flex-wrap: wrap!important;
      justify-content: flex-end!important;
    }

    .admin-field-action {
      border: 0!important;
      border-radius: 8px!important;
      padding: 6px 8px!important;
      font-family: inherit!important;
      font-weight: 800!important;
      font-size: .68rem!important;
      cursor: pointer!important;
      color: #fff!important;
      background: #7F53D1!important;
    }

    .admin-field-action.delete {
      background: #c0392b!important;
    }

    .admin-field-action.add {
      background: #128C7E!important;
    }

    .admin-manager-empty {
      text-align: center!important;
      padding: 35px 15px!important;
      color: #75697d!important;
      font-weight: 700!important;
    }

    @media (max-width: 720px) {
      #adminEntryBtn {
        right: 14px!important;
        bottom: 14px!important;
        width: 46px!important;
        height: 46px!important;
        min-width: 46px!important;
        min-height: 46px!important;
      }

      .admin-manager-tools {
        grid-template-columns: 1fr 1fr!important;
      }

      .admin-manager-search {
        grid-column: 1 / -1!important;
      }

      .admin-field-row {
        grid-template-columns: 1fr!important;
      }

      .admin-field-actions {
        justify-content: flex-start!important;
      }
    }
  `;

  const st = document.createElement('style');
  st.id = 'smile-admin-runtime-style';
  st.textContent = css;
  document.head.appendChild(st);
})();

/* =========================================================
   HASH
   ========================================================= */
async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);

  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* =========================================================
   ADMIN AUTH
   ========================================================= */
async function verifyAdminCode(code) {
  if (!code || !String(code).trim()) return false;

  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: String(code)
      })
    });

    if (!res.ok) return false;

    const data = await res.json().catch(() => null);
    return Boolean(data && data.ok === true);
  } catch (e) {
    console.warn('تعذر الاتصال بخدمة دخول المالك.');
    return false;
  }
}

async function enterAdminMode() {
  if (adminActive) return;

  const code = prompt('أدخل كود المالك لتفعيل وضع الإدارة:');

  if (code === null) return;

  const ok = await verifyAdminCode(code);

  if (!ok) {
    showSavedToast(
      'الكود غير صحيح أو خدمة التحقق غير متاحة',
      'error'
    );
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
  if (entry) {
    entry.style.display = 'none';
  }

  if (typeof renderCatalog === 'function') {
    renderCatalog();
  }

  attachEditButtons();

  if (typeof window.activateClinicImageManagement === 'function') {
    window.activateClinicImageManagement();
  }

  notifyAdminChanged();

  showSavedToast(
    'تم تفعيل وضع المالك ✓',
    'success'
  );
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
    entry.style.visibility = 'visible';
    entry.style.opacity = '1';
    entry.style.pointerEvents = 'auto';
  }

  removeEditButtons();
  closeAdminManager();

  notifyAdminChanged();

  showSavedToast(
    'تم الخروج من وضع المالك',
    'success'
  );
}

function notifyAdminChanged() {
  document.dispatchEvent(
    new CustomEvent('adminModeChanged')
  );
}

/* =========================================================
   SAVE
   ========================================================= */
async function persistToServer(actionLabel) {
  const data =
    typeof window.getSiteData === 'function'
      ? window.getSiteData()
      : null;

  if (!data) {
    showSavedToast(
      (actionLabel || 'تم الحفظ') + ' محلياً ✓',
      'success'
    );
    return;
  }

  if (!lastAdminCode) {
    showSavedToast(
      'انتهت جلسة المالك — يرجى تسجيل الدخول مجدداً',
      'error'
    );
    return;
  }

  try {
    const res = await fetch('/api/save-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: lastAdminCode,
        content: data
      })
    });

    const result = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      lastAdminCode = '';
      sessionStorage.removeItem('smile_admin_code');

      showSavedToast(
        'رمز المالك غير صالح — لم يتم إرسال التعديل',
        'error'
      );

      return;
    }

    if (result && result.ok === true) {
      showSavedToast(
        (actionLabel || 'تم الحفظ') +
          (result.remote === false
            ? ' محلياً ✓'
            : ' ✓ تم الحفظ بنجاح'),
        'success'
      );
      return;
    }

    showSavedToast(
      'تعذر تأكيد الحفظ على الخادم',
      'error'
    );
  } catch (e) {
    showSavedToast(
      'تعذر الاتصال بخدمة الحفظ',
      'error'
    );
  }
}

window.persistToServer = persistToServer;

/* =========================================================
   TOAST
   ========================================================= */
function showSavedToast(msg, type) {
  let toast = document.getElementById('smileToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smileToast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg || 'تم الحفظ بنجاح ✓';

  toast.className =
    'show' +
    (
      type === 'error'
        ? ' error'
        : type === 'success'
          ? ' success'
          : ''
    );

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.classList.remove(
      'show',
      'success',
      'error'
    );
  }, 2600);
}

/* =========================================================
   PATH HELPERS
   ========================================================= */
function pathParts(path) {
  return String(path || '')
    .split('.')
    .filter(Boolean);
}

function parentArrayPath(path) {
  const parts = pathParts(path);

  if (parts.length < 2) return null;

  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];

  if (/^\d+$/.test(last)) {
    return parts.slice(0, -1).join('.');
  }

  if (/^\d+$/.test(prev) && parts.length >= 3) {
    return parts.slice(0, -2).join('.');
  }

  return null;
}

function itemIndexFromPath(path) {
  const parts = pathParts(path);

  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(parts[i])) {
      return Number(parts[i]);
    }
  }

  return -1;
}

function getNestedValue(root, path) {
  const parts = pathParts(path);
  let current = root;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

/* =========================================================
   INLINE EDIT BUTTONS
   ========================================================= */
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

      b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      });

      return b;
    };

    bar.appendChild(
      mk('تعديل', 'op-edit', () => handleEdit(el))
    );

    if (
      type === 'list' ||
      parentArrayPath(path)
    ) {
      bar.appendChild(
        mk('إضافة', 'op-add', () => handleAdd(el))
      );
    }

    if (
      parentArrayPath(path) &&
      itemIndexFromPath(path) >= 0
    ) {
      bar.appendChild(
        mk('حذف', 'op-del', () => handleDelete(el))
      );
    }

    bar.appendChild(
      mk('حفظ', 'op-save', () => {
        persistToServer('تم الحفظ بنجاح');
      })
    );

    const host =
      type === 'image'
        ? el
        : (el.parentElement || el);

    if (
      getComputedStyle(host).position === 'static'
    ) {
      host.style.position = 'relative';
    }

    host.appendChild(bar);
  });
}

function removeEditButtons() {
  document
    .querySelectorAll('.admin-edit-bar,.edit-btn')
    .forEach(b => b.remove());
}

/* =========================================================
   INLINE EDIT
   ========================================================= */
function handleEdit(el) {
  const path = el.dataset.edit;
  const type = el.dataset.editType;
  const label = el.dataset.editLabel || path;

  if (type === 'image') {
    openImageUploader(path);
    return;
  }

  const current =
    typeof window.getOverrideValue === 'function'
      ? window.getOverrideValue(path)
      : getNestedValue(window.getSiteData(), path);

  if (type === 'list') {
    const arr = Array.isArray(current)
      ? current
      : [];

    const value = prompt(
      'تعديل: ' +
        label +
        '\n\nكل بند في سطر مستقل:',
      arr.join('\n')
    );

    if (value === null) return;

    const items = value
      .split(/[\n,،]/)
      .map(s => s.trim())
      .filter(Boolean);

    window.saveOverride(path, items);

    rerender();

    persistToServer('تم التعديل بنجاح');

    return;
  }

  const value = prompt(
    'تعديل: ' +
      label +
      '\n\nالقيمة الحالية:',
    current != null
      ? String(current)
      : ''
  );

  if (value === null) return;

  let finalValue = value;

  if (value === 'true') {
    finalValue = true;
  } else if (value === 'false') {
    finalValue = false;
  } else if (
    /^-?\d+(\.\d+)?$/.test(value)
  ) {
    finalValue = Number(value);
  }

  window.saveOverride(
    path,
    finalValue
  );

  rerender();

  persistToServer('تم التعديل بنجاح');
}

/* =========================================================
   ADD
   ========================================================= */
function handleAdd(el) {
  const path = el.dataset.edit;
  const type = el.dataset.editType;
  const label = el.dataset.editLabel || path;

  if (type === 'list') {
    const current =
      window.getOverrideValue(path);

    const arr = Array.isArray(current)
      ? current.slice()
      : [];

    const value = prompt(
      'إضافة عنصر جديد إلى: ' +
        label
    );

    if (
      value === null ||
      !String(value).trim()
    ) {
      return;
    }

    arr.push(String(value).trim());

    window.saveOverride(path, arr);

    rerender();

    persistToServer('تمت الإضافة بنجاح');

    return;
  }

  const arrPath =
    parentArrayPath(path);

  if (!arrPath) {
    showSavedToast(
      'لا يمكن الإضافة على هذا الحقل مباشرة',
      'error'
    );
    return;
  }

  const arr =
    window.getOverrideValue(arrPath);

  if (!Array.isArray(arr)) {
    showSavedToast(
      'هذا القسم ليس قائمة قابلة للإضافة',
      'error'
    );
    return;
  }

  let template = {};

  if (arrPath === 'doctors') {
    const name = prompt(
      'اسم الطبيب الجديد:'
    );

    if (
      name === null ||
      !name.trim()
    ) {
      return;
    }

    template = {
      name: name.trim(),
      specialty:
        prompt('التخصص:') ||
        'طب أسنان',
      experience:
        prompt('الخبرة:') ||
        'خبرة متميزة في طب الأسنان',
      initial:
        name.trim()[0] || 'د'
    };
  } else if (arrPath === 'reviews') {
    const name = prompt(
      'اسم صاحب التعليق:'
    );

    if (
      name === null ||
      !name.trim()
    ) {
      return;
    }

    const text =
      prompt('نص التعليق:') || '';

    const ratingRaw =
      prompt('التقييم من 5:') || '5';

    const rating =
      Math.max(
        1,
        Math.min(
          5,
          Number(ratingRaw) || 5
        )
      );

    template = {
      name: name.trim(),
      text,
      rating
    };
  } else if (
    arrPath === 'features' ||
    arrPath === 'tips'
  ) {
    const title = prompt(
      'عنوان العنصر الجديد:'
    );

    if (
      title === null ||
      !title.trim()
    ) {
      return;
    }

    template = {
      title: title.trim(),
      description:
        prompt('الوصف:') || '',
      icon: 'tooth'
    };
  } else if (
    arrPath.includes('serviceCategories') &&
    arrPath.endsWith('items')
  ) {
    const name = prompt(
      'اسم الخدمة الجديدة:'
    );

    if (
      name === null ||
      !name.trim()
    ) {
      return;
    }

    const price =
      Number(
        prompt(
          'السعر بعد الخصم:'
        ) || 0
      );

    const oldPrice =
      Number(
        prompt(
          'السعر السابق (اختياري):'
        ) || 0
      );

    template = {
      name: name.trim(),
      price,
      oldPrice:
        oldPrice > 0
          ? oldPrice
          : undefined
    };
  } else {
    const val = prompt(
      'قيمة العنصر الجديد:'
    );

    if (val === null) return;

    template = val;
  }

  const next = arr.slice();

  next.push(template);

  window.saveOverride(
    arrPath,
    next
  );

  rerender();

  persistToServer(
    'تمت الإضافة بنجاح'
  );
}

/* =========================================================
   DELETE
   ========================================================= */
function handleDelete(el) {
  const path = el.dataset.edit;

  const arrPath =
    parentArrayPath(path);

  const idx =
    itemIndexFromPath(path);

  if (
    !arrPath ||
    idx < 0
  ) {
    showSavedToast(
      'لا يمكن حذف هذا العنصر',
      'error'
    );
    return;
  }

  if (
    !confirm(
      'هل تريد حذف هذا العنصر نهائياً من الموقع؟'
    )
  ) {
    return;
  }

  const arr =
    window.getOverrideValue(arrPath);

  if (!Array.isArray(arr)) {
    return;
  }

  const next = arr.slice();

  next.splice(idx, 1);

  window.saveOverride(
    arrPath,
    next
  );

  rerender();

  persistToServer(
    'تم الحذف بنجاح'
  );
}

/* =========================================================
   IMAGE UPLOADER
   ========================================================= */
function getAdminFileInput() {
  return document.getElementById(
    'adminFileInput'
  );
}

function openImageUploader(path) {
  pendingImagePath = path;

  const input =
    getAdminFileInput();

  if (!input) {
    showSavedToast(
      'لم يتم العثور على أداة رفع الصور',
      'error'
    );
    return;
  }

  input.value = '';
  input.click();
}

function bindImageUploader() {
  const fileInput =
    getAdminFileInput();

  if (!fileInput || fileInput.dataset.adminBound === '1') {
    return;
  }

  fileInput.dataset.adminBound = '1';

  fileInput.addEventListener(
    'change',
    () => {
      const file =
        fileInput.files &&
        fileInput.files[0];

      if (
        !file ||
        !pendingImagePath
      ) {
        return;
      }

      if (
        !file.type.startsWith('image/')
      ) {
        showSavedToast(
          'الرجاء اختيار ملف صورة صحيح',
          'error'
        );
        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {
        window.saveOverride(
          pendingImagePath,
          reader.result
        );

        pendingImagePath = null;

        rerender();

        persistToServer(
          'تم رفع الصورة بنجاح'
        );
      };

      reader.onerror = () => {
        pendingImagePath = null;

        showSavedToast(
          'تعذر قراءة الصورة',
          'error'
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

/* =========================================================
   RERENDER
   ========================================================= */
function rerender() {
  if (
    typeof window.getSiteData !== 'function'
  ) {
    return;
  }

  const data =
    window.getSiteData();

  if (!data) return;

  if (
    typeof renderSite === 'function'
  ) {
    renderSite(data);

    document.dispatchEvent(
      new CustomEvent('siteRendered')
    );
  }

  if (adminActive) {
    setTimeout(
      attachEditButtons,
      40
    );
  }
}

/* =========================================================
   DOWNLOAD
   ========================================================= */
function downloadUpdatedJson() {
  if (!adminActive) return;

  if (
    typeof window.getSiteData !== 'function'
  ) {
    showSavedToast(
      'تعذر قراءة بيانات الموقع',
      'error'
    );
    return;
  }

  const data =
    window.getSiteData();

  if (!data) return;

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          'application/json;charset=utf-8'
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;
  a.download = 'content.json';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    500
  );

  showSavedToast(
    'تم تحميل content.json ✓',
    'success'
  );
}

/* =========================================================
   RESET
   ========================================================= */
function resetOverrides() {
  if (!adminActive) return;

  if (
    !confirm(
      'هل تريد التراجع عن كل التعديلات المحفوظة في هذا المتصفح؟'
    )
  ) {
    return;
  }

  localStorage.removeItem(
    window.OVERRIDES_KEY ||
      'smile_overrides'
  );

  showSavedToast(
    'تم التراجع عن التعديلات',
    'success'
  );

  setTimeout(
    () => location.reload(),
    350
  );
}

/* =========================================================
   GLOBAL CONTENT MANAGER
   ========================================================= */
function flattenContent(
  value,
  path = '',
  output = []
) {
  if (
    value === null ||
    value === undefined
  ) {
    output.push({
      path,
      value: '',
      type: 'null'
    });

    return output;
  }

  if (
    Array.isArray(value)
  ) {
    if (value.length === 0) {
      output.push({
        path,
        value: [],
        type: 'empty-array'
      });

      return output;
    }

    value.forEach(
      (item, index) => {
        const nextPath =
          path
            ? `${path}.${index}`
            : String(index);

        if (
          item !== null &&
          typeof item === 'object'
        ) {
          flattenContent(
            item,
            nextPath,
            output
          );
        } else {
          output.push({
            path: nextPath,
            value: item,
            type: typeof item
          });
        }
      }
    );

    return output;
  }

  if (
    typeof value === 'object'
  ) {
    Object.keys(value).forEach(
      key => {
        const nextPath =
          path
            ? `${path}.${key}`
            : key;

        flattenContent(
          value[key],
          nextPath,
          output
        );
      }
    );

    return output;
  }

  output.push({
    path,
    value,
    type: typeof value
  });

  return output;
}

function formatAdminValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (
    typeof value === 'boolean'
  ) {
    return value
      ? 'true'
      : 'false';
  }

  if (
    typeof value === 'object'
  ) {
    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getPathValue(path) {
  if (
    typeof window.getOverrideValue ===
    'function'
  ) {
    const override =
      window.getOverrideValue(path);

    if (
      override !== undefined
    ) {
      return override;
    }
  }

  const data =
    typeof window.getSiteData ===
    'function'
      ? window.getSiteData()
      : null;

  return data
    ? getNestedValue(
        data,
        path
      )
    : undefined;
}

function setContentValue(
  path,
  value
) {
  if (
    typeof window.saveOverride !==
    'function'
  ) {
    showSavedToast(
      'نظام تعديل المحتوى غير متاح',
      'error'
    );
    return false;
  }

  window.saveOverride(
    path,
    value
  );

  return true;
}

function parseAdminValue(
  input,
  current
) {
  const raw =
    String(input);

  if (
    typeof current === 'boolean'
  ) {
    return (
      raw.toLowerCase() ===
      'true'
    );
  }

  if (
    typeof current === 'number'
  ) {
    const number =
      Number(raw);

    return Number.isFinite(number)
      ? number
      : current;
  }

  if (
    raw === 'true'
  ) {
    return true;
  }

  if (
    raw === 'false'
  ) {
    return false;
  }

  if (
    /^-?\d+(\.\d+)?$/.test(raw)
  ) {
    return Number(raw);
  }

  return raw;
}

function editManagerField(path) {
  const current =
    getPathValue(path);

  const isObject =
    current !== null &&
    typeof current === 'object';

  if (isObject) {
    const raw =
      prompt(
        'تعديل القيمة بصيغة JSON:',
        JSON.stringify(
          current,
          null,
          2
        )
      );

    if (raw === null) return;

    try {
      const parsed =
        JSON.parse(raw);

      if (
        setContentValue(
          path,
          parsed
        )
      ) {
        rerender();
        persistToServer(
          'تم تعديل المحتوى بنجاح'
        );
        openAdminManager();
      }
    } catch {
      showSavedToast(
        'صيغة JSON غير صحيحة',
        'error'
      );
    }

    return;
  }

  const value =
    prompt(
      'تعديل الحقل:',
      formatAdminValue(current)
    );

  if (value === null) return;

  const finalValue =
    parseAdminValue(
      value,
      current
    );

  if (
    setContentValue(
      path,
      finalValue
    )
  ) {
    rerender();

    persistToServer(
      'تم تعديل المحتوى بنجاح'
    );

    openAdminManager();
  }
}

function deleteManagerField(path) {
  const parts =
    pathParts(path);

  if (parts.length < 2) {
    showSavedToast(
      'لا يمكن حذف هذا الحقل الرئيسي',
      'error'
    );
    return;
  }

  const parentPath =
    parts.slice(0, -1).join('.');

  const key =
    parts[parts.length - 1];

  const parent =
    getPathValue(parentPath);

  if (
    !parent ||
    typeof parent !== 'object'
  ) {
    return;
  }

  if (
    !confirm(
      `هل تريد حذف الحقل "${key}"؟`
    )
  ) {
    return;
  }

  if (
    Array.isArray(parent)
  ) {
    const index =
      Number(key);

    if (
      !Number.isInteger(index)
    ) {
      return;
    }

    const next =
      parent.slice();

    next.splice(
      index,
      1
    );

    setContentValue(
      parentPath,
      next
    );
  } else {
    const next = {
      ...parent
    };

    delete next[key];

    setContentValue(
      parentPath,
      next
    );
  }

  rerender();

  persistToServer(
    'تم حذف العنصر بنجاح'
  );

  openAdminManager();
}

function addManagerItem(path) {
  const current =
    getPathValue(path);

  if (
    Array.isArray(current)
  ) {
    const raw =
      prompt(
        'أدخل العنصر الجديد.\n\nللنص: اكتب النص مباشرة.\nللكائن: استخدم JSON.'
      );

    if (raw === null) return;

    let item = raw;

    try {
      item =
        JSON.parse(raw);
    } catch {
      item = raw;
    }

    const next =
      current.slice();

    next.push(item);

    setContentValue(
      path,
      next
    );

    rerender();

    persistToServer(
      'تمت إضافة العنصر بنجاح'
    );

    openAdminManager();

    return;
  }

  showSavedToast(
    'هذا الحقل ليس قائمة قابلة للإضافة',
    'error'
  );
}

function openAdminManager() {
  if (!adminActive) return;

  closeAdminManager();

  const overlay =
    document.createElement('div');

  overlay.id =
    'adminManagerOverlay';

  const manager =
    document.createElement('div');

  manager.id =
    'adminManager';

  manager.innerHTML = `
    <div class="admin-manager-head">
      <div>
        <h2 class="admin-manager-title">
          مركز إدارة موقع مجمع عناية الابتسامة
        </h2>
        <p class="admin-manager-subtitle">
          تعديل شامل للنصوص والمحتوى والخدمات والقوائم من مكان واحد
        </p>
      </div>

      <button
        type="button"
        class="admin-manager-close"
        aria-label="إغلاق"
        id="adminManagerClose"
      >×</button>
    </div>

    <div class="admin-manager-tools">
      <input
        id="adminManagerSearch"
        class="admin-manager-search"
        type="search"
        placeholder="ابحث عن أي نص أو مسار أو خدمة..."
        autocomplete="off"
      />

      <button
        type="button"
        class="admin-manager-tool-btn"
        id="adminManagerRefresh"
      >تحديث</button>

      <button
        type="button"
        class="admin-manager-tool-btn gold"
        id="adminManagerSave"
      >حفظ الكل</button>

      <button
        type="button"
        class="admin-manager-tool-btn red"
        id="adminManagerClose2"
      >إغلاق</button>
    </div>

    <div
      id="adminManagerList"
      class="admin-manager-list"
    ></div>
  `;

  overlay.appendChild(manager);
  document.body.appendChild(overlay);

  document
    .getElementById(
      'adminManagerClose'
    )
    ?.addEventListener(
      'click',
      closeAdminManager
    );

  document
    .getElementById(
      'adminManagerClose2'
    )
    ?.addEventListener(
      'click',
      closeAdminManager
    );

  document
    .getElementById(
      'adminManagerRefresh'
    )
    ?.addEventListener(
      'click',
      () => {
        renderAdminManager();
      }
    );

  document
    .getElementById(
      'adminManagerSave'
    )
    ?.addEventListener(
      'click',
      () => {
        persistToServer(
          'تم حفظ جميع التعديلات'
        );
      }
    );

  document
    .getElementById(
      'adminManagerSearch'
    )
    ?.addEventListener(
      'input',
      renderAdminManager
    );

  overlay.addEventListener(
    'click',
    e => {
      if (e.target === overlay) {
        closeAdminManager();
      }
    }
  );

  renderAdminManager();
}

function renderAdminManager() {
  const list =
    document.getElementById(
      'adminManagerList'
    );

  if (!list) return;

  if (
    typeof window.getSiteData !==
    'function'
  ) {
    list.innerHTML = `
      <div class="admin-manager-empty">
        تعذر قراءة بيانات الموقع.
      </div>
    `;
    return;
  }

  const data =
    window.getSiteData();

  if (!data) {
    list.innerHTML = `
      <div class="admin-manager-empty">
        لا توجد بيانات متاحة حالياً.
      </div>
    `;
    return;
  }

  const searchInput =
    document.getElementById(
      'adminManagerSearch'
    );

  const query =
    String(
      searchInput?.value || ''
    )
      .trim()
      .toLowerCase();

  const fields =
    flattenContent(data);

  const filtered =
    query
      ? fields.filter(field => {
          const path =
            String(
              field.path
            ).toLowerCase();

          const value =
            formatAdminValue(
              getPathValue(
                field.path
              )
            ).toLowerCase();

          return (
            path.includes(query) ||
            value.includes(query)
          );
        })
      : fields;

  if (!filtered.length) {
    list.innerHTML = `
      <div class="admin-manager-empty">
        لا توجد نتائج مطابقة للبحث.
      </div>
    `;
    return;
  }

  const groups =
    new Map();

  filtered.forEach(field => {
    const root =
      field.path.split('.')[0] ||
      'المحتوى';

    if (!groups.has(root)) {
      groups.set(root, []);
    }

    groups
      .get(root)
      .push(field);
  });

  const fragment =
    document.createDocumentFragment();

  groups.forEach(
    (groupFields, groupName) => {
      const group =
        document.createElement('section');

      group.className =
        'admin-manager-group';

      const title =
        document.createElement('div');

      title.className =
        'admin-manager-group-title';

      title.textContent =
        groupName;

      group.appendChild(title);

      groupFields.forEach(
        field => {
          const row =
            document.createElement('div');

          row.className =
            'admin-field-row';

          const path =
            document.createElement('div');

          path.className =
            'admin-field-path';

          path.textContent =
            field.path;

          const value =
            document.createElement('div');

          value.className =
            'admin-field-value';

          value.textContent =
            formatAdminValue(
              getPathValue(
                field.path
              )
            );

          const actions =
            document.createElement('div');

          actions.className =
            'admin-field-actions';

          const edit =
            document.createElement('button');

          edit.type = 'button';
          edit.className =
            'admin-field-action';
          edit.textContent =
            'تعديل';

          edit.addEventListener(
            'click',
            () => {
              editManagerField(
                field.path
              );
            }
          );

          actions.appendChild(edit);

          const current =
            getPathValue(
              field.path
            );

          if (
            Array.isArray(current)
          ) {
            const add =
              document.createElement(
                'button'
              );

            add.type = 'button';
            add.className =
              'admin-field-action add';
            add.textContent =
              'إضافة';

            add.addEventListener(
              'click',
              () => {
                addManagerItem(
                  field.path
                );
              }
            );

            actions.appendChild(add);
          }

          const parts =
            pathParts(
              field.path
            );

          if (
            parts.length > 1
          ) {
            const del =
              document.createElement(
                'button'
              );

            del.type = 'button';
            del.className =
              'admin-field-action delete';
            del.textContent =
              'حذف';

            del.addEventListener(
              'click',
              () => {
                deleteManagerField(
                  field.path
                );
              }
            );

            actions.appendChild(del);
          }

          row.appendChild(path);
          row.appendChild(value);
          row.appendChild(actions);

          group.appendChild(row);
        }
      );

      fragment.appendChild(group);
    }
  );

  list.innerHTML = '';
  list.appendChild(fragment);
}

function closeAdminManager() {
  const overlay =
    document.getElementById(
      'adminManagerOverlay'
    );

  if (overlay) {
    overlay.remove();
  }
}

/* =========================================================
   ADMIN ENTRY
   الاختصار: Ctrl/Cmd + Shift + A
   ========================================================= */
function bindHiddenAdminEntry() {
  if (
    document.documentElement.dataset
      .adminShortcutBound === '1'
  ) {
    return;
  }

  document.documentElement.dataset
    .adminShortcutBound = '1';

  document.addEventListener(
    'keydown',
    e => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        String(e.key).toLowerCase() === 'a'
      ) {
        e.preventDefault();

        if (adminActive) {
          openAdminManager();
        } else {
          enterAdminMode();
        }
      }

      if (
        e.key === 'Escape' &&
        adminActive
      ) {
        closeAdminManager();
      }
    }
  );
}

/* =========================================================
   EXISTING HTML BUTTONS
   ========================================================= */
function bindExistingAdminButtons() {
  const entryBtnEl =
    document.getElementById(
      'adminEntryBtn'
    );

  const exitBtnEl =
    document.getElementById(
      'adminExitBtn'
    );

  const downloadBtnEl =
    document.getElementById(
      'adminDownloadBtn'
    );

  const resetBtnEl =
    document.getElementById(
      'adminResetBtn'
    );

  const galleryBtnEl =
    document.getElementById(
      'adminGalleryBtn'
    );

  const managerBtnEl =
    document.getElementById(
      'adminManagerBtn'
    );

  if (
    entryBtnEl &&
    entryBtnEl.dataset.adminBound !== '1'
  ) {
    entryBtnEl.dataset.adminBound = '1';

    entryBtnEl.addEventListener(
      'click',
      e => {
        e.preventDefault();
        enterAdminMode();
      }
    );
  }

  if (
    exitBtnEl &&
    exitBtnEl.dataset.adminBound !== '1'
  ) {
    exitBtnEl.dataset.adminBound = '1';

    exitBtnEl.addEventListener(
      'click',
      exitAdminMode
    );
  }

  if (
    downloadBtnEl &&
    downloadBtnEl.dataset.adminBound !== '1'
  ) {
    downloadBtnEl.dataset.adminBound = '1';

    downloadBtnEl.addEventListener(
      'click',
      downloadUpdatedJson
    );
  }

  if (
    resetBtnEl &&
    resetBtnEl.dataset.adminBound !== '1'
  ) {
    resetBtnEl.dataset.adminBound = '1';

    resetBtnEl.addEventListener(
      'click',
      resetOverrides
    );
  }

  if (
    galleryBtnEl &&
    galleryBtnEl.dataset.adminBound !== '1'
  ) {
    galleryBtnEl.dataset.adminBound = '1';

    galleryBtnEl.addEventListener(
      'click',
      () => {
        if (!window.adminActive) return;

        sessionStorage.setItem(
          ADMIN_SESSION_KEY,
          '1'
        );

        location.href =
          'catalog.html';
      }
    );
  }

  if (
    managerBtnEl &&
    managerBtnEl.dataset.adminBound !== '1'
  ) {
    managerBtnEl.dataset.adminBound = '1';

    managerBtnEl.addEventListener(
      'click',
      openAdminManager
    );
  }
}

/* =========================================================
   TOOLBAR MANAGER BUTTON
   ========================================================= */
function ensureManagerButton() {
  if (!adminActive) return;

  const toolbar =
    document.getElementById(
      'adminToolbar'
    );

  if (!toolbar) return;

  if (
    document.getElementById(
      'adminManagerBtn'
    )
  ) {
    return;
  }

  const button =
    document.createElement('button');

  button.id =
    'adminManagerBtn';

  button.type = 'button';

  button.className =
    'admin-op-btn op-manage';

  button.textContent =
    'مركز إدارة المحتوى';

  button.title =
    'تعديل جميع محتويات الموقع';

  button.addEventListener(
    'click',
    openAdminManager
  );

  toolbar.appendChild(button);
}

/* =========================================================
   RESTORE SESSION
   ========================================================= */
function restoreAdminSession() {
  const isAdmin =
    sessionStorage.getItem(
      ADMIN_SESSION_KEY
    ) === '1';

  const tb =
    document.getElementById(
      'adminToolbar'
    );

  const entry =
    document.getElementById(
      'adminEntryBtn'
    );

  if (
    isAdmin &&
    lastAdminCode
  ) {
    adminActive = true;
    window.adminActive = true;

    document.body.classList.add(
      'admin-mode'
    );

    if (tb) {
      tb.hidden = false;
    }

    if (entry) {
      entry.style.display =
        'none';
    }

    if (
      typeof renderCatalog ===
      'function'
    ) {
      renderCatalog();
    }

    setTimeout(() => {
      ensureManagerButton();
      attachEditButtons();
    }, 80);

    return;
  }

  adminActive = false;
  window.adminActive = false;

  sessionStorage.removeItem(
    ADMIN_SESSION_KEY
  );

  document.body.classList.remove(
    'admin-mode'
  );

  if (tb) {
    tb.hidden = true;
  }

  if (entry) {
    entry.style.display = 'flex';
    entry.style.visibility = 'visible';
    entry.style.opacity = '1';
    entry.style.pointerEvents = 'auto';
  }

  removeEditButtons();
}

/* =========================================================
   EVENTS
   ========================================================= */
document.addEventListener(
  'siteRendered',
  () => {
    if (adminActive) {
      ensureManagerButton();
      attachEditButtons();
    } else {
      const tb =
        document.getElementById(
          'adminToolbar'
        );

      if (tb) {
        tb.hidden = true;
      }
    }
  }
);

document.addEventListener(
  'DOMContentLoaded',
  () => {
    bindHiddenAdminEntry();
    bindExistingAdminButtons();
    bindImageUploader();
    restoreAdminSession();

    const tb =
      document.getElementById(
        'adminToolbar'
      );

    if (
      sessionStorage.getItem(
        ADMIN_SESSION_KEY
      ) !== '1' &&
      tb
    ) {
      tb.hidden = true;
    }

    if (adminActive) {
      ensureManagerButton();

      setTimeout(
        attachEditButtons,
        100
      );
    }
  }
);
