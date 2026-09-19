/* ============================================
   مجمع عناية الابتسامة الطبي — ملف التشغيل
   لا تحتاج تعديل هذا الملف — كل المحتوى في content.json
   وضع المالك (أزرار التعديل) في ملف admin.js
   ============================================ */

let siteData = null;

/* ===== مسارات قابلة للتعديل تُقرأ من localStorage (وضع المالك) ===== */
const OVERRIDES_KEY = 'smile_overrides';

function getOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; }
  catch { return {}; }
}

function getDeep(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function applyOverrides(data) {
  const overrides = getOverrides();
  Object.entries(overrides).forEach(([path, value]) => setDeep(data, path, value));
  return data;
}
window.applyOverrides = applyOverrides;

async function loadContent() {
  try {
    const response = await fetch('content.json');
    let data = await response.json();
    siteData = applyOverrides(data);
    renderSite(siteData);

    //  كود حقيقي ومضمون لعرض الصور تلقائياً لجميع الزوار فور تحميل الصفحة
    if (siteData) {
      if (siteData.heroImage1) {
        const img1 = document.getElementById('heroImage1');
        const ph1 = document.getElementById('heroImagePlaceholder');
        if (img1 && ph1) {
          img1.src = siteData.heroImage1;
          img1.style.display = 'block';
          ph1.style.display = 'none';
        }
      }
      if (siteData.heroImage2) {
        const img2 = document.getElementById('heroImage2');
        const ph2 = document.getElementById('heroImagePlaceholder2');
        if (img2 && ph2) {
          img2.src = siteData.heroImage2;
          img2.style.display = 'block';
          ph2.style.display = 'none';
        }
      }
    }

    // إشعار وضع المالك بأن العرض اكتمل
    document.dispatchEvent(new CustomEvent('siteRendered'));
  } catch (error) {
    console.error('تعذر تحميل ملف المحتوى content.json', error);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text != null && text !== '') el.textContent = text;
}

/* وسم عناصر قابلة للتعديل (تُستخدم بأزرار "تعديل" في وضع المالك) */
function editAttr(path) {
  return ` data-edit="${path}" data-edit-type="text"`;
}

/* ربط حقل بالمسار المناسب لتعديله في وضع المالك */
function markEditable(id, path) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('data-edit', path);
  el.setAttribute('data-edit-type', 'text');
}

/* كل قسم يُعرض داخل try/catch حتى لا يتوقف بقية الموقع عند أي خلل */
function safeRender(name, fn) {
  try { fn(); }
  catch (e) { console.error('خطأ أثناء عرض قسم: ' + name, e); }
}

/* حركة عدّاد الأرقام عند ظهورها (تعمل مع أي رقم يبدو أوله رقما مثل "12+" أو "98%") */
function animateCounters() {
  const els = document.querySelectorAll('.count-up:not(.counted)');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.classList.add('counted');
      const raw = String(entry.target.dataset.target || '');
      const match = raw.match(/^(\d+)([\s\S]*)$/);
      if (!match) { entry.target.textContent = raw; return; }
      const end = +match[1];
      const suffix = match[2];
      const dur = 1300;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        entry.target.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.35 });
  els.forEach((el) => io.observe(el));
}

