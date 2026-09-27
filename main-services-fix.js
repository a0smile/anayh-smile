/* ===== جزء عرض الخدمات فقط — استبدل دالة render الخاصة بالخدمات بهذا ===== */
/* أو انسخ المحتوى داخل safeRender('services', ...) في main.js */

safeRender('services', () => {
  const servicesGrid = document.getElementById('servicesGrid');
  if (!servicesGrid) return;

  const clinic = data.clinic || {};

  servicesGrid.innerHTML = (data.serviceCategories || []).map((cat, ci) => `
    <div class="price-category">
      ${cat.title ? `<h3 class="price-cat-title">
        <span class="price-cat-icon"${editAttr(`serviceCategories.${ci}.icon`)}>${(window.ndIconHtml ? window.ndIconHtml(cat.icon || 'tooth') : '')}</span>
        <span${editAttr(`serviceCategories.${ci}.title`)}>${cat.title}</span>
      </h3>` : ''}
      <div class="service-cards">
        ${cat.items.map((item, ii) => {
          const base = `serviceCategories.${ci}.items.${ii}`;
          const waMsg = encodeURIComponent(
            `السلام عليكم ورحمة الله وبركاته. أما اخترت خدمة (${item.name}) هل أقدر أجيكم الآن؟`
          );
          return `<article class="service-card-wrap">
            <div class="service-card">
              <div class="service-card-inner">
                <h4 class="service-card-name"${editAttr(base + '.name')}>${item.name}</h4>
                <div class="service-card-prices">
                  ${item.oldPrice != null ? `
                    <span class="price-old">
                      <span class="price-label">قبل</span>
                      <span class="price-value"${editAttr(base + '.oldPrice')}>${item.oldPrice} ريال</span>
                    </span>` : '<span class="price-old"></span>'}
                  <span class="price-now">
                    <span class="price-label">بعد</span>
                    <span class="price-value"${editAttr(base + '.price')}>${item.price} ريال</span>
                  </span>
                </div>
              </div>
              <a class="price-wa-btn"
                 href="https://wa.me/${clinic.whatsapp}?text=${waMsg}"
                 target="_blank"
                 rel="noopener"
                 aria-label="اطلب خدمة ${item.name}">
                اطلبها
              </a>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>
  `).join('');
});
