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
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}
function getDeep(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce(
      (value, key) =>
        value == null ? value : value[key],
      obj
    );
}
function setDeep(obj, path, value) {
  if (!obj || !path) return;
  const keys = String(path).split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (
      cur[key] == null ||
      typeof cur[key] !== 'object'
    ) {
      cur[key] = /^\d+$/.test(nextKey)
        ? []
        : {};
    }
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}
function applyOverrides(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const overrides = getOverrides();
  Object.entries(overrides).forEach(
    ([path, value]) => {
      if (!path) return;
      setDeep(data, path, value);
    }
  );
  return data;
}
window.applyOverrides = applyOverrides;
/* ===== حماية النصوص عند إنشاء HTML ديناميكي ===== */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escapeAttr(value) {
  return escapeHtml(value);
}
/* ===== مساعدة روابط آمنة ===== */
function normalizeUrl(value) {
  if (!value) return '';
  return String(value).trim();
}
function normalizeWhatsApp(value) {
  if (!value) return '';
  return String(value)
    .replace(/[^\d]/g, '')
    .trim();
}
/* ===== مسح تعديلات محلية قديمة فيها نصوص اليوم الوطني فقط ===== */
function purgeNationalDayOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return;
    const ov = JSON.parse(raw);
    if (
      !ov ||
      typeof ov !== 'object' ||
      Array.isArray(ov)
    ) {
      return;
    }
    const bad =
      /وطني|دام عزك|عزنا بطبعنا|نحلم ونحقق|اليوم الوطني|عرض اليوم|احجز عرض اليوم/i;
    let changed = false;
    Object.keys(ov).forEach((key) => {
      const value = ov[key];
      if (
        typeof value === 'string' &&
        bad.test(value)
      ) {
        delete ov[key];
        changed = true;
      }
    });
    if (
      Object.prototype.hasOwnProperty.call(
        ov,
        'nationalDay'
      )
    ) {
      delete ov.nationalDay;
      changed = true;
    }
    if (changed) {
      localStorage.setItem(
        OVERRIDES_KEY,
        JSON.stringify(ov)
      );
    }
  } catch (error) {
    console.warn(
      'تعذر تنظيف التعديلات المحلية القديمة.',
      error
    );
  }
}
/* ===== تحميل المحتوى ===== */
async function loadContent() {
  try {
    purgeNationalDayOverrides();
    const response = await fetch(
      'content.json',
      {
        cache: 'no-store'
      }
    );
    if (!response.ok) {
      throw new Error(
        'HTTP ' + response.status
      );
    }
    const data = await response.json();
    if (
      !data ||
      typeof data !== 'object'
    ) {
      throw new Error(
        'محتوى content.json غير صالح.'
      );
    }
    siteData = applyOverrides(data);
    renderSite(siteData);
    document.dispatchEvent(
      new CustomEvent('siteRendered')
    );
  } catch (error) {
    console.error(
      'تعذر تحميل ملف المحتوى content.json',
      error
    );
  }
}
/* ===== النصوص ===== */
function setText(id, text) {
  const el = document.getElementById(id);
  if (!el || text == null) return;
  el.textContent = String(text);
}
function editAttr(path) {
  return (
    ` data-edit="${escapeAttr(path)}"` +
    ` data-edit-type="text"`
  );
}
function markEditable(id, path) {
  const el = document.getElementById(id);
  if (!el || !path) return;
  el.setAttribute(
    'data-edit',
    path
  );
  el.setAttribute(
    'data-edit-type',
    'text'
  );
}
function safeRender(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(
      'خطأ أثناء عرض قسم: ' + name,
      error
    );
  }
}
/* ===== عدادات الإحصائيات ===== */
function animateCounters() {
  const els = document.querySelectorAll(
    '.count-up:not(.counted)'
  );
  if (!els.length) return;
  if (
    typeof IntersectionObserver ===
    'undefined'
  ) {
    els.forEach((el) => {
      el.classList.add('counted');
      const raw = String(
        el.dataset.target || ''
      );
      el.textContent = raw;
    });
    return;
  }
  const io =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          io.unobserve(entry.target);
          entry.target.classList.add(
            'counted'
          );
          const raw = String(
            entry.target.dataset.target ||
              ''
          );
          const match = raw.match(
            /^(\d+)([\s\S]*)$/
          );
          if (!match) {
            entry.target.textContent =
              raw;
            return;
          }
          const end = Number(match[1]);
          const suffix = match[2];
          const dur = 1300;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min(
              (now - t0) / dur,
              1
            );
            const eased =
              1 -
              Math.pow(
                1 - p,
                3
              );
            entry.target.textContent =
              Math.round(
                end * eased
              ) + suffix;
            if (p < 1) {
              requestAnimationFrame(
                tick
              );
            }
          };
          requestAnimationFrame(tick);
        });
      },
      {
        threshold: 0.35
      }
    );
  els.forEach((el) =>
    io.observe(el)
  );
}
/* ===== أيقونات ===== */
function ndStar() {
  return window.ndIconHtml
    ? window.ndIconHtml('star')
    : '<span class="nd-icon"></span>';
}
function ndStars(count) {
  const n = Math.max(
    0,
    Math.min(
      5,
      Number(count) || 5
    )
  );
  let html = '';
  for (let i = 0; i < n; i++) {
    html += ndStar();
  }
  return html;
}
/* ===== ضبط اسم الخدمة داخل البطاقة ===== */
function fitServiceCardNames() {
  document
    .querySelectorAll(
      '.service-card-name'
    )
    .forEach((el) => {
      const rect =
        el.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return;
      }
      let size =
        parseFloat(
          getComputedStyle(el)
            .fontSize
        ) || 14;
      const min = 8;
      const maxWidth =
        Math.max(
          1,
          el.clientWidth - 8
        );
      const maxHeight =
        Math.max(
          1,
          el.clientHeight - 8
        );
      el.style.fontSize =
        size + 'px';
      let guard = 0;
      while (
        (
          el.scrollWidth >
            maxWidth ||
          el.scrollHeight >
            maxHeight
        ) &&
        size > min &&
        guard < 40
      ) {
        size -= 0.5;
        el.style.fontSize =
          size + 'px';
        guard++;
      }
    });
}
/* ===== اختيار أيقونة مناسبة لكل خدمة حسب اسمها ===== */
const SERVICE_ICON_RULES = [
  { re: /تقويم|كاش فك|كاش فكين/, icon: 'braces' },
  { re: /تبييض|ليزر/, icon: 'whitening' },
  { re: /تلميع|بوليش|تنظيف|جير/, icon: 'polish' },
  { re: /ابتسامة/, icon: 'smile' },
  { re: /زيركون|إيماكس|ايمكس|emax|zircon|تلبيسة|تاج|تركيب|بورسلان/, icon: 'crownz' },
  { re: /خلع|جذور/, icon: 'extract' },
  { re: /عصب/, icon: 'root' },
  { re: /حشو/, icon: 'filling' },
  { re: /أطفال|اطفال|طفل/, icon: 'kids' },
  { re: /فلورايد/, icon: 'fluoride' },
  { re: /حافظة مسافة|مسافة/, icon: 'spacer' },
  { re: /زرع|غرس/, icon: 'implant' },
  { re: /أشعة|اشعة|تصوير/, icon: 'xray' }
];

