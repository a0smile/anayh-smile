# تفعيل شهادة SSL (Cloudflare Pages)

Cloudflare يوفّر شهادة SSL مجانية تلقائياً.

## إذا الموقع على pages.dev
- الرابط https://your-project.pages.dev يعمل بـ HTTPS تلقائياً.

## إذا لديك دومين خاص
1. Cloudflare Dashboard → Workers & Pages → مشروعك
2. Custom domains → أضف الدومين
3. تأكد أن الدومين على Cloudflare (Proxied/البرتقالي)
4. SSL/TLS → Overview → اختر Full (strict) إن أمكن
5. Always Use HTTPS = ON
6. Automatic HTTPS Rewrites = ON

لا حاجة لرفع شهادة يدوياً من ملفات الموقع.
