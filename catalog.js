/* ============================================
   صفحة الكتالوج — عرض وتحرير صور الخدمات
   كل صورة بزر تعديل كامل في وضع المالك
   ============================================ */

const CATALOG_KEY = 'smile_catalog_items';
const CATALOG_SHAPE_KEY = 'smile_catalog_shapes';

function getCatalogItems() {
  try { return JSON.parse(localStorage.getItem(CATALOG_KEY)) || []; }
  catch { return []; }
}

function saveCatalogItems(items) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
}

function getCatalogShapes() {
  try { return JSON.parse(localStorage.getItem(CATALOG_SHAPE_KEY)) || {}; }
  catch { return {}; }
}

function saveCatalogShape(index, shape) {
  const shapes = getCatalogShapes();
  if (!shape || shape === 'square') delete shapes[index];
  else shapes[index] = shape;
  localStorage.setItem(CATALOG_SHAPE_KEY, JSON.stringify(shapes));
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const items = getCatalogItems();

  const sd = window.getSiteData && window.getSiteData();
  const cat = (sd && sd.catalog) || {};
  document.getElementById('catalogTitle').textContent = cat.title || 'معرض خدماتنا';
  document.getElementById('catalogSubtitle').textContent = cat.subtitle || '';

  if (!items.length) {
    grid.innerHTML = `<div class="catalog-empty">
      <div class="catalog-placeholder-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><rect x="7" y="9" width="34" height="30" rx="5"/><circle cx="17" cy="20" r="3"/><path d="M9 34l10-9 8 6 6-5 7 6"/></svg></div>
      <p>لا توجد صور في المعرض بعد.</p>
      <p style="font-size:.9rem;color:#999;margin-top:6px;">في وضع المالك أضف صورك من زر "＋ إضافة صورة".</p>
    </div>`;
    return;
  }

  grid.innerHTML = '';
  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'catalog-item';
    card.dataset.edit = `catalog.items.${i}.src`;
    card.dataset.editType = 'image';

    const tools = document.createElement('div');
    tools.className = 'catalog-tools';
    tools.innerHTML = `
      <button type="button" class="ctool-img" data-action="img" data-index="${i}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><rect x="7" y="9" width="34" height="30" rx="5"/><circle cx="17" cy="20" r="3"/><path d="M9 34l10-9 8 6 6-5 7 6"/></svg> تغيير</button>
      <button type="button" class="ctool-del" data-action="del" data-index="${i}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><path d="M10 14h28M19 14V9h10v5M14 14l2 28h16l2-28"/><path d="M21 22v13M27 22v13"/></svg> حذف</button>
      <button type="button" class="ctool-shape" data-action="shape" data-index="${i}"> شكل</button>
      <button type="button" class="ctool-size" data-action="size" data-index="${i}">⤢ حجم</button>
    `;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'catalog-img-wrap';

    if (item.src) {
      const img = document.createElement('img');
      img.className = 'catalog-img ' + (getCatalogShapes()[i] || '');
      img.src = item.src;
      img.alt = item.caption || '';
      img.dataset.edit = `catalog.items.${i}.src`;
      img.dataset.editType = 'image';
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'catalog-placeholder';
      ph.innerHTML = `<div class="catalog-placeholder-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><rect x="7" y="9" width="34" height="30" rx="5"/><circle cx="17" cy="20" r="3"/><path d="M9 34l10-9 8 6 6-5 7 6"/></svg></div><p>الصورة ${i+1}</p>`;
      imgWrap.appendChild(ph);
    }

    if (item.caption) {
      const cap = document.createElement('div');
      cap.className = 'catalog-caption';
      cap.textContent = item.caption;
      imgWrap.appendChild(cap);
    }

    card.appendChild(tools);
    card.appendChild(imgWrap);
    grid.appendChild(card);
  });

  // ربط أزرار الأدوات — تُربط دائمًا، وظهورها يتحكم به CSS عبر body.admin-mode
  grid.querySelectorAll('.catalog-tools button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.adminActive) { alert('فعّل وضع المالك أولاً '); return; }
      const idx = +btn.dataset.index;
      const action = btn.dataset.action;
      const items = getCatalogItems();
      const item = items[idx];
      if (!item) return;

      if (action === 'del') {
        if (!confirm('هل تريد حذف هذه الصورة من المعرض؟')) return;
        items.splice(idx, 1);
        saveCatalogItems(items);
        renderCatalog();
        showCatalogToast('<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><path d="M10 14h28M19 14V9h10v5M14 14l2 28h16l2-28"/><path d="M21 22v13M27 22v13"/></svg> تم حذف الصورة');
      } else if (action === 'img') {
        changeCatalogImage(idx);
      } else if (action === 'shape') {
        const cur = getCatalogShapes()[idx];
        const next = cur === 'circle' ? 'round' : 'square';
        saveCatalogShape(idx, next);
        renderCatalog();
        showCatalogToast(' تم تغيير شكل الصورة');
      } else if (action === 'size') {
        const w = prompt('نسبة العرض بالنسبة المئوية (40-100):', '100');
        if (w && !isNaN(+w)) {
          const cards = grid.querySelectorAll('.catalog-item');
          if (cards[idx]) cards[idx].style.width = (+w) + '%';
        }
      }
    });
  });
}

