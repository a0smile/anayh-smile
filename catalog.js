/* ============================================
   صفحة المعرض — عرض وتحرير صور الخدمات
   الصور تُخزَّن داخل catalog.items في content.json
   (نفس نظام وضع المالك) فتُزامَن وتُحمَّل مع الموقع
   ============================================ */

const CATALOG_ITEMS_PATH = 'catalog.items';
const CATALOG_LEGACY_KEY = 'smile_catalog_items';
const CATALOG_LEGACY_SHAPE_KEY = 'smile_catalog_shapes';

const CATALOG_MAX_RAW_BYTES = 8 * 1024 * 1024;
const CATALOG_MAX_DIM = 1600;
const CATALOG_SHAPES = ['square', 'round', 'circle'];
const CATALOG_SHAPE_LABELS = { square: 'مربع', round: 'زوايا ناعمة', circle: 'دائري' };

/* ===== قراءة وحفظ العناصر عبر نظام المحتوى الموحّد ===== */

function getCatalogItems() {
  const sd = window.getSiteData && window.getSiteData();
  const items = sd && sd.catalog && Array.isArray(sd.catalog.items) ? sd.catalog.items : [];
  return items.map(it => Object.assign({ src: '', caption: '', shape: 'square', size: 100 }, it || {}));
}

function saveCatalogItems(items) {
  if (!window.saveOverride) {
    showCatalogToast('نظام التعديل غير جاهز بعد', 'error');
    return false;
  }
  try {
    window.saveOverride(CATALOG_ITEMS_PATH, items);
    return true;
  } catch (e) {
    showCatalogToast('مساحة التخزين ممتلئة — احذف بعض الصور ثم أعد المحاولة', 'error');
    return false;
  }
}

function updateCatalogItem(index, patch) {
  const items = getCatalogItems();
  if (!items[index]) return false;
  items[index] = Object.assign({}, items[index], patch);
  return saveCatalogItems(items);
}

function persistCatalog(actionLabel) {
  if (typeof window.persistToServer === 'function') {
    window.persistToServer(actionLabel);
  } else if (typeof showSavedToast === 'function') {
    showSavedToast((actionLabel || 'تم الحفظ') + ' محلياً ✓', 'success');
  }
}

/* ===== ترحيل الصور القديمة المحفوظة معزولة في المفاتيح القديمة ===== */

function migrateLegacyCatalog() {
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem(CATALOG_LEGACY_KEY) || 'null'); } catch (e) {}
  const hasLegacy = Array.isArray(legacy) && legacy.length > 0;

  if (hasLegacy && !getCatalogItems().length) {
    let shapes = {};
    try { shapes = JSON.parse(localStorage.getItem(CATALOG_LEGACY_SHAPE_KEY) || '{}'); } catch (e) {}
    saveCatalogItems(legacy.map((it, i) => ({
      src: (it && it.src) || '',
      caption: (it && it.caption) || '',
      shape: CATALOG_SHAPES.includes(shapes[i]) ? shapes[i] : 'square',
      size: 100
    })));
  }

  try {
    localStorage.removeItem(CATALOG_LEGACY_KEY);
    localStorage.removeItem(CATALOG_LEGACY_SHAPE_KEY);
  } catch (e) {}
}

/* ===== التنبيهات ===== */

function showCatalogToast(msg, type) {
  if (typeof showSavedToast === 'function') {
    showSavedToast(msg, type || 'success');
    return;
  }
  let t = document.getElementById('smileToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'smileToast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove('show', 'success', 'error');
  }, 1800);
}

/* ===== معالجة الصورة: تحقق من النوع/الحجم + تصغير لتفادي امتلاء التخزين ===== */

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('اختر ملف صورة صحيح'));
      return;
    }
    if (file.size > CATALOG_MAX_RAW_BYTES) {
      reject(new Error('حجم الصورة كبير جداً (الحد 8 ميجابايت)'));
      return;
    }
    if (file.type === 'image/svg+xml') {
      readFileAsDataURL(file).then(resolve).catch(() => reject(new Error('تعذّر قراءة الملف')));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const scale = Math.min(1, CATALOG_MAX_DIM / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);

        const out = /png/i.test(file.type)
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        resolve(out);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(new Error('تعذّرت معالجة الصورة'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذّر فتح الصورة'));
    };
    img.src = url;
  });
}

