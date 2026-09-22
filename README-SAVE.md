# الحفظ التلقائي إلى content.json

حتى يُحدَّث الملف تلقائياً على GitHub/Cloudflare بعد كل تعديل من لوحة المالك، أضف في Cloudflare Pages:

Settings → Environment variables (Production):

1. ADMIN_PASSWORD = (كلمة مرورك الحالية — موجودة مسبقاً)
2. GITHUB_TOKEN = Personal Access Token من GitHub (صلاحية Contents: Read and write)
3. GITHUB_REPO = اسم المستودع مثل: your-user/your-repo
4. GITHUB_BRANCH = main   (اختياري)
5. GITHUB_PATH = content.json   (اختياري)

بعدها أي تعديل/إضافة/حذف من الموقع يُحفظ محلياً ويُرسل تلقائياً إلى content.json في المستودع، ثم Cloudflare يعيد النشر إن كان مربوطاً بـ GitHub.