let pendingCatalogImageIndex = null;

function changeCatalogImage(idx) {
  pendingCatalogImageIndex = idx;
  pickCatalogImage();
}

function pickCatalogImage() {
  const input = document.getElementById('catalogFileInput');
  input.value = '';
  input.click();
}

/* إضافة صورة جديدة (زر المالك) */
document.getElementById('catalogAddBtn').addEventListener('click', () => {
  if (!window.adminActive) { alert('قم بدخول وضع المالك أولاً لتفعيل الإضافة.'); return; }
  pendingCatalogImageIndex = '__new__';
  pickCatalogImage();
});

/* عند اختيار صورة (تغيير أو إضافة) */
document.getElementById('catalogFileInput').addEventListener('change', () => {
  const file = document.getElementById('catalogFileInput').files[0];
  if (!file) { pendingCatalogImageIndex = null; return; }
  if (!file.type.startsWith('image/')) { alert('اختر ملف صورة صحيح.'); return; }

  const target = pendingCatalogImageIndex;
  pendingCatalogImageIndex = null;

  const reader = new FileReader();
  reader.onload = () => {
    const items = getCatalogItems();
    if (target === '__new__') {
      items.push({ src: reader.result, caption: '' });
      saveCatalogItems(items);
      renderCatalog();
      showCatalogToast('<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><path d="M24 10v28M10 24h28"/></svg> تمت إضافة الصورة');
    } else {
      const item = items[target];
      if (!item) return;
      item.src = reader.result;
      saveCatalogItems(items);
      renderCatalog();
      showCatalogToast('<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><circle cx="24" cy="24" r="17"/><path d="M15 25l6 6 12-13"/></svg> تم تغيير الصورة');
    }
  };
  reader.readAsDataURL(file);
});

function showCatalogToast(msg) {
  let t = document.getElementById('smileToast');
  if (!t) { t = document.createElement('div'); t.id = 'smileToast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1400);
}

document.getElementById('catalogBackBtn').addEventListener('click', () => { location.href = 'index.html'; });

window.catalogNeedsAdmin = true;

/* إعادة العرض عند تفعيل وضع المالك أو تحديث الجلسة */
document.addEventListener('adminModeChanged', () => {
  if (window.adminActive) renderCatalog();
});

window.addEventListener('DOMContentLoaded', () => {
  const _sd = window.getSiteData && window.getSiteData();
  document.title = (_sd && _sd.clinic && _sd.clinic.name ? _sd.clinic.name : 'المجمع') + ' — المعرض';
  renderCatalog();
});