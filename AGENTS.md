# AGENTS.md

## المشروع
موقع ثابت (HTML/CSS/JS) لمجمع عناية الابتسامة الطبي. لا يوجد نظام بناء ولا اعتماديات npm — الملفات تُقدَّم مباشرة.

## الملفات الأساسية
- `index.html` — الصفحة الرئيسية (أقسام: hero, services, offers, stats, about, tips, doctors, booking, reviews, faq, contact).
- `catalog.html` — صفحة المعرض/العروض المستقلة.
- `catalog.js` — يرسم المعرض في الصفحتين (`#offersGrid` في الرئيسية، `#catalogGrid` في صفحة المعرض) عبر `renderAllCatalogs()`.
- `main.js` — تحميل `content.json`، تعبئة العناصر ذات `data-edit`، وبثّ حدث `siteRendered`.
- `admin.js` — وضع المالك (دخول بمفتاح، تعديل، تحميل JSON).
- `content.json` — مصدر المحتوى. قسم `catalog` يحتوي `badge`/`title`/`subtitle`/`items`.
- `sw.js` — service worker؛ **يجب** رفع `CACHE_NAME` وإضافة أي ملف جديد إلى `ASSETS` عند كل تغيير.

## قواعد مهمة
- أي تعديل على CSS/JS يستلزم رفع رقم الإصدار `?v=` في `index.html` و`catalog.html` (كلاهما) لتجاوز الكاش.
- أدوات المالك في `catalog.js` تُبنى داخل DOM فقط عند `window.adminActive` — لا تُبنى إطلاقاً للزوار (لا تخفِها بـ CSS فقط).
- تعديلات المالك تُحفظ في `overrides` بالذاكرة/التخزين ثم تُصدَّر عبر `content.json`؛ لا كتابة مباشرة على الملف من المتصفح.
- لا توجد اختبارات آلية. التحقق يتم يدوياً عبر متصفح فعلي.

## أوامر مفيدة
```bash
node --check catalog.js main.js admin.js   # فحص الصياغة
python3 -m http.server 8099 --bind 127.0.0.1   # خادم محلي للمعاينة
python3 -c "import json;json.load(open('content.json'))"   # فحص JSON
```
