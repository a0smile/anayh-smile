/* ============================================
   مجمع عناية الابتسامة الطبي — ملف التشغيل
   لا تحتاج تعديل هذا الملف — كل المحتوى في content.json
   وضع المالك (أزرار التعديل) في ملف admin.js
   ============================================ */

let siteData = null;

/* ===== مسارات قابلة للتعديل تُقرأ من localStorage (وضع المالك) ===== */
const OVERRIDES_KEY = 'smile_overrides';
window.OVERRIDES_KEY = OVERRIDES_KEY;

function getOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; }
  catch { return {}; }
}

function getDeep(obj, path) {
  return path.split('.').reduce((o, k) => (o == null? o : o[k]), obj);
}

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = /^\d+$/.test(keys[i + 1])? [] : {};
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

/* مسح تعديلات محلية قديمة فيها نصوص اليوم الوطني */
function purgeNationalDayOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return;
    const ov = JSON.parse(raw);
    if (!ov || typeof ov !== 'object') return;
    const bad = /وطني|دام عزك|عزنا بطبعنا|نحلم ونحقق|اليوم الوطني|عرض اليوم|احجز عرض اليوم/i;
    let changed = false;
    Object.keys(ov).forEach((k) => {
      const v = ov[k];
      if (typeof v === 'string' && bad.test(v)) {
        delete ov[k];
        changed = true;
      }
    });
    ['nationalDay', 'announcement', 'hero.badge', 'hero.title', 'hero.titleHighlight',
     'hero.subtitle', 'hero.buttonMain', 'hero.buttonSecondary', 'booking.title',
     'sections.nationalDayBadge', 'sections.nationalDayTitle', 'sections.reviewBoxTitle',
     'sections.support2'].forEach((k) => {
      if (k in ov) { delete ov[k]; changed = true; }
    });
    if (changed) localStorage.setItem(OVERRIDES_KEY, JSON.stringify(ov));
  } catch (e) {}
}

async function loadContent() {
  try {
    purgeNationalDayOverrides();
    const response = await fetch('content.json?v=25', { cache: 'no-cache' });
    let data = await response.json();
    siteData = applyOverrides(data);
    if (siteData.nationalDay) siteData.nationalDay.enabled = false;
    renderSite(siteData);

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

    document.dispatchEvent(new CustomEvent('siteRendered'));
  } catch (error) {
    console.error('تعذر تحميل ملف المحتوى content.json', error);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text!= null && text!== '') el.textContent = text;
}

function editAttr(path) {
  return ` data-edit="${path}" data-edit-type="text"`;
}

function markEditable(id, path) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('data-edit', path);
  el.setAttribute('data-edit-type', 'text');
}

function safeRender(name, fn) {
  try { fn(); }
  catch (e) { console.error('خطأ أثناء عرض قسم: ' + name, e); }
}

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
  return window.ndIconHtml? window.ndIconHtml('star') : '<span class="nd-icon"></span>';
}