/* ===== العرض ===== */

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const items = getCatalogItems();
  const sd = window.getSiteData && window.getSiteData();
  const cat = (sd && sd.catalog) || {};

  const titleEl = document.getElementById('catalogTitle');
  const subEl = document.getElementById('catalogSubtitle');
  if (titleEl) titleEl.textContent = cat.title || 'معرض خدماتنا';
  if (subEl) subEl.textContent = cat.subtitle || 'شاهد أعمالنا وصور خدماتنا';

  if (!items.length) {
    grid.innerHTML = `<div class="catalog-empty">
      <div class="catalog-placeholder-icon">📷</div>
      <p>لا توجد صور في المعرض بعد.</p>
      <p class="catalog-empty-hint">في وضع المالك أضف صورك من زر «＋ إضافة صورة».</p>
    </div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach((item, i) => {
    const shape = CATALOG_SHAPES.includes(item.shape) ? item.shape : 'square';
    const size = Math.min(100, Math.max(40, Number(item.size) || 100));

    const card = document.createElement('div');
    card.className = 'catalog-item';
    if (size < 100) card.style.width = size + '%';

    const tools = document.createElement('div');
    tools.className = 'catalog-tools';
    tools.innerHTML = `
      <button type="button" class="ctool-img" data-action="img" data-index="${i}" aria-label="تغيير الصورة">تغيير</button>
      <button type="button" class="ctool-shape" data-action="shape" data-index="${i}" aria-label="تغيير الشكل">الشكل: ${CATALOG_SHAPE_LABELS[shape]}</button>
      <button type="button" class="ctool-size" data-action="size" data-index="${i}" aria-label="تغيير الحجم">الحجم: ${size}%</button>
      <button type="button" class="ctool-cap" data-action="cap" data-index="${i}" aria-label="تعديل التعليق">تعليق</button>
      <button type="button" class="ctool-del" data-action="del" data-index="${i}" aria-label="حذف الصورة">حذف</button>
    `;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'catalog-img-wrap catalog-shape-' + shape;

    if (item.src) {
      const img = document.createElement('img');
      img.className = 'catalog-img';
      img.src = item.src;
      img.alt = item.caption || ('صورة ' + (i + 1));
      img.loading = 'lazy';
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'catalog-placeholder';
      ph.innerHTML = `<div class="catalog-placeholder-icon">📷</div><p>الصورة ${i + 1}</p>`;
      imgWrap.appendChild(ph);
    }

    card.appendChild(tools);
    card.appendChild(imgWrap);

    if (item.caption) {
      const cap = document.createElement('div');
      cap.className = 'catalog-caption';
      cap.textContent = item.caption;
      imgWrap.appendChild(cap);
    }

    frag.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
}

/* ===== تفاعل موحّد (تفويض حدث واحد على الشبكة) ===== */

function handleCatalogAction(btn) {
  const idx = Number(btn.dataset.index);
  const action = btn.dataset.action;
  const items = getCatalogItems();
  const item = items[idx];

  if (action === 'img') {
    pendingCatalogImageIndex = idx;
    pickCatalogImage();
    return;
  }
  if (!item) return;

  if (action === 'del') {
    if (!confirm('هل تريد حذف هذه الصورة من المعرض؟')) return;
    items.splice(idx, 1);
    if (!saveCatalogItems(items)) return;
    renderCatalog();
    persistCatalog('تم حذف الصورة ✓');
  } else if (action === 'shape') {
    const cur = CATALOG_SHAPES.includes(item.shape) ? item.shape : 'square';
    const next = CATALOG_SHAPES[(CATALOG_SHAPES.indexOf(cur) + 1) % CATALOG_SHAPES.length];
    if (!updateCatalogItem(idx, { shape: next })) return;
    renderCatalog();
    persistCatalog('تم تغيير الشكل إلى ' + CATALOG_SHAPE_LABELS[next] + ' ✓');
  } else if (action === 'size') {
    const w = prompt('حجم البطاقة بالنسبة المئوية (40-100):', String(item.size || 100));
    if (w === null) return;
    const num = Number(w);
    if (isNaN(num) || num < 40 || num > 100) {
      showCatalogToast('أدخل رقماً بين 40 و 100', 'error');
      return;
    }
    if (!updateCatalogItem(idx, { size: Math.round(num) })) return;
    renderCatalog();
    persistCatalog('تم تغيير الحجم ✓');
  } else if (action === 'cap') {
    const val = prompt('تعليق الصورة:', item.caption || '');
    if (val === null) return;
    if (!updateCatalogItem(idx, { caption: String(val).trim() })) return;
    renderCatalog();
    persistCatalog('تم حفظ التعليق ✓');
  }
}

let pendingCatalogImageIndex = null;
let catalogUploading = false;

function pickCatalogImage() {
  const input = document.getElementById('catalogFileInput');
  if (!input) return;
  input.value = '';
  input.click();
}

/* ===== ربط عناصر الواجهة (مرّة واحدة) ===== */

function initCatalogUI() {
  const grid = document.getElementById('catalogGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.catalog-tools button');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (!window.adminActive) {
        showCatalogToast('فعّل وضع المالك أولاً', 'error');
        return;
      }
      handleCatalogAction(btn);
    });
  }

  const addBtn = document.getElementById('catalogAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!window.adminActive) {
        showCatalogToast('قم بدخول وضع المالك أولاً لتفعيل الإضافة', 'error');
        return;
      }
      pendingCatalogImageIndex = '__new__';
      pickCatalogImage();
    });
  }

  const fileInput = document.getElementById('catalogFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      const target = pendingCatalogImageIndex;
      pendingCatalogImageIndex = null;
      if (!file || catalogUploading) return;

      catalogUploading = true;
      processImageFile(file)
        .then((dataUrl) => {
          if (target === '__new__') {
            const items = getCatalogItems();
            items.push({ src: dataUrl, caption: '', shape: 'square', size: 100 });
            if (!saveCatalogItems(items)) return;
            renderCatalog();
            persistCatalog('تمت إضافة الصورة ✓');
          } else if (typeof target === 'number') {
            if (!updateCatalogItem(target, { src: dataUrl })) return;
            renderCatalog();
            persistCatalog('تم تغيير الصورة ✓');
          }
        })
        .catch((err) => showCatalogToast((err && err.message) || 'تعذّرت معالجة الصورة', 'error'))
        .then(() => { catalogUploading = false; });
    });
  }

  const backBtn = document.getElementById('catalogBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => { location.href = 'index.html'; });
  }
}

window.renderCatalog = renderCatalog;
window.getCatalogItems = getCatalogItems;

document.addEventListener('adminModeChanged', renderCatalog);

document.addEventListener('siteRendered', () => {
  if (!migrateLegacyCatalog.done) {
    migrateLegacyCatalog.done = true;
    migrateLegacyCatalog();
  }
  renderCatalog();
});

window.addEventListener('DOMContentLoaded', () => {
  initCatalogUI();
  const sd = window.getSiteData && window.getSiteData();
  document.title = (sd && sd.clinic && sd.clinic.name ? sd.clinic.name : 'المجمع') + ' — المعرض';
  renderCatalog();
});