function serviceIconFor(name) {
  const text = String(name == null ? '' : name);

  for (const rule of SERVICE_ICON_RULES) {
    if (rule.re.test(text)) {
      return rule.icon;
    }
  }

  return 'tooth';
}

function renderDataIcons() {
  document
    .querySelectorAll(
      '.nd-icon[data-icon]'
    )
    .forEach((el) => {
      el.innerHTML =
        window.ndIconHtml
          ? window.ndIconHtml(
              el.getAttribute(
                'data-icon'
              )
            )
          : '';
    });
}
/* ===== عرض الموقع ===== */
function renderSite(data) {
  if (
    !data ||
    typeof data !== 'object'
  ) {
    return;
  }
  renderDataIcons();
  const clinic =
    data.clinic &&
    typeof data.clinic === 'object'
      ? data.clinic
      : {};
  const hero =
    data.hero &&
    typeof data.hero === 'object'
      ? data.hero
      : {};
  const booking =
    data.booking &&
    typeof data.booking === 'object'
      ? data.booking
      : {};
  const sections =
    data.sections &&
    typeof data.sections === 'object'
      ? data.sections
      : {};
  const testimonials =
    Array.isArray(data.testimonials)
      ? data.testimonials
      : Array.isArray(data.reviews)
        ? data.reviews
        : [];
  const workingHours =
    Array.isArray(data.workingHours)
      ? data.workingHours
      : [];
  const bookingServices =
    Array.isArray(
      data.bookingServices
    )
      ? data.bookingServices
      : [];
  document.title =
    clinic.name ||
    document.title;
  /* ===== الأقسام ===== */
  safeRender(
    'sections',
    () => {
      const pairs = [
        [
          'servicesBadge',
          'sections.servicesBadge'
        ],
        [
          'servicesTitle',
          'sections.servicesTitle'
        ],
        [
          'servicesSubtitle',
          'sections.servicesSubtitle'
        ],
        [
          'tipsBadge',
          'sections.tipsBadge'
        ],
        [
          'tipsTitle',
          'sections.tipsTitle'
        ],
        [
          'tipsSubtitle',
          'sections.tipsSubtitle'
        ],
        [
          'dailyTipsTitle',
          'sections.dailyTipsTitle'
        ],
        [
          'featuresBadge',
          'sections.featuresBadge'
        ],
        [
          'featuresTitle',
          'sections.featuresTitle'
        ],
        [
          'featuresSubtitle',
          'sections.featuresSubtitle'
        ],
        [
          'doctorsBadge',
          'sections.doctorsBadge'
        ],
        [
          'doctorsTitle',
          'sections.doctorsTitle'
        ],
        [
          'doctorsSubtitle',
          'sections.doctorsSubtitle'
        ],
        [
          'reviewsBadge',
          'sections.reviewsBadge'
        ],
        [
          'reviewsTitle',
          'sections.reviewsTitle'
        ],
        [
          'reviewsSubtitle',
          'sections.reviewsSubtitle'
        ],
        [
          'reviewBoxTitle',
          'sections.reviewBoxTitle'
        ],
        [
          'reviewBoxText',
          'sections.reviewBoxText'
        ],
        [
          'reviewSubmitBtn',
          'sections.reviewButton'
        ],
        [
          'contactBadge',
          'sections.contactBadge'
        ],
        [
          'contactTitle',
          'sections.contactTitle'
        ],
        [
          'contactAddressTitle',
          'sections.contactAddressTitle'
        ],
        [
          'contactPhoneTitle',
          'sections.contactPhoneTitle'
        ],
        [
          'contactHoursTitle',
          'sections.contactHoursTitle'
        ],
        [
          'formNote',
          'sections.formNote'
        ],
        [
          'support1',
          'sections.support1'
        ],
        [
          'support2',
          'sections.support2'
        ],
        [
          'footerDesc',
          'sections.footerDesc'
        ]
      ];
      pairs.forEach(
        ([id, path]) => {
          const relativePath =
            path
              .split('.')
              .slice(1)
              .join('.');
          setText(
            id,
            getDeep(
              sections,
              relativePath
            )
          );
          markEditable(
            id,
            path
          );
        }
      );
      const noteEl =
        document.getElementById(
          'servicesNote'
        );
      if (noteEl) {
        noteEl.innerHTML =
          String(
            sections.servicesNote ||
              ''
          );
        markEditable(
          'servicesNote',
          'sections.servicesNote'
        );
      }
    }
  );
  /* ===== اليوم الوطني / البيانات القديمة ===== */
  safeRender(
    'nationalDay',
    () => {
      const nd =
        data.nationalDay &&
        typeof data.nationalDay ===
          'object'
          ? data.nationalDay
          : {};
      const landmarks =
        Array.isArray(
          data.landmarks
        )
          ? data.landmarks
          : [];
      const sectionData = sections;
      const blend =
        document.getElementById(
          'ndBlendImage'
        );
      if (blend) {
        if (nd.blendImage) {
          blend.src =
            nd.blendImage;
          blend.style.display =
            '';
        }
        blend.setAttribute(
          'data-edit',
          'nationalDay.blendImage'
        );
        blend.setAttribute(
          'data-edit-type',
          'image'
        );
      }
      const flag =
        document.getElementById(
          'ndFlagImage'
        );
      if (flag) {
        if (nd.flagImage) {
          flag.src =
            nd.flagImage;
          flag.style.display =
            '';
        }
        flag.setAttribute(
          'data-edit',
          'nationalDay.flagImage'
        );
        flag.setAttribute(
          'data-edit-type',
          'image'
        );
      }
      const emblem =
        document.getElementById(
          'ndEmblemImage'
        );
      if (emblem) {
        if (nd.emblemImage) {
          emblem.src =
            nd.emblemImage;
          emblem.style.display =
            '';
        }
        emblem.setAttribute(
          'data-edit',
          'nationalDay.emblemImage'
        );
        emblem.setAttribute(
          'data-edit-type',
          'image'
        );
      }
      setText(
        'nationalDayBadge',
        nd.badge ||
          sectionData.nationalDayBadge
      );
      setText(
        'nationalDayTitle',
        nd.greetingTitle
      );
      setText(
        'nationalDayGreeting',
        nd.greeting
      );
      setText(
        'nationalDayGreeting2',
        nd.greeting2
      );
      setText(
        'nationalDayGreeting3',
        nd.greeting3 ||
          'وكل عام وأنتم بعز وفخر وأمان'
      );
      setText(
        'nationalDayClosing',
        nd.closing
      );
      setText(
        'landmarksBadge',
        sectionData.landmarksBadge
      );
      setText(
        'landmarksTitle',
        sectionData.landmarksTitle
      );
      setText(
        'landmarksSubtitle',
        sectionData.landmarksSubtitle
      );
      const landmarksGrid =
        document.getElementById(
          'landmarksGrid'
        );
      if (landmarksGrid) {
        landmarksGrid.innerHTML =
          landmarks
            .map(
              (item, index) => {
                const image =
                  escapeAttr(
                    item &&
                      item.image
                      ? item.image
                      : ''
                  );
                const title =
                  escapeHtml(
                    item &&
                      item.title
                      ? item.title
                      : ''
                  );
                const subtitle =
                  escapeHtml(
                    item &&
                      item.subtitle
                      ? item.subtitle
                      : ''
                  );
                return `
                  <figure
                    class="landmark-card reveal"
                    ${editAttr(
                      `landmarks.${index}.image`
                    )}
                  >
                    <img
                      src="${image}"
                      alt="${title} — ${subtitle}"
                      loading="lazy"
                    >
                    <figcaption>
                      <h3${editAttr(
                        `landmarks.${index}.title`
                      )}>
                        ${title}
                      </h3>
                      <p${editAttr(
                        `landmarks.${index}.subtitle`
                      )}>
                        ${subtitle}
                      </p>
                    </figcaption>
                  </figure>
                `;
              }
            )
            .join('');
      }
    }
  );
  /* ===== الشريط المتحرك ===== */  safeRender(
    'announcement',
    () => {
      const bar =
        document.getElementById(
          'announcementBar'
        );
      if (!bar) return;
      if (
        data.announcement != null &&
        String(
          data.announcement
        ).trim() !== ''
      ) {
        bar.style.display = '';
        const track =
          bar.querySelector(
            '.announcement-track'
          );
        let ann =
          escapeHtml(
            String(
              data.announcement
            )
          );

        // تلوين وتظليل كلمة تابي وتمارا باحترافية ملفتة للانتباه
        ann = ann.replace(/تابي/g, '<span style="background: #39F5C5; color: #0A3617; padding: 2px 8px; border-radius: 4px; font-weight: 900; margin: 0 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">تابي</span>');
        ann = ann.replace(/تمارا/g, '<span style="background: #FFA494; color: #0A3617; padding: 2px 8px; border-radius: 4px; font-weight: 900; margin: 0 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">تمارا</span>');

        if (track) {
          // تكرار متتالي ممتد يملأ الشاشة بالكامل ويقضي على مشكلة الرمشة نهائياً
          track.innerHTML = `
            <span class="announcement-text" style="font-size: 16px; font-weight: 900; display: inline-flex; align-items: center; padding: 0 10px;">
              ${ann}
            </span>
            <span class="announcement-spacer" aria-hidden="true" style="display: inline-block; width: 60px; text-align: center; color: #115E2E; font-weight: 900;"> ◆ </span>
            <span class="announcement-text" aria-hidden="true" style="font-size: 16px; font-weight: 900; display: inline-flex; align-items: center; padding: 0 10px;">
              ${ann}
            </span>
            <span class="announcement-spacer" aria-hidden="true" style="display: inline-block; width: 60px; text-align: center; color: #115E2E; font-weight: 900;"> ◆ </span>
            <span class="announcement-text" aria-hidden="true" style="font-size: 16px; font-weight: 900; display: inline-flex; align-items: center; padding: 0 10px;">
              ${ann}
            </span>
            <span class="announcement-spacer" aria-hidden="true" style="display: inline-block; width: 60px; text-align: center; color: #115E2E; font-weight: 900;"> ◆ </span>
            <span class="announcement-text" aria-hidden="true" style="font-size: 16px; font-weight: 900; display: inline-flex; align-items: center; padding: 0 10px;">
              ${ann}
            </span>
            <span class="announcement-spacer" aria-hidden="true" style="display: inline-block; width: 60px; text-align: center; color: #115E2E; font-weight: 900;"> ◆ </span>
          `;
        }
        bar.setAttribute(
          'data-edit',
          'announcement'
        );
        bar.setAttribute(
          'data-edit-type',
          'text'
        );
        bar.setAttribute(
          'data-edit-label',
          'نص الشريط المتحرك'
        );
      } else {
        bar.style.display = 'none';
      }
    }
  );
  /* ===== هوية المجمع ===== */
  safeRender(
    'clinicIdentity',
    () => {
      setText(
        'logoName',
        clinic.name
      );
      setText(
        'logoTagline',
        clinic.tagline
      );
      setText(
        'footerName',
        clinic.name
      );
      setText(
        'footerTagline',
        clinic.tagline
      );
      setText(
        'footerNameBottom',
        clinic.name
      );
      markEditable(
        'logoName',
        'clinic.name'
      );
      markEditable(
        'logoTagline',
        'clinic.tagline'
      );
      markEditable(
        'footerName',
        'clinic.name'
      );
      markEditable(
        'footerTagline',
        'clinic.tagline'
      );
      markEditable(
        'footerNameBottom',
        'clinic.name'
      );
    }
  );
  /* ===== الهيرو ===== */
  safeRender(
    'hero',
    () => {
      const titleParts = [
        hero.title,
        hero.titleHighlight
      ].filter(Boolean);
      setText(
        'ndBannerBadge',
        hero.badge ||
          'رعاية طبية متخصصة'
      );
      setText(
        'ndBannerTitle',
        titleParts
          .join(' ')
          .trim() ||
          'ابتسامة أجمل تبدأ من هنا'
      );
      setText(
        'ndBannerSlogan',
        hero.subtitle ||
          'مجمع متخصص في طب وجراحة الأسنان بأحدث التقنيات'
      );
      setText(
        'heroBtnMain',
        hero.buttonMain ||
          'احجز موعدك الآن'
      );
      setText(
        'heroBtnSecondary',
        hero.buttonSecondary ||
          'اكتشف خدماتنا'
      );
      markEditable(
        'ndBannerBadge',
        'hero.badge'
      );
      markEditable(
        'ndBannerTitle',
        'hero.title'
      );
      markEditable(
        'ndBannerSlogan',
        'hero.subtitle'
      );
      markEditable(
        'heroBtnMain',
        'hero.buttonMain'
      );
      markEditable(
        'heroBtnSecondary',
        'hero.buttonSecondary'
      );
    }
  );
  /* ===== صور الهيرو القديمة ===== */
  safeRender(
    'heroImages',
    () => {
      const imageSources = {
        image:
          hero.image ||
          data.heroImage1 ||
          '',
        image2:
          hero.image2 ||
          data.heroImage2 ||
          ''
      };
      [
        'image',
        'image2'
      ].forEach(
        (key, index) => {
          const number =
            index + 1;
          const img =
            document.getElementById(
              'heroImage' +
                number
            );
          const placeholder =
            document.getElementById(
              'heroImagePlaceholder' +
                (
                  index === 0
                    ? ''
                    : '2'
                )
            );
          if (
            !img ||
            !placeholder
          ) {
            return;
          }
          const path =
            'hero.' + key;
          img.setAttribute(
            'data-edit',
            path
          );
          img.setAttribute(
            'data-edit-type',
            'image'
          );
          placeholder.setAttribute(
            'data-edit',
            path
          );
          placeholder.setAttribute(
            'data-edit-type',
            'image'
          );
          const image =
            imageSources[key];
          if (image) {
            img.src = image;
            img.style.display =
              'block';
            placeholder.style.display =
              'none';
          } else {
            img.removeAttribute(
              'src'
            );
            img.style.display =
              'none';
            placeholder.style.display =
              '';
          }
        }
      );
    }
  );
  /* ===== الإحصائيات ===== */
  safeRender(
    'stats',
    () => {
      const statsGrid =
        document.getElementById(
          'statsGrid'
        );
      if (!statsGrid) return;
      const stats =
        Array.isArray(data.stats)
          ? data.stats
          : [];
      statsGrid.innerHTML =
        stats
          .map(
            (stat, index) => {
              const number =
                stat &&
                stat.number != null
                  ? String(
                      stat.number
                    )
                  : '';
              const label =
                stat &&
                stat.label != null
                  ? String(
                      stat.label
                    )
                  : '';
              return `
                <div class="stat-item reveal">
                  <div
                    class="stat-number count-up"
                    data-target="${escapeAttr(
                      number
                    )}"
                    ${editAttr(
                      `stats.${index}.number`
                    )}
                  >
                    ${escapeHtml(
                      number
                    )}
                  </div>
                  <div
                    class="stat-label"
                    ${editAttr(
                      `stats.${index}.label`
                    )}
                  >
                    ${escapeHtml(
                      label
                    )}
                  </div>
                </div>
              `;
            }
          )
          .join('');
      animateCounters();
    }
  );
  /* ===== بطاقات الخدمات والأسعار ===== */safeRender(
    'services',
    () => {
      const servicesGrid =
        document.getElementById(
          'servicesGrid'
        );
      if (!servicesGrid) return;
      const clinicData =
        clinic || {};
      const categories =
        Array.isArray(
          data.serviceCategories
        )
          ? data.serviceCategories
          : [];

      servicesGrid.innerHTML =
        categories
          .map(
            (category, categoryIndex) => {
              const cat =
                category &&
                typeof category ===
                  'object'
                  ? category
                  : {};
              const items =
                Array.isArray(
                  cat.items
                )
                  ? cat.items
                  : [];
              const categoryTitle =
                cat.title != null
                  ? String(
                      cat.title
                    )
                  : '';
              const categoryIcon =
                cat.icon ||
                'tooth';
              return `
                <div class="price-category">
                  ${
                    categoryTitle
                      ? `
                    <h3 class="price-cat-title">
                      <span
                        class="price-cat-icon"
                        ${editAttr(
                          `serviceCategories.${categoryIndex}.icon`
                        )}
                      >
                        ${
                          window.ndIconHtml
                            ? window.ndIconHtml(
                                categoryIcon
                              )
                            : ''
                        }
                      </span>
                      <span
                        ${editAttr(
                          `serviceCategories.${categoryIndex}.title`
                        )}
                      >
                        ${escapeHtml(
                          categoryTitle
                        )}
                      </span>
                    </h3>
                  `
                      : ''
                  }
                  <div class="service-cards">
                    ${
                      items
                        .map(
                          (
                            item,
                            itemIndex
                          ) => {
                            const service =
                              item &&
                              typeof item ===
                                'object'
                                ? item
                                : {};
                            const base =
                              `serviceCategories.${categoryIndex}.items.${itemIndex}`;
                            const serviceName =
                              service.name !=
                              null
                                ? String(
                                    service.name
                                  )
                                : '';
                            const iconName =
                              serviceIconFor(
                                serviceName
                              );
                            const servicePrice =
                              service.price !=
                                  null &&
                              service.price !==
                                ''
                                ? `${service.price} ريال`
                                : '—';
                            const hasOldPrice =
                              service.oldPrice !=
                                  null &&
                              service.oldPrice !==
                                '';
                            const oldPrice =
                              hasOldPrice
                                ? `${service.oldPrice} ريال`
                                : '—';
                            const whatsapp =
                              normalizeWhatsApp(
                                clinicData.whatsapp
                              );
                            const waMsg =
                              encodeURIComponent(
                                `السلام عليكم ورحمة الله وبركاته. أرغب بطلب خدمة (${serviceName}) من مجمع عناية الابتسامة الطبي.`
                              );
                            const waHref =
                              whatsapp
                                ? `https://wa.me/${whatsapp}?text=${waMsg}`
                                : '#';
                            return `
                              <article class="service-card-wrap">
                                <div class="premium-card">
                                  <svg class="corner-ornament tl" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                    <path d="M1 17V8A7 7 0 0 1 8 1h9" stroke="#6FBF8A" stroke-width="1.5" stroke-linecap="round"/>
                                    <circle cx="3" cy="15" r="1.5" fill="#6FBF8A"/>
                                  </svg>
                                  <svg class="corner-ornament tr" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                    <path d="M1 17V8A7 7 0 0 1 8 1h9" stroke="#6FBF8A" stroke-width="1.5" stroke-linecap="round"/>
                                    <circle cx="3" cy="15" r="1.5" fill="#6FBF8A"/>
                                  </svg>
                                  <div class="card-inner">
                                    <div class="card-icon-wrap">
                                      <div class="card-icon-glow"></div>
                                      <span class="sparkle s1" aria-hidden="true">
                                        <svg viewBox="0 0 16 16"><path d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5Z" fill="#fff" opacity="0.9"/></svg>
                                      </span>
                                      <span class="sparkle s2" aria-hidden="true">
                                        <svg viewBox="0 0 16 16"><path d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5Z" fill="#E9F6EC"/></svg>
                                      </span>
                                      <span class="sparkle s3" aria-hidden="true">
                                        <svg viewBox="0 0 16 16"><path d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5Z" fill="#fff"/></svg>
                                      </span>
                                      <div class="shine-sweep" aria-hidden="true"></div>
                                      <span class="card-service-icon" aria-hidden="true">
                                        ${window.ndIconHtml ? window.ndIconHtml(iconName) : ''}
                                      </span>
                                    </div>
                                    <h4
                                      class="card-service service-card-name"
                                      ${editAttr(base + '.name')}
                                      title="${escapeAttr(serviceName)}"
                                    >
                                      ${escapeHtml(serviceName)}
                                    </h4>
                                    <div class="card-prices service-card-prices">
                                      <div class="price-box old price-cell price-old">
                                        <span class="label price-label">سابقاً</span>
                                        <span
                                          class="value price-value"
                                          ${editAttr(base + '.oldPrice')}
                                        >
                                          ${escapeHtml(oldPrice)}
                                        </span>
                                      </div>
                                      <div class="price-box price-cell price-now">
                                        <span class="label price-label">الآن</span>
                                        <span
                                          class="value price-value"
                                          ${editAttr(base + '.price')}
                                        >
                                          ${escapeHtml(servicePrice)}
                                        </span>
                                      </div>
                                    </div>
                                    <a
                                      class="card-btn price-wa-btn"
                                      href="${escapeAttr(waHref)}"
                                      ${
                                        whatsapp
                                          ? 'target="_blank" rel="noopener"'
                                          : ''
                                      }
                                      aria-label="لطلب خدمة ${escapeAttr(serviceName)}"
                                    >
                                      <span>لطلب الخدمة</span>
                                    </a>
                                  </div>
                                </div>
                              </article>
                            `;
                          }
                        )
                        .join('')
                    }
                  </div>
                </div>
              `;
            }
          )
          .join('');
      if (
        document.fonts &&
        document.fonts.ready
      ) {
        document.fonts.ready.then(
          () => {
            requestAnimationFrame(
              fitServiceCardNames
            );
          }
        );
      }
      requestAnimationFrame(
        fitServiceCardNames
      );
    }
  );

  /* ===== النصائح اليومية القديمة ===== */
  safeRender(
    'dailyTips',
    () => {
      const box =
        document.querySelector(
          '.daily-tips-box'
        );
      if (box) {
        box.style.display =
          'none';
      }
      const dailyTipsList =
        document.getElementById(
          'dailyTipsList'
        );
      if (dailyTipsList) {
        dailyTipsList.innerHTML =
          '';
      }
    }
  );
  /* ===== الثقافة الطبية ===== */
  safeRender(
    'tips',
    () => {
      const tipsGrid =
        document.getElementById(
          'tipsGrid'
        );
      if (!tipsGrid) return;
      const tips =
        Array.isArray(data.tips)
          ? data.tips
          : [];
      tipsGrid.innerHTML =
        tips
          .map(
            (tip, index) => {
              const item =
                tip &&
                typeof tip ===
                  'object'
                  ? tip
                  : {};
              return `
                <div class="tip-card tip-card-clean">
                  <h3
                    ${editAttr(
                      `tips.${index}.title`
                    )}
                  >
                    ${escapeHtml(
                      item.title ||
                        ''
                    )}
                  </h3>
                  <p
                    ${editAttr(
                      `tips.${index}.description`
                    )}
                  >
                    ${escapeHtml(
                      item.description ||
                        ''
                    )}
                  </p>
                </div>
              `;
            }
          )
          .join('');
    }
  );
  /* ===== المميزات ===== */
  safeRender(
    'features',
    () => {
      const featuresGrid =
        document.getElementById(
          'featuresGrid'
        );
      if (!featuresGrid) return;
      const features =
        Array.isArray(
          data.features
        )
          ? data.features
          : [];
      featuresGrid.innerHTML =
        features
          .map(
            (feature, index) => {
              const item =
                feature &&
                typeof feature ===
                  'object'
                  ? feature
                  : {};
              return `
                <div class="feature-card feature-card-premium">
                  <h3
                    ${editAttr(
                      `features.${index}.title`
                    )}
                  >
                    ${escapeHtml(
                      item.title ||
                        ''
                    )}
                  </h3>
                  <p
                    ${editAttr(
                      `features.${index}.description`
                    )}
                  >
                    ${escapeHtml(
                      item.description ||
                        ''
                    )}
                  </p>
                </div>
              `;
            }
          )
          .join('');
    }
  );
  /* ===== الأطباء ===== */
  safeRender(
    'doctors',
    () => {
      const doctorsGrid =
        document.getElementById(
          'doctorsGrid'
        );
      if (!doctorsGrid) return;
      const doctors =
        Array.isArray(
          data.doctors
        )
          ? data.doctors
          : [];
      doctorsGrid.innerHTML =
        doctors
          .map(
            (doctor, index) => {
              const item =
                doctor &&
                typeof doctor ===
                  'object'
                  ? doctor
                  : {};
              return `
                <div class="doctor-card reveal">
                  <div
                    class="doctor-avatar"
                    ${editAttr(
                      `doctors.${index}.initial`
                    )}
                  >
                    ${escapeHtml(
                      item.initial ||
                        ''
                    )}
                  </div>
                  <h3
                    ${editAttr(
                      `doctors.${index}.name`
                    )}
                  >
                    ${escapeHtml(
                      item.name ||
                        ''
                    )}
                  </h3>
                  <p
                    class="doctor-specialty"
                    ${editAttr(
                      `doctors.${index}.specialty`
                    )}
                  >
                    ${escapeHtml(
                      item.specialty ||
                        ''
                    )}
                  </p>
                  <span
                    class="doctor-exp"
                    ${editAttr(
                      `doctors.${index}.experience`
                    )}
                  >
                    ${escapeHtml(
                      item.experience ||
                        ''
                    )}
                  </span>
                </div>
              `;
            }
          )
          .join('');
    }
  );
  /* ===== التعليقات ===== */
  safeRender(
    'testimonials',
    () => {
      const testimonialsGrid =
        document.getElementById(
          'testimonialsGrid'
        );
      if (!testimonialsGrid) return;
      testimonialsGrid.innerHTML =
        testimonials
          .map(
            (testimonial, index) => {
              const item =
                testimonial &&
                typeof testimonial ===
                  'object'
                  ? testimonial
                  : {};
              return `
                <div class="testimonial-card reveal">
                  <div
                    class="testimonial-stars"
                    ${editAttr(
                      `reviews.${index}.rating`
                    )}
                  >
                    ${ndStars(
                      item.rating
                    )}
                  </div>
                  <p
                    class="testimonial-text"
                    ${editAttr(
                      `reviews.${index}.text`
                    )}
                  >
                    "${escapeHtml(
                      item.text ||
                        ''
                    )}"
                  </p>
                  <p
                    class="testimonial-name"
                    ${editAttr(
                      `reviews.${index}.name`
                    )}
                  >
                    ${escapeHtml(
                      item.name ||
                        ''
                    )}
                  </p>
                </div>
              `;
            }
          )
          .join('');
    }
  );
  /* ===== الحجز ===== */
  safeRender(
    'booking',
    () => {
      setText(
        'bookingTitle',
        booking.title || ''
      );
      setText(
        'bookingSubtitle',
        booking.subtitle ||
          ''
      );
      setText(
        'submitBtn',
        booking.button ||
          ''
      );
      markEditable(
        'bookingTitle',
        'booking.title'
      );
      markEditable(
        'bookingSubtitle',
        'booking.subtitle'
      );
      markEditable(
        'submitBtn',
        'booking.button'
      );
      const serviceSelect =
        document.getElementById(
          'service'
        );
      if (!serviceSelect) return;
      serviceSelect.innerHTML =
        '<option value="">اختر الخدمة</option>' +
        bookingServices
          .map(
            (service) => {
              const value =
                String(
                  service ?? ''
                );
              return `
                <option value="${escapeAttr(
                  value
                )}">
                  ${escapeHtml(
                    value
                  )}
                </option>
              `;
            }
          )
          .join('');
      serviceSelect.setAttribute(
        'data-edit',
        'bookingServices'
      );
      serviceSelect.setAttribute(
        'data-edit-type',
        'list'
      );
      serviceSelect.setAttribute(
        'data-edit-label',
        'قائمة خدمات الحجز (كل خدمة في سطر)'
      );
    }
  );
  /* ===== الأسئلة الشائعة ===== */
  safeRender(
    'faq',
    () => {
      const list =
        document.getElementById(
          'faqList'
        );
      if (!list) return;
      const items =
        Array.isArray(data.faq)
          ? data.faq
          : [];
      list.innerHTML =
        items
          .map(
            (faqItem, index) => {
              const item =
                faqItem &&
                typeof faqItem ===
                  'object'
                  ? faqItem
                  : {};
              return `
                <details class="faq-item">
                  <summary class="faq-q">
                    <span
                      class="faq-q-text"
                      ${editAttr(
                        `faq.${index}.q`
                      )}
                    >
                      ${escapeHtml(
                        item.q || ''
                      )}
                    </span>
                    <span
                      class="faq-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <div
                    class="faq-a"
                    ${editAttr(
                      `faq.${index}.a`
                    )}
                  >
                    ${escapeHtml(
                      item.a || ''
                    )}
                  </div>
                </details>
              `;
            }
          )
          .join('');
    }
  );
  /* ===== التواصل ===== */
  safeRender(
    'contact',
    () => {
      setText(
        'contactAddress',
        clinic.address ||
          ''
      );
      const addressEl =
        document.getElementById(
          'contactAddress'
        );
      if (addressEl) {
        addressEl.setAttribute(
          'data-edit',
          'clinic.address'
        );
        addressEl.setAttribute(
          'data-edit-type',
          'text'
        );
      }
      const phoneEl =
        document.getElementById(
          'contactPhone'
        );
      if (phoneEl) {
        const phone =
          String(
            clinic.phone || ''
          );
        phoneEl.innerHTML =
          phone
            ? `جوال: <a href="tel:${escapeAttr(
                phone
              )}" data-edit="clinic.phone" data-edit-type="text">${escapeHtml(
                phone
              )}</a>`
            : '';
      }
      const emailEl =
        document.getElementById(
          'contactEmail'
        );
      if (emailEl) {
        const email =
          String(
            clinic.email || ''
          );
        emailEl.innerHTML =
          email
            ? `بريد: <a href="mailto:${escapeAttr(
                email
              )}" data-edit="clinic.email" data-edit-type="text">${escapeHtml(
                email
              )}</a>`
            : '';
      }
      const mapBtn =
        document.getElementById(
          'mapBtn'
        );
      const mapUrl =
        normalizeUrl(
          clinic.mapUrl
        );
      const mapQuery =
        mapUrl ||
        (
          'https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(
            clinic.address || ''
          )
        );
      if (mapBtn) {
        mapBtn.href =
          mapQuery;
        mapBtn.setAttribute(
          'data-edit',
          'clinic.mapUrl'
        );
        mapBtn.setAttribute(
          'data-edit-type',
          'text'
        );
        mapBtn.setAttribute(
          'data-edit-label',
          'رابط الخريطة'
        );
      }
      const mapFrame =
        document.getElementById(
          'mapFrame'
        );
      if (mapFrame) {
        mapFrame.src =
          'https://maps.google.com/maps?q=' +
          encodeURIComponent(
            clinic.address || ''
          ) +
          '&hl=ar&z=15&output=embed';
      }
      const whatsapp =
        normalizeWhatsApp(
          clinic.whatsapp
        );
      setText(
        'footerAddress',
        clinic.address ||
          ''
      );
      const footerAddressEl =
        document.getElementById(
          'footerAddress'
        );
      if (footerAddressEl) {
        markEditable(
          'footerAddress',
          'clinic.address'
        );
      }
      const footerPhoneEl =
        document.getElementById(
          'footerPhone'
        );
      if (footerPhoneEl) {
        const phone =
          String(
            clinic.phone || ''
          );
        footerPhoneEl.innerHTML =
          phone
            ? `جوال: <a href="tel:${escapeAttr(
                phone
              )}" data-edit="clinic.phone" data-edit-type="text">${escapeHtml(
                phone
              )}</a>`
            : '';
      }
      const footerEmailEl =
        document.getElementById(
          'footerEmail'
        );
      if (footerEmailEl) {
        const email =
          String(
            clinic.email || ''
          );
        footerEmailEl.innerHTML =
          email
            ? `بريد: <a href="mailto:${escapeAttr(
                email
              )}" data-edit="clinic.email" data-edit-type="text">${escapeHtml(
                email
              )}</a>`
            : '';
      }
    }
  );
  /* ===== ساعات العمل ===== */
  safeRender(
    'workingHours',
    () => {
      const hoursList =
        document.getElementById(
          'hoursList'
        );
      if (!hoursList) return;
      hoursList.innerHTML =
        workingHours
          .map(
            (hour, index) => {
              const item =
                hour &&
                typeof hour ===
                  'object'
                  ? hour
                  : {};
              const days =
                item.days || '';
              const time =
                item.time || '';
              const open =
                Boolean(
                  item.open
                );
              return `
                <li>
                  <span
                    ${editAttr(
                      `workingHours.${index}.days`
                    )}
                  >
                    ${escapeHtml(
                      days
                    )}
                  </span>
                  <span
                    class="${
                      open
                        ? 'open'
                        : 'closed'
                    }"
                    ${editAttr(
                      `workingHours.${index}.time`
                    )}
                    data-edit-open="${escapeAttr(
                      `workingHours.${index}.open`
                    )}"
                  >
                    ${escapeHtml(
                      time
                    )}
                  </span>
                </li>
              `;
            }
          )
          .join('');
      hoursList
        .querySelectorAll(
          '[data-edit-open]'
        )
        .forEach((el) => {
          el.setAttribute(
            'data-edit',
            el.getAttribute(
              'data-edit-open'
            )
          );
          el.setAttribute(
            'data-edit-type',
            'boolean'
          );
          el.setAttribute(
            'data-edit-label',
            'حالة الدوام'
          );
          el.removeAttribute(
            'data-edit-open'
          );
        });
    }
  );
  /* ===== مواقع التواصل ===== */
  safeRender(
    'social',
    () => {
      const socialLinks =
        document.getElementById(
          'socialLinks'
        );
      if (!socialLinks) return;
      const whatsapp =
        normalizeWhatsApp(
          clinic.whatsapp
        );
      const socials = [
        {
          url:
            normalizeUrl(
              clinic.instagram
            ),
          icon: 'instagram',
          name: 'انستقرام',
          path: 'clinic.instagram'
        },
        {
          url:
            normalizeUrl(
              clinic.snapchat
            ),
          icon: 'snapchat',
          name: 'سناب شات',
          path: 'clinic.snapchat'
        },
        {
          url:
            normalizeUrl(
              clinic.tiktok
            ),
          icon: 'tiktok',
          name: 'تيك توك',
          path: 'clinic.tiktok'
        },
        {
          url:
            normalizeUrl(
              clinic.twitter
            ),
          icon: 'twitter',
          name: 'تويتر',
          path: 'clinic.twitter'
        }
      ];
      const list =
        socials.filter(
          (social) =>
            Boolean(social.url)
        );
      socialLinks.innerHTML =
        list
          .map(
            (social) => `
              <a
                href="${escapeAttr(
                  social.url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="${escapeAttr(
                  social.name
                )}"
                title="${escapeAttr(
                  social.name
                )}"
                ${editAttr(
                  social.path
                )}
              >
                ${
                  window.ndIconHtml
                    ? window.ndIconHtml(
                        social.icon
                      )
                    : ''
                }
              </a>
            `
          )
          .join('');
      const block =
        document.querySelector(
          '.social-block'
        );
      if (block) {
        block.style.display =
          list.length
            ? ''
            : 'none';
      }
    }
  );
  /* ===== واتساب العائم ===== */
  safeRender(
    'whatsapp',
    () => {
      const floatBtn =
        document.getElementById(
          'whatsappFloat'
        );
      if (!floatBtn) return;
      const whatsapp =
        normalizeWhatsApp(
          clinic.whatsapp
        );
      if (whatsapp) {
        const waMessage =
          encodeURIComponent(
            'مرحباً، أرغب بحجز موعد في ' +
              (clinic.name || '')
          );
        floatBtn.href =
          `https://wa.me/${whatsapp}?text=${waMessage}`;
        floatBtn.style.display =
          '';
        floatBtn.setAttribute(
          'data-edit',
          'clinic.whatsapp'
        );
        floatBtn.setAttribute(
          'data-edit-type',
          'text'
        );
        floatBtn.setAttribute(
          'data-edit-label',
          'رقم الواتساب (مثل 9665xxxxxxxx)'
        );
      } else {
        floatBtn.removeAttribute(
          'href'
        );
        floatBtn.style.display =
          'none';
      }
    }
  );
  /* ===== السنة ===== */
  safeRender(
    'year',
    () => {
      const yearEl =
        document.getElementById(
          'currentYear'
        );
      if (yearEl) {
        yearEl.textContent =
          String(
            new Date().getFullYear()
          );
      }
    }
  );
  initScrollReveal();
  initNavSpy();
}
/* ===== حفظ تعديلات وضع المالك ===== */
window.saveOverride = function (
  path,
  value
) {
  if (!path) return;
  const overrides =
    getOverrides();
  overrides[path] = value;
  try {
    localStorage.setItem(
      OVERRIDES_KEY,
      JSON.stringify(overrides)
    );
  } catch (error) {
    console.error(
      'تعذر حفظ التعديل المحلي.',
      error
    );
    return;
  }
  if (siteData) {
    setDeep(
      siteData,
      path,
      value
    );
  }
};
window.getSiteData = () =>
  siteData;