function ndStars(count) {
  const n = Math.max(0, Math.min(5, Number(count) || 5));
  let html = '';
  for (let i = 0; i < n; i++) html += ndStar();
  return html;
}
function renderDataIcons() {
  document.querySelectorAll('.nd-icon[data-icon]').forEach((el) => {
    el.innerHTML = window.ndIconHtml? window.ndIconHtml(el.getAttribute('data-icon')) : '';
  });
}
function renderSite(data) {
  renderDataIcons();
  const { clinic, hero, booking } = data;
  const sections = data.sections || {};
  const testimonials = data.testimonials || data.reviews || [];
  const workingHours = data.workingHours || [];
  const bookingServices = data.bookingServices || [];

  document.title = clinic.name || document.title;

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

    setText('nationalDayBadge', nd.badge || sections.nationalDayBadge);
    setText('nationalDayTitle', nd.greetingTitle);
    setText('nationalDayGreeting', nd.greeting);
    setText('nationalDayGreeting2', nd.greeting2);
    setText('nationalDayGreeting3', nd.greeting3 || 'وكل عام وأنتم بعز وفخر وأمان');
    setText('nationalDayClosing', nd.closing);

    setText('landmarksBadge', sections.landmarksBadge);
    setText('landmarksTitle', sections.landmarksTitle);
    setText('landmarksSubtitle', sections.landmarksSubtitle);
    const lg = document.getElementById('landmarksGrid');
    if (lg) {
      lg.innerHTML = l.map((m, i) => `
        <figure class="landmark-card reveal"${editAttr(`landmarks.${i}.image`)}>
          <img src="${m.image}" alt="${m.title} — ${m.subtitle || ''}" loading="lazy">
          <figcaption>
            <h3${editAttr(`landmarks.${i}.title`)}>${m.title}</h3>
            <p${editAttr(`landmarks.${i}.subtitle`)}>${m.subtitle || ''}</p>
          </figcaption>
        </figure>
      `).join('');
    }

    const logoNd = document.getElementById('logoNationalDay');
    if (logoNd) {
      logoNd.textContent = '';
      logoNd.style.display = 'none';
    }
    // إخفاء عناصر اليوم الوطني عند التعطيل
    ['ndFlagImage','ndEmblemImage','nationalDay','landmarksSection'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !nd.enabled) el.style.display = 'none';
    });
  });

  safeRender('announcement', () => {
    if (data.announcement) {
      const bar = document.getElementById('announcementBar');
      if (!bar) return;
      bar.style.display = '';
      const t1 = document.getElementById('announcementText');
      const t2 = document.getElementById('announcementText2');
      let ann = String(data.announcement || '');
      if (/وطني|دام عزك|عزنا بطبعنا|اليوم الوطني/i.test(ann)) {
        ann = 'أهلاً وسهلاً بكم في مجمعكم عناية الابتسامة الطبي — ابتسامتكم سر ثقتكم، ونحن هنا لنحافظ عليها — احجز موعدك الآن بسهولة عبر الواتساب';
      }
      if (t1) t1.textContent = ann;
      if (t2) t2.textContent = ann;
      bar.setAttribute('data-edit', 'announcement');
      bar.setAttribute('data-edit-type', 'text');
      bar.setAttribute('data-edit-label', 'نص الشريط المتحرك');
    } else {
      const bar = document.getElementById('announcementBar');
      if (bar) bar.style.display = 'none';
    }
  });

  safeRender('clinicIdentity', () => {
    setText('logoName', clinic.name);
    setText('logoTagline', clinic.tagline);
    setText('footerName', clinic.name);
    setText('footerTagline', clinic.tagline);
    setText('footerNameBottom', clinic.name);
    const nameEl = document.getElementById('logoName');
    const tagEl = document.getElementById('logoTagline');
    if (nameEl) nameEl.setAttribute('data-edit', 'clinic.name');
    if (tagEl) tagEl.setAttribute('data-edit', 'clinic.tagline');
    markEditable('logoName', 'clinic.name');
    markEditable('logoTagline', 'clinic.tagline');
    markEditable('footerName', 'clinic.name');
    markEditable('footerTagline', 'clinic.tagline');
  });

  safeRender('hero', () => {
    const bad = /وطني|دام عزك|عزنا بطبعنا|اليوم الوطني|عرض اليوم/i;
    let badge = hero.badge || 'رعاية طبية متخصصة';
    let title = [hero.title, hero.titleHighlight].filter(Boolean).join(' ').trim() || 'ابتسامة أجمل تبدأ من هنا';
    let slogan = hero.subtitle || 'مجمع متخصص في طب وجراحة الأسنان بأحدث التقنيات وأعلى معايير الجودة والتعقيم';
    let btnMain = hero.buttonMain || 'احجز موعدك الآن';
    let btnSec = hero.buttonSecondary || 'اكتشف خدماتنا';
    if (bad.test(badge)) badge = 'رعاية طبية متخصصة';
    if (bad.test(title)) title = 'ابتسامة أجمل تبدأ من هنا';
    if (bad.test(slogan)) slogan = 'مجمع متخصص في طب وجراحة الأسنان بأحدث التقنيات وأعلى معايير الجودة والتعقيم';
    if (bad.test(btnMain)) btnMain = 'احجز موعدك الآن';
    if (bad.test(btnSec)) btnSec = 'اكتشف خدماتنا';
    setText('ndBannerBadge', badge);
    setText('ndBannerTitle', title);
    setText('ndBannerSlogan', slogan);
    setText('heroBtnMain', btnMain);
    setText('heroBtnSecondary', btnSec);
    markEditable('ndBannerBadge', 'hero.badge');
    markEditable('ndBannerTitle', 'hero.title');
    markEditable('ndBannerSlogan', 'hero.subtitle');
    markEditable('heroBtnMain', 'hero.buttonMain');
    markEditable('heroBtnSecondary', 'hero.buttonSecondary');
  });

  safeRender('heroImages', () => {
    ['image', 'image2'].forEach((key, idx) => {
      const num = idx + 1;
      const img = document.getElementById('heroImage' + num);
      const placeholder = document.getElementById('heroImagePlaceholder' + (idx === 0? '' : '2'));
      if (!img ||!placeholder) return;
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
    if (!statsGrid) return;
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
    if (!servicesGrid) return;
    const ICON_BY_NAME = [
      [/ابتسامة|هوليود|زيركون|إيماكس|ايمكس|بورسلان|تركيب/, 'veneer'],
      [/كاش|مقدم|تقويم|مثبت|شد/, 'braces'],
      [/تبييض|ليزر/, 'laser'],
      [/عصب/, 'root'],
      [/جذور/, 'root'],
      [/خلع|ضرس|قلع/, 'extract'],
      [/حشو/, 'filling'],
      [/فلورايد/, 'fluoride'],
      [/أطفال|طفال|تاج|حافظة|تلبيسة/, 'crown'],
      [/تنظيف|جير|تلميع/, 'clean'],
      [/زراع/, 'tooth']
    ];
    /* مضبوط 100% على ملفات الصور الحقيقية في service-icons أو الروت */
    const PHOTO_BY_NAME = [
      [/تلبيسة تاج|تاج للأطفال/, 'braces-child.jpg'],
      [/حافظة مسافة/, 'braces-kids-treat.jpg'],
      [/تقويم الزينة|زينة/, 'braces-pink.jpg'],
      [/مثبت تقويم/, 'aligner-kit.jpg'],
      [/كاش فك|مقدم تقويم|شد تقويم/, 'braces-metal.jpg'],
      [/تقويم/, 'braces-close.jpg'],
      [/تبييض|ليزر/, 'whitening-laser.jpg'],
      [/تنظيف|جير|تلميع|فلورايد/, 'whitening-laser.jpg'],
      [/ابتسامة|زيركون|إيماكس|بورسلان|تركيب/, 'smile-white.jpg'],
      [/حشو/, 'smile-white.jpg'],
      [/عصب|جذور/, 'xray.jpg'],
      [/خلع ضرس العقل|ضرس العقل/, 'dental-model.jpg'],
      [/خلع|قلع/, 'dental-model.jpg'],
      [/استشارة|تقييم/, 'xray.jpg']
    ];
    const iconFor = (name, idx) => {
      const found = ICON_BY_NAME.find(([re]) => re.test(name));
      return found? found[1] : ['tooth', 'clean', 'brush'][idx % 3];
    };
    const photoFor = (name, idx) => {
      const found = PHOTO_BY_NAME.find(([re]) => re.test(name || ''));
      const file = found ? found[1] : [
        'smile-white.jpg',
        'braces-metal.jpg',
        'whitening-laser.jpg',
        'aligner-kit.jpg',
        'xray.jpg',
        'dental-model.jpg',
        'braces-child.jpg'
      ][idx % 7];
      // جرّب المسار داخل المجلد ثم الجذر
      return 'service-icons/' + file;
    };
    const categoryIcon = (cat, ci) => {
      if (cat.icon && cat.icon!== 'flag') return cat.icon;
      return iconFor(cat.title || '', ci);
    };

    servicesGrid.innerHTML = (data.serviceCategories || []).map((cat, ci) => `
      <div class="price-category">
        ${cat.title? `<h3 class="price-cat-title">
          <span class="price-cat-icon"${editAttr(`serviceCategories.${ci}.icon`)}>${(window.ndIconHtml? window.ndIconHtml(categoryIcon(cat, ci)) : "")}</span>
          <span${editAttr(`serviceCategories.${ci}.title`)}>${cat.title}</span>
        </h3>` : ''}
        <div class="service-cards">
          ${cat.items.map((item, ii) => {
            const waMsg = encodeURIComponent(`مرحباً، أرغب بالاستفسار عن خدمة: ${item.name}`);
            const base = `serviceCategories.${ci}.items.${ii}`;
            const icon = iconFor(item.name || '', ii);
            const photo = photoFor(item.name || '', ii);
            return `<article class="service-card-wrap">
              <div class="service-card">
                <div class="service-card-icon"${editAttr(base + '.icon')}>
                  <img class="service-card-photo" src="${photo}" alt="${item.name || ''}" loading="lazy" decoding="async" width="128" height="128" onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src=this.src.replace('service-icons/','');}else{this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';}">
                  <span class="service-fallback-icon" style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">${window.ndIconHtml? window.ndIconHtml(icon) : ''}</span>
                </div>
                <h4 class="service-card-name"${editAttr(base + '.name')}>${item.name}</h4>
                <div class="service-card-prices">
                  ${item.oldPrice? `<span class="price-old"><span class="price-label">قبل</span><span class="price-value"${editAttr(base + '.oldPrice')}>${item.oldPrice} ريال</span></span>` : ''}
                  <span class="price-now"><span class="price-label">بعد</span><span class="price-value"${editAttr(base + '.price')}>${item.price} ريال</span></span>
                </div>
              </div>
              <a class="price-wa-btn" href="https://wa.me/${clinic.whatsapp}?text=${waMsg}" target="_blank" rel="noopener">${(window.ndIconHtml? window.ndIconHtml('whatsapp') : '')} اطلبها الآن</a>
            </article>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  });

  safeRender('dailyTips', () => {
    const box = document.querySelector('.daily-tips-box');
    if (box) box.style.display = 'none';
    const dailyTipsList = document.getElementById('dailyTipsList');
    if (dailyTipsList) dailyTipsList.innerHTML = '';
  });

  safeRender('tips', () => {
    const tipsGrid = document.getElementById('tipsGrid');
    if (!tipsGrid) return;
    tipsGrid.innerHTML = (data.tips || []).map((t, i) => `
      <div class="tip-card tip-card-clean">
        <h3${editAttr(`tips.${i}.title`)}>${t.title}</h3>
        <p${editAttr(`tips.${i}.description`)}>${t.description}</p>
      </div>
    `).join('');
  });

  safeRender('features', () => {
    const featuresGrid = document.getElementById('featuresGrid');
    if (!featuresGrid) return;
    featuresGrid.innerHTML = (data.features || []).map((f, i) => `
      <div class="feature-card feature-card-premium">
        <h3${editAttr(`features.${i}.title`)}>${f.title}</h3>
        <p${editAttr(`features.${i}.description`)}>${f.description}</p>
      </div>
    `).join('');
  });

  safeRender('doctors', () => {
    const doctorsGrid = document.getElementById('doctorsGrid');
    if (!doctorsGrid) return;
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
    if (!testimonialsGrid) return;
    testimonialsGrid.innerHTML = (testimonials || []).map((t, i) => `
      <div class="testimonial-card reveal">
        <div class="testimonial-stars"${editAttr(`reviews.${i}.rating`)}>${ndStars(t.rating)}</div>
        <p class="testimonial-text"${editAttr(`reviews.${i}.text`)}>"${t.text}"</p>
        <p class="testimonial-name"${editAttr(`reviews.${i}.name`)}>${t.name}</p>
      </div>
    `).join('');
  });

  safeRender('booking', () => {
    setText('bookingTitle', booking? booking.title : '');
    setText('bookingSubtitle', booking? booking.subtitle : '');
    setText('submitBtn', booking? booking.button : '');
    markEditable('bookingTitle', 'booking.title');
    markEditable('bookingSubtitle', 'booking.subtitle');
    markEditable('submitBtn', 'booking.button');
    const serviceSelect = document.getElementById('service');
    if (!serviceSelect) return;
    serviceSelect.innerHTML = '<option value="">اختر الخدمة</option>' +
      bookingServices.map(s => `<option value="${s}">${s}</option>`).join('');
    serviceSelect.setAttribute('data-edit', 'bookingServices');
    serviceSelect.setAttribute('data-edit-type', 'list');
    serviceSelect.setAttribute('data-edit-label', 'قائمة خدمات الحجز (كل خدمة في سطر)');
  });

  safeRender('faq', () => {
    const list = document.getElementById('faqList');
    if (!list) return;
    const items = data.faq || [];
    list.innerHTML = items.map((item, i) => `
      <details class="faq-item"${editAttr('faq.' + i + '.q')}>
        <summary class="faq-q">
          <span class="faq-q-text"${editAttr('faq.' + i + '.q')}>${item.q}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </summary>
        <div class="faq-a"${editAttr('faq.' + i + '.a')}>${item.a}</div>
      </details>
    `).join('');
  });

  safeRender('contact', () => {
    setText('contactAddress', clinic.address);
    const addrEl = document.getElementById('contactAddress');
    if (addrEl) addrEl.setAttribute('data-edit', 'clinic.address');

    const phoneEl = document.getElementById('contactPhone');
    if (phoneEl) {
      phoneEl.innerHTML = `جوال: <a href="tel:${clinic.phone}" data-edit="clinic.phone" data-edit-type="text">${clinic.phone}</a>`;
    }
    const emailEl = document.getElementById('contactEmail');
    if (emailEl) {
      emailEl.innerHTML = clinic.email
       ? `بريد: <a href="mailto:${clinic.email}" data-edit="clinic.email" data-edit-type="text">${clinic.email}</a>`
        : '';
    }

    const mapBtn = document.getElementById('mapBtn');
    const mapQuery = clinic.mapUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(clinic.address || ''));
    if (mapBtn) {
      mapBtn.href = mapQuery;
      mapBtn.setAttribute('data-edit', 'clinic.mapUrl');
      mapBtn.setAttribute('data-edit-type', 'text');
      mapBtn.setAttribute('data-edit-label', 'رابط الخريطة');
    }

    const mapFrame = document.getElementById('mapFrame');
    if (mapFrame) {
      mapFrame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(clinic.address || '') + '&hl=ar&z=15&output=embed';
    }

    const waBtn = document.getElementById('whatsappBtn');
    if (waBtn && clinic.whatsapp) {
      waBtn.href = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent('مرحباً، أرغب بالاستفسار عن خدمات ' + (clinic.name || ''))}`;
    }

    setText('footerAddress', clinic.address);
    const footerAddressEl = document.getElementById('footerAddress');
    if (footerAddressEl) markEditable('footerAddress', 'clinic.address');

    const footerPhoneEl = document.getElementById('footerPhone');
    if (footerPhoneEl) {
      footerPhoneEl.innerHTML = clinic.phone
       ? `جوال: <a href="tel:${clinic.phone}" data-edit="clinic.phone" data-edit-type="text">${clinic.phone}</a>`
        : '';
    }
    const footerEmailEl = document.getElementById('footerEmail');
    if (footerEmailEl) {
      footerEmailEl.innerHTML = clinic.email
       ? `بريد: <a href="mailto:${clinic.email}" data-edit="clinic.email" data-edit-type="text">${clinic.email}</a>`
        : '';
    }
  });

  safeRender('workingHours', () => {
    const hoursList = document.getElementById('hoursList');
    if (!hoursList) return;
    hoursList.innerHTML = workingHours.map((h, i) => `
      <li>
        <span${editAttr(`workingHours.${i}.days`)}>${h.days}</span>
        <span class="${h.open? 'open' : 'closed'}"${editAttr(`workingHours.${i}.time`)}>${h.time}</span>
      </li>
    `).join('');
  });

  safeRender('social', () => {
    const socialLinks = document.getElementById('socialLinks');
    if (!socialLinks) return;
    const socials = [
      { url: clinic.whatsapp? `https://wa.me/${clinic.whatsapp}` : '', icon: 'whatsapp', name: 'واتساب', path: 'clinic.whatsapp' },
      { url: clinic.instagram, icon: 'instagram', name: 'انستقرام', path: 'clinic.instagram' },
      { url: clinic.snapchat, icon: 'snapchat', name: 'سناب شات', path: 'clinic.snapchat' },
      { url: clinic.tiktok, icon: 'tiktok', name: 'تيك توك', path: 'clinic.tiktok' },
      { url: clinic.twitter, icon: 'twitter', name: 'تويتر', path: 'clinic.twitter' }
    ];
    const list = socials.filter(s => s.url);
    socialLinks.innerHTML = list
     .map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}" title="${s.name}"${editAttr(s.path)}>${(window.ndIconHtml? window.ndIconHtml(s.icon) : "")}</a>`)
     .join('');
    const block = document.querySelector('.social-block');
    if (block) block.style.display = list.length? '' : 'none';
  });

  safeRender('whatsapp', () => {
    const waMessage = encodeURIComponent('مرحباً، أرغب بحجز موعد في ' + clinic.name);
    const floatBtn = document.getElementById('whatsappFloat');
    if (!floatBtn) return;
    floatBtn.href = `https://wa.me/${clinic.whatsapp}?text=${waMessage}`;
    floatBtn.setAttribute('data-edit', 'clinic.whatsapp');
    floatBtn.setAttribute('data-edit-type', 'text');
    floatBtn.setAttribute('data-edit-label', 'رقم الواتساب (مثل 9665xxxxxxxx)');
  });

  safeRender('year', () => {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  initScrollReveal();
  initNavSpy();
}

window.saveOverride = function (path, value) {
  const overrides = getOverrides();
  overrides[path] = value;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  if (siteData) setDeep(siteData, path, value);
};

window.getSiteData = () => siteData;
window.getOverrideValue = (path) => getDeep(siteData || {}, path);

  const bookingFormEl = document.getElementById('bookingForm');
  if (bookingFormEl) bookingFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!siteData) return;

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const dateEl = document.getElementById('date');
    const date = dateEl? dateEl.value : '';

    let message = `طلب حجز موعد جديد\n\n`;
    message += `الاسم: ${name}\n`;
    message += `الجوال: ${phone}\n`;
    message += `الخدمة: ${service}\n`;
    if (date) message += `اليوم المفضل: ${date}\n`;

    const waUrl = `https://wa.me/${siteData.clinic.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  });

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

    const rn = document.getElementById('reviewName');
    const rt = document.getElementById('reviewText');
    if (rn) rn.value = '';
    if (rt) rt.value = '';
    alert('شكراً لك! تم إرسال تعليقك، وسيظهر بعد المراجعة.');
  });

const menuToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function closeMobileMenu() {
  if (!navLinks) return;
  navLinks.classList.remove('open');
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || menuToggle.contains(e.target)) return;
    closeMobileMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMobileMenu();
  });
}

function initNavSpy() {
  if (!navLinks) return;
  const links = Array.from(navLinks.querySelectorAll('.nav-link'));
  if (!links.length) return;

  const targets = links
   .map(link => {
      const id = (link.getAttribute('href') || '').replace('#', '');
      const section = id? document.getElementById(id) : null;
      return section? { link, section } : null;
    })
   .filter(Boolean);

  if (!targets.length) return;

  const setActive = (link) => {
    links.forEach(l => l.classList.toggle('active', l === link));
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const match = targets.find(t => t.section === entry.target);
      if (match) setActive(match.link);
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  targets.forEach(t => observer.observe(t.section));
}

const headerEl = document.getElementById('header');
if (headerEl) {
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      headerEl.classList.toggle('scrolled', window.scrollY > 30);
      scrollTicking = false;
    });
  }, { passive: true });
}

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

/* تم إزالة موسيقى اليوم الوطني — الموقع الآن هوية طبية احترافية */
(function hideNationalMusicUI() {
  const audio = document.getElementById('nationalAudio');
  const btn = document.getElementById('ndMusicBtn');
  if (audio) { try { audio.pause(); audio.removeAttribute('src'); } catch (e) {} }
  if (btn) btn.style.display = 'none';
})();

loadContent();