function ndStar() {
  return '<span class="star-icon">' + (window.ndIcon ? window.ndIcon('star') : '') + '</span>';
}
function renderDataIcons() {
  document.querySelectorAll('.nd-icon[data-icon]').forEach((el) => {
    el.innerHTML = window.ndIconHtml ? window.ndIconHtml(el.getAttribute('data-icon')) : '';
  });
}
function renderSite(data) {
  renderDataIcons();
  const { clinic, hero, offers, booking } = data;
  const sections = data.sections || {};
  const testimonials = data.testimonials || data.reviews || [];
  const workingHours = data.workingHours || [];
  const bookingServices = data.bookingServices || [];

  document.title = clinic.name || document.title;

  /* ===== نصوص الأقسام الثابتة: كلها قابلة للتعديل ===== */
  safeRender('sections', () => {
    const pairs = [
      ['servicesBadge', 'sections.servicesBadge'],
      ['servicesTitle', 'sections.servicesTitle'],
      ['servicesSubtitle', 'sections.servicesSubtitle'],
      ['tipsBadge', 'sections.tipsBadge'],
      ['tipsTitle', 'sections.tipsTitle'],
      ['tipsSubtitle', 'sections.tipsSubtitle'],
      ['dailyTipsTitle', 'sections.dailyTipsTitle'],
      ['featuresBadge', 'sections.featuresBadge'],
      ['featuresTitle', 'sections.featuresTitle'],
      ['featuresSubtitle', 'sections.featuresSubtitle'],
      ['offersBadge', 'sections.offersBadge'],
      ['doctorsBadge', 'sections.doctorsBadge'],
      ['doctorsTitle', 'sections.doctorsTitle'],
      ['doctorsSubtitle', 'sections.doctorsSubtitle'],
      ['reviewsBadge', 'sections.reviewsBadge'],
      ['reviewsTitle', 'sections.reviewsTitle'],
      ['reviewsSubtitle', 'sections.reviewsSubtitle'],
      ['reviewBoxTitle', 'sections.reviewBoxTitle'],
      ['reviewBoxText', 'sections.reviewBoxText'],
      ['reviewSubmitBtn', 'sections.reviewButton'],
      ['contactBadge', 'sections.contactBadge'],
      ['contactTitle', 'sections.contactTitle'],
      ['contactAddressTitle', 'sections.contactAddressTitle'],
      ['contactPhoneTitle', 'sections.contactPhoneTitle'],
      ['contactHoursTitle', 'sections.contactHoursTitle'],
      ['formNote', 'sections.formNote'],
      ['support1', 'sections.support1'],
      ['support2', 'sections.support2'],
      ['footerDesc', 'sections.footerDesc']
    ];
    pairs.forEach(([id, path]) => {
      setText(id, getDeep(sections, path.split('.').slice(1).join('.')));
      markEditable(id, path);
    });
    /* ملاحظة الأسعار تحتمل وسماً <strong> داخلياً */
    const noteEl = document.getElementById('servicesNote');
    if (noteEl) {
      noteEl.innerHTML = sections.servicesNote || '';
      markEditable('servicesNote', 'sections.servicesNote');
    }
  });

  safeRender('nationalDay', () => {
    const nd = data.nationalDay || {};
    const l = data.landmarks || [];
    const sections = data.sections || {};
    const greeting = document.getElementById('nationalDay');
    if (!nd.enabled && greeting) { greeting.style.display = 'none'; }

    if (nd.blendImage) {
      const b = document.getElementById('ndBlendImage');
      if (b) b.src = nd.blendImage;
    }
    if (nd.flagImage) {
      const f = document.getElementById('ndFlagImage');
      if (f) f.src = nd.flagImage;
    }
    if (nd.emblemImage) {
      const e = document.getElementById('ndEmblemImage');
      if (e) e.src = nd.emblemImage;
    }

    setText('ndBannerBadge', nd.badge || sections.nationalDayBadge);
    setText('ndBannerTitle', nd.greetingTitle);
    setText('ndBannerSlogan', nd.slogan);
    setText('nationalDayBadge', sections.nationalDayBadge);
    setText('nationalDayTitle', nd.greetingTitle);
    setText('nationalDayGreeting', nd.greeting);
    setText('nationalDayGreeting2', nd.greeting2);
    setText('nationalDayClosing', nd.closing);

    setText('landmarksBadge', sections.landmarksBadge);
    setText('landmarksTitle', sections.landmarksTitle);
    setText('landmarksSubtitle', sections.landmarksSubtitle);
    const lg = document.getElementById('landmarksGrid');
    if (lg) {
      lg.innerHTML = l.map((m, i) => {
        // تحديد صورة العيادة المناسبة لكل برج بشكل تلقائي وحقيقي
        let clinicImg = 'clinic-exterior.jpg'; 
        if (i === 1) clinicImg = 'clinic-interior.jpg'; // البرج الثاني (الفيصلية) يأخذ التصميم الداخلي
        if (i === 2) clinicImg = 'clinic-exterior.jpg'; // البرج الثالث يأخذ التصميم الخارجي

        return `
        <figure class="landmark-card reveal"${editAttr(`landmarks.\${i}.image`)} style="position: relative; overflow: hidden;">
          <!-- الطبقة الأولى: صورة البرج في الخلفية كاملة -->
          <div class="landmark-bg-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${m.image}'); background-size: cover; background-position: center; z-index: 1;"></div>
          
          <!-- الطبقة الثانية: صورة العيادة في المقدمة بالأسفل مع دمج التلاشي السحري -->
          <div class="clinic-fg-layer" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background-image: url('${clinicImg}'); background-size: cover; background-position: center; z-index: 2; -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); mask-image: linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);"></div>
          
          <!-- الطبقة الثالثة: النصوص فوق الصورتين المدمجتين -->
          <figcaption style="position: relative; z-index: 3; background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);">
            <h3${editAttr(`landmarks.\${i}.title`)}>${m.title}</h3>
            <p${editAttr(`landmarks.\${i}.subtitle`)}>${m.subtitle || ''}</p>
          </figcaption>
        </figure>
      `; }).join('');
    }

    const logoNd = document.getElementById('logoNationalDay');
    if (logoNd) logoNd.textContent = `${nd.badge || ''}`.trim() || `اليوم الوطني السعودي ${nd.year || ''}`;
  });

  safeRender('announcement', () => {
    if (data.announcement) {
      const bar = document.getElementById('announcementBar');
      bar.style.display = '';
      document.getElementById('announcementText').textContent = data.announcement;
      document.getElementById('announcementText2').textContent = data.announcement;
      bar.setAttribute('data-edit', 'announcement');
      bar.setAttribute('data-edit-type', 'text');
      bar.setAttribute('data-edit-label', 'نص الشريط المتحرك');
    } else {
      document.getElementById('announcementBar').style.display = 'none';
      document.getElementById('header').style.top = '0';
    }
  });

  safeRender('clinicIdentity', () => {
    setText('logoName', clinic.name);
    setText('logoTagline', clinic.tagline);
    setText('footerName', clinic.name);
    setText('footerTagline', clinic.tagline);
    setText('footerNameBottom', clinic.name);
    document.getElementById('logoName').setAttribute('data-edit', 'clinic.name');
    document.getElementById('logoTagline').setAttribute('data-edit', 'clinic.tagline');
    markEditable('logoName', 'clinic.name');
    markEditable('logoTagline', 'clinic.tagline');
    markEditable('footerName', 'clinic.name');
    markEditable('footerTagline', 'clinic.tagline');
  });

  safeRender('hero', () => {
    setText('heroBadge', hero.badge);
    const heroTitle = document.getElementById('heroTitle');
    heroTitle.innerHTML = `${hero.title || ''} <span class="highlight">${hero.titleHighlight || ''}</span>`;
    setText('heroSubtitle', hero.subtitle);
    setText('heroBtnMain', hero.buttonMain);
    setText('heroBtnSecondary', hero.buttonSecondary);
    ['heroBadge', 'heroSubtitle', 'heroBtnMain', 'heroBtnSecondary'].forEach((id, i) => {
      const paths = ['hero.badge', 'hero.subtitle', 'hero.buttonMain', 'hero.buttonSecondary'];
      document.getElementById(id).setAttribute('data-edit', paths[i]);
      document.getElementById(id).setAttribute('data-edit-type', 'text');
    });

    heroTitle.setAttribute('data-edit', 'hero.title');
    heroTitle.setAttribute('data-edit-type', 'text');
    markEditable('heroTitle', 'hero.title');
    heroTitle.innerHTML = `${hero.title || ''} <span class="highlight" id="heroTitleHighlight">${hero.titleHighlight || ''}</span>`;
    markEditable('heroTitleHighlight', 'hero.titleHighlight');
  });

  safeRender('heroImages', () => {
    ['image', 'image2'].forEach((key, idx) => {
      const num = idx + 1;
      const img = document.getElementById('heroImage' + num);
      const placeholder = document.getElementById('heroImagePlaceholder' + (idx === 0 ? '' : '2'));
      if (!img || !placeholder) return;
      img.setAttribute('data-edit', 'hero.' + key);
      img.setAttribute('data-edit-type', 'image');
      placeholder.setAttribute('data-edit', 'hero.' + key);
      placeholder.setAttribute('data-edit-type', 'image');
      if (hero[key]) {
        img.src = hero[key];
        img.style.display = 'block';
        placeholder.style.display = 'none';
      }
    });
  });

  safeRender('stats', () => {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = (data.stats || []).map((s, i) => `
      <div class="stat-item reveal">
        <div class="stat-number count-up" data-target="${s.number}"${editAttr(`stats.${i}.number`)}>${s.number}</div>
        <div class="stat-label"${editAttr(`stats.${i}.label`)}>${s.label}</div>
      </div>
    `).join('');
    animateCounters();
  });

  safeRender('services', () => {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = (data.serviceCategories || []).map((cat, ci) => `
      <div class="price-category reveal">
        <h3 class="price-cat-title"><span class="price-cat-icon"${editAttr(`serviceCategories.${ci}.icon`)}>${ndIconHtml(cat.icon)}</span> <span${editAttr(`serviceCategories.${ci}.title`)}>${cat.title}</span></h3>
        <ul class="price-items">
          ${cat.items.map((item, ii) => {
            const waMsg = encodeURIComponent(`مرحباً، أرغب بالاستفسار عن خدمة: ${item.name}`);
            const base = `serviceCategories.${ci}.items.${ii}`;
            return `<li class="price-item">
              <span class="price-item-name"${editAttr(base + '.name')}>${item.name}</span>
              <span class="price-item-prices">
                <span class="price-old"${editAttr(base + '.oldPrice')}>${item.oldPrice ? item.oldPrice + ' ريال' : ''}</span>
                <span class="price-now"${editAttr(base + '.price')}>${item.price} ريال</span>
              </span>
              <a class="price-wa-btn" href="https://wa.me/${clinic.whatsapp}?text=${waMsg}" target="_blank" rel="noopener"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:1.05em;height:1.05em"><path d="M24 6a18 18 0 0 0-15 28L7 42l8-2A18 18 0 1 0 24 6z"/><path d="M17 17c0 8 6 14 14 14 1.6 0 3-2 2-3.4l-3.6-2-2.4 2.4c-2.6-1-5-3.4-6-6l2.4-2.4-2-3.6C20 15 17 16 17 17z" fill="currentColor" stroke="none"/></svg> اطلبها</a>
            </li>`;
          }).join('')}
        </ul>
      </div>
    `).join('');
  });

  safeRender('dailyTips', () => {
    const dailyTipsList = document.getElementById('dailyTipsList');
    dailyTipsList.innerHTML = (data.dailyTips || []).map((tip, i) => `
      <li${editAttr('dailyTips.' + i)}><span class="daily-tip-num">${i + 1}</span>${tip}</li>
    `).join('');
  });

  safeRender('tips', () => {
    const tipsGrid = document.getElementById('tipsGrid');
    tipsGrid.innerHTML = (data.tips || []).map((t, i) => `
      <div class="tip-card reveal">
        <div class="tip-icon"${editAttr(`tips.${i}.icon`)}>${ndIconHtml(t.icon)}</div>
        <h3${editAttr(`tips.${i}.title`)}>${t.title}</h3>
        <p${editAttr(`tips.${i}.description`)}>${t.description}</p>
      </div>
    `).join('');
  });

  safeRender('features', () => {
    const featuresGrid = document.getElementById('featuresGrid');
    featuresGrid.innerHTML = (data.features || []).map((f, i) => `
      <div class="feature-card reveal">
        <div class="feature-icon"${editAttr(`features.${i}.icon`)}>${ndIconHtml(f.icon)}</div>
        <div>
          <h3${editAttr(`features.${i}.title`)}>${f.title}</h3>
          <p${editAttr(`features.${i}.description`)}>${f.description}</p>
        </div>
      </div>
    `).join('');
  });

  safeRender('offers', () => {
    const offersSection = document.getElementById('offers');
    /* زر تفعيل/إخفاء قسم العروض (اكتب true أو false) */
    if (offersSection) {
      offersSection.setAttribute('data-edit', 'offers.enabled');
      offersSection.setAttribute('data-edit-type', 'text');
      offersSection.setAttribute('data-edit-label', 'تفعيل قسم العروض (اكتب true أو false)');
    }
    if (offers && offers.enabled && (offers.items || []).length > 0) {
      setText('offersTitle', offers.title);
      setText('offersSubtitle', offers.subtitle);
      markEditable('offersTitle', 'offers.title');
      markEditable('offersSubtitle', 'offers.subtitle');
      const offersGrid = document.getElementById('offersGrid');
      offersGrid.innerHTML = offers.items.map((o, i) => `
        <div class="offer-card reveal">
          <span class="offer-note"${editAttr(`offers.items.${i}.note`)}>${o.note || ''}</span>
          <div class="offer-icon"${editAttr(`offers.items.${i}.icon`)}>${ndIconHtml(o.icon)}</div>
          <h3${editAttr(`offers.items.${i}.title`)}>${o.title}</h3>
          <div class="offer-old-price"${editAttr(`offers.items.${i}.oldPrice`)}>${o.oldPrice} ريال</div>
          <div class="offer-price"${editAttr(`offers.items.${i}.price`)}>${o.price}</div>
          <a href="#booking" class="btn btn-primary btn-sm">احجز العرض</a>
        </div>
      `).join('');
    } else if (offersSection) {
      offersSection.style.display = 'none';
    }
  });

  safeRender('doctors', () => {
    const doctorsGrid = document.getElementById('doctorsGrid');
    doctorsGrid.innerHTML = (data.doctors || []).map((d, i) => `
      <div class="doctor-card reveal">
        <div class="doctor-avatar"${editAttr(`doctors.${i}.initial`)}>${d.initial}</div>
        <h3${editAttr(`doctors.${i}.name`)}>${d.name}</h3>
        <p class="doctor-specialty"${editAttr(`doctors.${i}.specialty`)}>${d.specialty}</p>
        <span class="doctor-exp"${editAttr(`doctors.${i}.experience`)}>${d.experience}</span>
      </div>
    `).join('');
  });

  safeRender('testimonials', () => {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    testimonialsGrid.innerHTML = (testimonials || []).map((t, i) => `
      <div class="testimonial-card reveal">
        <div class="testimonial-stars"${editAttr(`reviews.${i}.rating`)}>${ndStar().repeat(t.rating || 5)}</div>
        <p class="testimonial-text"${editAttr(`reviews.${i}.text`)}>"${t.text}"</p>
        <p class="testimonial-name"${editAttr(`reviews.${i}.name`)}>${t.name}</p>
      </div>
    `).join('');
  });

  safeRender('booking', () => {
    setText('bookingTitle', booking ? booking.title : '');
    setText('bookingSubtitle', booking ? booking.subtitle : '');
    setText('submitBtn', booking ? booking.button : '');
    markEditable('bookingTitle', 'booking.title');
    markEditable('bookingSubtitle', 'booking.subtitle');
    markEditable('submitBtn', 'booking.button');
    const serviceSelect = document.getElementById('service');
    serviceSelect.innerHTML = '<option value="">اختر الخدمة</option>' +
      bookingServices.map(s => `<option value="${s}">${s}</option>`).join('');
    /* قائمة الخدمات داخل الحجز: قابلة للتعديل كنصوص أسطر */
    serviceSelect.setAttribute('data-edit', 'bookingServices');
    serviceSelect.setAttribute('data-edit-type', 'list');
    serviceSelect.setAttribute('data-edit-label', 'قائمة خدمات الحجز (كل خدمة في سطر)');
  });

  safeRender('contact', () => {
    setText('contactAddress', clinic.address);
    document.getElementById('contactAddress').setAttribute('data-edit', 'clinic.address');
    const phoneEl = document.getElementById('contactPhone');
    phoneEl.innerHTML = `جوال: <a href="tel:${clinic.phone}" data-edit="clinic.phone" data-edit-type="text">${clinic.phone}</a>`;
    const emailEl = document.getElementById('contactEmail');
    emailEl.innerHTML = `بريد: <a href="mailto:${clinic.email}" data-edit="clinic.email" data-edit-type="text">${clinic.email}</a>`;
    const mapBtn = document.getElementById('mapBtn');
    mapBtn.href = clinic.mapUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(clinic.address || ''));
    mapBtn.setAttribute('data-edit', 'clinic.mapUrl');
    mapBtn.setAttribute('data-edit-type', 'text');
    mapBtn.setAttribute('data-edit-label', 'رابط الخريطة');
    setText('footerAddress', clinic.address);
    markEditable('footerAddress', 'clinic.address');
    const footerPhoneEl = document.getElementById('footerPhone');
    footerPhoneEl.innerHTML = clinic.phone ? `جوال: <a href="tel:${clinic.phone}" data-edit="clinic.phone" data-edit-type="text">${clinic.phone}</a>` : '';
    const footerEmailEl = document.getElementById('footerEmail');
    footerEmailEl.innerHTML = clinic.email ? `بريد: <a href="mailto:${clinic.email}" data-edit="clinic.email" data-edit-type="text">${clinic.email}</a>` : '';
  });

  safeRender('workingHours', () => {
    const hoursList = document.getElementById('hoursList');
    hoursList.innerHTML = workingHours.map((h, i) => `
      <li>
        <span${editAttr(`workingHours.${i}.days`)}>${h.days}</span>
        <span class="${h.open ? 'open' : 'closed'}"${editAttr(`workingHours.${i}.time`)}>${h.time}</span>
      </li>
    `).join('');
  });

  safeRender('social', () => {
    const socialLinks = document.getElementById('socialLinks');
    const socials = [
      { url: clinic.instagram, icon: 'instagram', name: 'انستقرام', path: 'clinic.instagram' },
      { url: clinic.snapchat, icon: 'snapchat', name: 'سناب شات', path: 'clinic.snapchat' },
      { url: clinic.tiktok, icon: 'tiktok', name: 'تيك توك', path: 'clinic.tiktok' },
      { url: clinic.twitter, icon: 'twitter', name: 'تويتر', path: 'clinic.twitter' }
    ];
    socialLinks.innerHTML = socials
      .filter(s => s.url)
      .map(s => `<a href="${s.url}" target="_blank" aria-label="${s.name}" title="${s.name}"${editAttr(s.path)}>${ndIconHtml(s.icon)}</a>`)
      .join('');
  });

  safeRender('whatsapp', () => {
    const waMessage = encodeURIComponent('مرحباً، أرغب بحجز موعد في ' + clinic.name);
    const floatBtn = document.getElementById('whatsappFloat');
    floatBtn.href = `https://wa.me/${clinic.whatsapp}?text=${waMessage}`;
    floatBtn.setAttribute('data-edit', 'clinic.whatsapp');
    floatBtn.setAttribute('data-edit-type', 'text');
    floatBtn.setAttribute('data-edit-label', 'رقم الواتساب (مثل 9665xxxxxxxx)');
  });

  safeRender('year', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
  });

  initScrollReveal();
}