window.getOverrideValue = (
  path
) =>
  getDeep(
    siteData || {},
    path
  );
/* ===== نموذج الحجز ===== */
function initBookingForm() {
  const bookingFormEl =
    document.getElementById(
      'bookingForm'
    );
  if (!bookingFormEl) return;
  if (
    bookingFormEl.dataset.initialized ===
    'true'
  ) {
    return;
  }
  bookingFormEl.dataset.initialized =
    'true';
  bookingFormEl.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();
      if (!siteData) return;
      const nameEl =
        document.getElementById(
          'name'
        );
      const phoneEl =
        document.getElementById(
          'phone'
        );
      const serviceEl =
        document.getElementById(
          'service'
        );
      const dateEl =
        document.getElementById(
          'date'
        );
      const name =
        nameEl
          ? nameEl.value.trim()
          : '';
      const phone =
        phoneEl
          ? phoneEl.value.trim()
          : '';
      const service =
        serviceEl
          ? serviceEl.value
          : '';
      const date =
        dateEl
          ? dateEl.value
          : '';
      if (
        !name ||
        !phone ||
        !service
      ) {
        if (
          typeof bookingFormEl
            .reportValidity ===
          'function'
        ) {
          bookingFormEl.reportValidity();
        }
        return;
      }
      const clinic =
        siteData.clinic || {};
      const whatsapp =
        normalizeWhatsApp(
          clinic.whatsapp
        );
      if (!whatsapp) {
        console.error(
          'رقم واتساب المجمع غير موجود في بيانات المحتوى.'
        );
        return;
      }
      let message =
        'طلب حجز موعد جديد\n\n';
      message +=
        `الاسم: ${name}\n`;
      message +=
        `الجوال: ${phone}\n`;
      message +=
        `الخدمة: ${service}\n`;
      if (date) {
        message +=
          `اليوم المفضل: ${date}\n`;
      }
      const waUrl =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(
          message
        )}`;
      window.open(
        waUrl,
        '_blank',
        'noopener'
      );
    }
  );
}
/* ===== نموذج التعليقات ===== */
function initReviewForm() {
  const reviewFormEl =
    document.getElementById(
      'reviewForm'
    );
  if (!reviewFormEl) return;
  if (
    reviewFormEl.dataset.initialized ===
    'true'
  ) {
    return;
  }
  reviewFormEl.dataset.initialized =
    'true';
  reviewFormEl.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();
      if (!siteData) return;
      const nameEl =
        document.getElementById(
          'reviewName'
        );
      const textEl =
        document.getElementById(
          'reviewText'
        );
      const name =
        nameEl
          ? nameEl.value.trim()
          : '';
      const text =
        textEl
          ? textEl.value.trim()
          : '';
      if (!name || !text) {
        if (
          typeof reviewFormEl
            .reportValidity ===
          'function'
        ) {
          reviewFormEl.reportValidity();
        }
        return;
      }
      const clinic =
        siteData.clinic || {};
      const whatsapp =
        normalizeWhatsApp(
          clinic.whatsapp
        );
      if (!whatsapp) {
        console.error(
          'رقم واتساب المجمع غير موجود في بيانات المحتوى.'
        );
        return;
      }
      let message =
        'تعليق جديد من موقع المجمع\n\n';
      message +=
        `الاسم: ${name}\n`;
      message +=
        `التعليق: ${text}\n`;
      const waUrl =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(
          message
        )}`;
      window.open(
        waUrl,
        '_blank',
        'noopener'
      );
      if (nameEl) {
        nameEl.value = '';
      }
      if (textEl) {
        textEl.value = '';
      }
      alert(
        'شكراً لك! تم إرسال تعليقك، وسيظهر بعد المراجعة.'
      );
    }
  );
}
/* ===== القائمة المتنقلة ===== */
function initMobileMenu() {
  const menuToggle =
    document.getElementById(
      'navToggle'
    );
  const navLinks =
    document.getElementById(
      'navLinks'
    );
  if (
    !menuToggle ||
    !navLinks
  ) {
    return;
  }
  if (
    menuToggle.dataset.initialized ===
    'true'
  ) {
    return;
  }
  menuToggle.dataset.initialized =
    'true';
  function closeMobileMenu() {
    navLinks.classList.remove(
      'open'
    );
    menuToggle.setAttribute(
      'aria-expanded',
      'false'
    );
  }
  menuToggle.addEventListener(
    'click',
    () => {
      const isOpen =
        navLinks.classList.toggle(
          'open'
        );
      menuToggle.setAttribute(
        'aria-expanded',
        isOpen
          ? 'true'
          : 'false'
      );
    }
  );
  navLinks
    .querySelectorAll('a')
    .forEach((link) => {
      link.addEventListener(
        'click',
        closeMobileMenu
      );
    });
  document.addEventListener(
    'click',
    (event) => {
      if (
        !navLinks.classList.contains(
          'open'
        )
      ) {
        return;
      }
      if (
        navLinks.contains(
          event.target
        ) ||
        menuToggle.contains(
          event.target
        )
      ) {
        return;
      }
      closeMobileMenu();
    }
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape'
      ) {
        closeMobileMenu();
      }
    }
  );
  window.addEventListener(
    'resize',
    () => {
      if (
        window.innerWidth > 900
      ) {
        closeMobileMenu();
      }
    },
    {
      passive: true
    }
  );
}
/* ===== مراقبة أقسام القائمة ===== */
function initNavSpy() {
  const navLinks =
    document.getElementById(
      'navLinks'
    );
  if (!navLinks) return;
  const links =
    Array.from(
      navLinks.querySelectorAll(
        '.nav-link'
      )
    );
  if (!links.length) return;
  const targets =
    links
      .map((link) => {
        const href =
          link.getAttribute(
            'href'
          ) || '';
        const id =
          href.startsWith('#')
            ? href.slice(1)
            : '';
        const section =
          id
            ? document.getElementById(
                id
              )
            : null;
        return section
          ? {
              link,
              section
            }
          : null;
      })
      .filter(Boolean);
  if (!targets.length) return;
  if (
    typeof IntersectionObserver ===
    'undefined'
  ) {
    return;
  }
  const setActive =
    (link) => {
      links.forEach(
        (item) => {
          item.classList.toggle(
            'active',
            item === link
          );
        }
      );
    };
  if (
    navLinks.dataset.spyInitialized ===
    'true'
  ) {
    return;
  }
  navLinks.dataset.spyInitialized =
    'true';
  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }
            const match =
              targets.find(
                (target) =>
                  target.section ===
                  entry.target
              );
            if (match) {
              setActive(
                match.link
              );
            }
          }
        );
      },
      {
        rootMargin:
          '-45% 0px -50% 0px',
        threshold: 0
      }
    );
  targets.forEach(
    (target) => {
      observer.observe(
        target.section
      );
    }
  );
}
/* ===== تأثير الهيدر عند التمرير ===== */
function initHeaderScroll() {
  const headerEl =
    document.getElementById(
      'header'
    );
  if (!headerEl) return;
  if (
    headerEl.dataset.scrollInitialized ===
    'true'
  ) {
    return;
  }
  headerEl.dataset.scrollInitialized =
    'true';
  let scrollTicking =
    false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(
        () => {
          headerEl.classList.toggle(
            'scrolled',
            window.scrollY > 30
          );
          scrollTicking = false;
        }
      );
    },
    {
      passive: true
    }
  );
}
/* ===== ظهور العناصر أثناء التمرير ===== */
function initScrollReveal() {
  if (
    typeof IntersectionObserver ===
    'undefined'
  ) {
    document
      .querySelectorAll(
        '.reveal:not(.visible)'
      )
      .forEach((el) => {
        el.classList.add(
          'visible'
        );
      });
    return;
  }
  document
    .querySelectorAll(
      '.reveal:not(.visible)'
    )
    .forEach((el) => {
      if (
        el.dataset.revealInitialized ===
        'true'
      ) {
        return;
      }
      el.dataset.revealInitialized =
        'true';
      const observer =
        new IntersectionObserver(
          (entries, obs) => {
            entries.forEach(
              (entry) => {
                if (
                  !entry.isIntersecting
                ) {
                  return;
                }
                entry.target.classList.add(
                  'visible'
                );
                obs.unobserve(
                  entry.target
                );
              }
            );
          },
          {
            threshold: 0.12
          }
        );
      observer.observe(el);
    });
}
/* ===== تشغيل وظائف الصفحة بعد جاهزية DOM ===== */
function initPage() {
  initBookingForm();
  initReviewForm();
  initMobileMenu();
  initHeaderScroll();
  loadContent();
}
if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    initPage,
    {
      once: true
    }
  );
} else {
  initPage();
}
/* ===== إعادة ضبط أسماء بطاقات الخدمات عند تغيير الحجم ===== */
let _fitTimer = null;
window.addEventListener(
  'resize',
  () => {
    clearTimeout(
      _fitTimer
    );
    _fitTimer = setTimeout(
      fitServiceCardNames,
      150
    );
  },
  {
    passive: true
  }
);
