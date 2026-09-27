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

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const items = getCatalogItems();
  const shapes = getCatalogShapes();

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
      <p style="font-size:.9rem;color:#999;margin-top:6px;">في وضع المالك أضف صورك من زر «＋ إضافة صورة».</p>
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
      <button type="button" class="ctool-img" data-action="img" data-index="${i}">تغيير</button>
      <button type="button" class="ctool-del" data-action="del" data-index="${i}">حذف</button>
      <button type="button" class="ctool-shape" data-action="shape" data-index="${i}">شكل</button>
      <button type="button" class="ctool-size" data-action="size" data-index="${i}">حجم</button>
      <button type="button" class="ctool-cap" data-action="cap" data-index="${i}">تعليق</button>
    `;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'catalog-img-wrap';

    const shapeClass = shapes[i] || '';
    if (item.src) {
      const img = document.createElement('img');
      img.className = 'catalog-img ' + shapeClass;
      img.src = item.src;
      img.alt = item.caption || ('صورة ' + (i + 1));
      img.loading = 'lazy';
      img.dataset.edit = `catalog.items.${i}.src`;
      img.dataset.editType = 'image';
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'catalog-placeholder';
      ph.innerHTML = `<div class="catalog-placeholder-icon">📷</div><p>الصورة ${i + 1}</p>`;
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

  grid.querySelectorAll('.catalog-tools button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.adminActive) {
        showCatalogToast('فعّل وضع المالك أولاً', 'error');
        return;
      }

      const idx = +btn.dataset.index;
      const action = btn.dataset.action;
      const items = getCatalogItems();
      const item = items[idx];
      if (!item && action !== 'img') return;

      if (action === 'del') {
        if (!confirm('هل تريد حذف هذه الصورة من المعرض؟')) return;
        items.splice(idx, 1);
        saveCatalogItems(items);
        const shapesMap = getCatalogShapes();
        delete shapesMap[idx];
        localStorage.setItem(CATALOG_SHAPE_KEY, JSON.stringify(shapesMap));
        renderCatalog();
        showCatalogToast('تم حذف الصورة ✓', 'success');
      } else if (action === 'img') {
        changeCatalogImage(idx);
      } else if (action === 'shape') {
        const cur = getCatalogShapes()[idx] || 'square';
        const next = cur === 'square' ? 'round' : cur === 'round' ? 'circle' : 'square';
        saveCatalogShape(idx, next);
        renderCatalog();
        showCatalogToast('تم تغيير شكل الصورة ✓', 'success');
      } else if (action === 'size') {
        const w = prompt('نسبة العرض بالنسبة المئوية (40-100):', '100');
        if (w !== null && !isNaN(+w) && +w >= 40 && +w <= 100) {
          const cards = grid.querySelectorAll('.catalog-item');
          if (cards[idx]) cards[idx].style.width = (+w) + '%';
          showCatalogToast('تم تغيير الحجم ✓', 'success');
        }
      } else if (action === 'cap') {
        const current = item.caption || '';
        const val = prompt('تعليق الصورة:', current);
        if (val === null) return;
        items[idx].caption = String(val).trim();
        saveCatalogItems(items);
        renderCatalog();
        showCatalogToast('تم حفظ التعليق ✓', 'success');
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
  if (!input) return;
  input.value = '';
  input.click();
}

const catalogAddBtn = document.getElementById('catalogAddBtn');
if (catalogAddBtn) {
  catalogAddBtn.addEventListener('click', () => {
    if (!window.adminActive) {
      showCatalogToast('قم بدخول وضع المالك أولاً لتفعيل الإضافة', 'error');
      return;
    }
    pendingCatalogImageIndex = '__new__';
    pickCatalogImage();
  });
}

const catalogFileInput = document.getElementById('catalogFileInput');
if (catalogFileInput) {
  catalogFileInput.addEventListener('change', () => {
    const file = catalogFileInput.files && catalogFileInput.files[0];
    if (!file) {
      pendingCatalogImageIndex = null;
      return;
    }
    if (!file.type.startsWith('image/')) {
      showCatalogToast('اختر ملف صورة صحيح', 'error');
      pendingCatalogImageIndex = null;
      return;
    }

    const target = pendingCatalogImageIndex;
    pendingCatalogImageIndex = null;

    const reader = new FileReader();
    reader.onload = () => {
      const items = getCatalogItems();
      if (target === '__new__') {
        items.push({ src: reader.result, caption: '' });
        saveCatalogItems(items);
        renderCatalog();
        showCatalogToast('تمت إضافة الصورة ✓', 'success');
      } else if (typeof target === 'number') {
        if (!items[target]) return;
        items[target].src = reader.result;
        saveCatalogItems(items);
        renderCatalog();
        showCatalogToast('تم تغيير الصورة ✓', 'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

const catalogBackBtn = document.getElementById('catalogBackBtn');
if (catalogBackBtn) {
  catalogBackBtn.addEventListener('click', () => {
    location.href = 'index.html';
  });
}

window.catalogNeedsAdmin = true;
window.renderCatalog = renderCatalog;

document.addEventListener('adminModeChanged', () => {
  renderCatalog();
});

window.addEventListener('DOMContentLoaded', () => {
  const _sd = window.getSiteData && window.getSiteData();
  document.title = (_sd && _sd.clinic && _sd.clinic.name ? _sd.clinic.name : 'المجمع') + ' — المعرض';
  renderCatalog();
});