// ===== وضع المالك: حفظ تعديل نص =====
window.saveOverride = function (path, value) {
  const overrides = getOverrides();
  overrides[path] = value;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  if (siteData) setDeep(siteData, path, value);
};

window.getSiteData = () => siteData;
window.getOverrideValue = (path) => getDeep(siteData || {}, path);

// ===== نموذج الحجز to واتساب =====
  const bookingFormEl = document.getElementById('bookingForm');
  if (bookingFormEl) bookingFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!siteData) return;

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const date = document.getElementById('date').value;

    let message = `طلب حجز موعد جديد\n\n`;
    message += `الاسم: ${name}\n`;
    message += `الجوال: ${phone}\n`;
    message += `الخدمة: ${service}\n`;
    if (date) message += `اليوم المفضل: ${date}\n`;

    const waUrl = `https://wa.me/${siteData.clinic.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  });

// ===== نموذج إضافة تعليق to واتساب =====
  const reviewFormEl = document.getElementById('reviewForm');
  if (reviewFormEl) reviewFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!siteData) return;

    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();

    let message = `تعليق جديد من موقع المجمع\n\n`;
    message += `الاسم: ${name}\n`;
    message += `التعليق: ${text}\n`;

    const waUrl = `https://wa.me/${siteData.clinic.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    document.getElementById('reviewName').value = '';
    document.getElementById('reviewText').value = '';
    alert('شكراً لك! تم إرسال تعليقك، وسيظهر بعد المراجعة.');
  });

// ===== قائمة الجوال =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
}

// ===== ظل الترويسة عند التمرير =====
const headerEl = document.getElementById('header');
if (headerEl) {
  window.addEventListener('scroll', () => {
    headerEl.classList.toggle('scrolled', window.scrollY > 30);
  });
}

// ===== ظهور العناصر عند التمرير =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

loadContent();
