# نشر «أرشيفنا»

المشروع من جزأين: واجهة (`apps/web`) وخادم (`apps/api`) مع قاعدة PostgreSQL.

## الوضع الحالي

| العنصر | الحالة |
|---|---|
| المستودع | `github.com/yazanwafeq551-beep/archivna` (خاص)، فرعا `main` و`development` |
| مشروع Vercel | `archivna` ضمن `yazanwafeq551-4466s-projects`، جذر البناء `./` |
| رابط الإنتاج | <https://archivna.vercel.app> |
| النشر التلقائي للواجهة | مفعّل: دفع إلى `main` ينشر للإنتاج، وإلى `development` ينشر معاينة |
| الخادم `apps/api` | **جاهز للنشر ولم يُنشر بعد** — `render.yaml` في جذر المستودع يصف الخدمة بالكامل |
| قاعدة البيانات | **جاهزة ومزروعة** — قاعدة `archivna` على مشروع Neon `neon-amber-pillar`، المخطط مطبَّق كاملًا وبلا فروق، وفيها ٧ مستخدمين و٥ مؤسسات و٢٠ مادة أرشيفية و٧ أخبار |
| تخزين الوسائط | **جاهز** — Cloudinary، السحابة `t1rogtjy` |

## الحسابات المطلوبة (كلها مجانية)

أنشئها بنفسك بتسجيل الدخول بحساب Google نفسه — هيك ما بتحتاج تتعامل مع كلمات مرور جديدة:

| الخدمة | لماذا | الخطة المجانية |
|---|---|---|
| [Neon](https://neon.tech) | قاعدة PostgreSQL | 0.5 غيغابايت تخزين، بلا تاريخ انتهاء. الحوسبة تنام عند الخمول وتصحو خلال ثانية |
| [Render](https://render.com) | استضافة الخادم | 750 ساعة شهريًا. الخدمة تنام بعد ١٥ دقيقة خمول، وأول طلب بعدها يستغرق ~٥٠ ثانية |
| [Cloudinary](https://cloudinary.com) | ملفات الوسائط | 25 وحدة شهريًا. **الفيديو محدود بـ100 ميغابايت للملف** |

**لماذا لا يكفي Vercel وحده:** دوالّه بلا خادم يحدّها 4.5 ميغابايت لكل طلب، ونظام ملفاتها مؤقت — أي ملف يُرفع إليها يختفي مع أول تشغيل جديد. الواجهة عليه، والخادم على عملية Node دائمة.

**قيد يستحق المعرفة قبل الإطلاق:** خطة Render المجانية تُنيم الخدمة عند الخمول، فأول زائر بعد فترة هدوء ينتظر نحو دقيقة. مقبول للعرض والتجربة، لكن لإطلاق حقيقي تلزم خطة مدفوعة (~7 دولار شهريًا) أو مُنبِّه دوري يطلب `/api/v1/health` كل عشر دقائق.

## خطوات النشر بالترتيب

1. ~~Neon~~ و~~Cloudinary~~ — تمّا. القاعدة منشأة ومزروعة والوسائط جاهزة.
3. **Render**: New ← **Blueprint** ← اختر المستودع. سيقرأ `render.yaml` وينشئ الخدمة، ثم يسألك عن المتغيّرات المعلّمة `sync: false`:
   - `DATABASE_URL` — رابط Neon **المجمَّع** (فيه `-pooler`)
   - `DIRECT_DATABASE_URL` — نفس الرابط **بدون** `-pooler`؛ عليه تُطبَّق الهجرات، لأن مجمِّع الاتصالات لا يحتفظ بحالة الجلسة التي يحتاجها Prisma لتغيير المخطط
   - `FRONTEND_URL` — `https://archivna.vercel.app`
   - `CLOUDINARY_CLOUD_NAME` و`CLOUDINARY_API_KEY` و`CLOUDINARY_API_SECRET`
   مفتاحا JWT يولّدهما Render تلقائيًا. الهجرات تُطبَّق عند كل نشر قبل تشغيل الخادم.
4. **Vercel**: أضف `VITE_API_URL` بقيمة عنوان خدمة Render (مثل `https://archivna-api.onrender.com`) ثم أعد النشر.
5. **البذرة الأولى** (اختياري): خطة Render المجانية بلا وصول Shell، فشغّل البذرة من جهازك على قاعدة Neon مباشرة:

   ```bash
   cd apps/api && DATABASE_URL="<رابط Neon>" npx prisma db seed
   ```

**تحقّق بعد النشر:**

```bash
curl https://archivna-api.onrender.com/api/v1/health
```

يجب أن يرجّع `{"status":"ok",...}` — النقطة تلمس قاعدة البيانات فعلًا، فنجاحها يعني أن الخادم والقاعدة متصلان.

## أين ينشر كل جزء ولماذا

| الجزء | المكان الموصى به |
|---|---|
| الواجهة `apps/web` | **Vercel** |
| الخادم `apps/api` | **Railway** أو **Render** أو أي خادم Node دائم |
| قاعدة البيانات | **Neon** أو **Supabase** أو Postgres على Railway |
| ملفات الوسائط | **Cloudinary** (`STORAGE_DRIVER=cloudinary`) |

**لماذا ليس الخادم كله على Vercel:** دوال Vercel بلا خادم يحدّها **4.5 ميغابايت لكل طلب**، وفيديوهات الدروس عندنا تصل إلى مئات الميغابايتات، فالرفع سيفشل. كما أن نظام ملفاتها مؤقت، فأي ملف يُرفع محليًا يختفي مع أول تشغيل جديد. لذلك الواجهة على Vercel والخادم على استضافة فيها عملية Node دائمة.

> إن أصررت على وضع الخادم على Vercel أيضًا، فالمسار الوحيد السليم هو رفع الوسائط من المتصفح مباشرة إلى Cloudinary بتوقيع من الخادم (signed upload) بدل مرورها بالـ API.

---

## 1) الرفع إلى GitHub

الفرع `main` هو فرع الإنتاج، و`development` فرع العمل.

```bash
git checkout main
git merge development
git push -u origin main
git checkout development
git push -u origin development
```

إن كان المستودع غير موجود بعد، أنشئه على GitHub باسم `arsheefna-platform` ثم:

```bash
git remote set-url origin https://github.com/<اسم-المستخدم>/arsheefna-platform.git
```

---

## 2) قاعدة البيانات

أنشئ قاعدة PostgreSQL (Neon أو Supabase)، وخذ رابط الاتصال، ثم من جهازك:

```bash
DATABASE_URL="postgresql://..." npm run migrate:deploy
```

ولتعبئة البيانات التجريبية (اختياري، للعرض فقط):

```bash
DATABASE_URL="postgresql://..." npm run prisma:seed -w apps/api
```

---

## 3) الخادم (Railway مثالًا)

1. أنشئ مشروعًا من مستودع GitHub، واضبط **Root Directory** على `apps/api`.
2. Dockerfile الجاهز للإنتاج: `apps/api/Dockerfile.prod` (يشغّل الهجرات ثم الخادم). أو استخدم أوامر البناء والتشغيل:
   - Build: `npm run build`
   - Start: `npm run start:prod`
3. اضبط المتغيرات:

```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<٣٢ حرفًا عشوائيًا على الأقل>
JWT_REFRESH_SECRET=<٣٢ حرفًا عشوائيًا مختلفًا>
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
NODE_ENV=production
PORT=3000
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://<مشروعك>.vercel.app
CROSS_SITE_COOKIES=true
RATE_LIMIT_MAX=600
AUTH_RATE_LIMIT_MAX=20
```

لتوليد مفتاح قوي:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> الخادم **يرفض الإقلاع** في وضع الإنتاج إذا كانت المفاتيح ضعيفة أو ما زالت المفاتيح المثال.

---

## 4) الواجهة على Vercel

1. Import المستودع من GitHub. ملف `vercel.json` في الجذر يضبط البناء والإخراج، فلا حاجة لضبط يدوي.
2. متغير البيئة الوحيد:

```
VITE_API_URL=https://<خادمك>.up.railway.app
```

3. بعد أول نشر، أعد ضبط `FRONTEND_URL` على الخادم ليطابق دومين Vercel (يقبل أكثر من دومين مفصولة بفواصل، مفيد لنشرات المعاينة).

### خيار أفضل: الخادم تحت نفس الدومين

كوكي الجلسة يبقى «طرفًا أول» ولا نحتاج `CROSS_SITE_COOKIES` أصلًا إن مرّرنا الـ API عبر Vercel. أضف إلى `vercel.json` قبل قاعدة SPA:

```json
{ "source": "/api/:path*", "destination": "https://<خادمك>.up.railway.app/api/:path*" },
{ "source": "/uploads/:path*", "destination": "https://<خادمك>.up.railway.app/uploads/:path*" }
```

وحينها اترك `VITE_API_URL` فارغًا و`CROSS_SITE_COOKIES=false`. هذا الخيار **مستحسن**: متصفحات مثل Safari تحجب كوكي الطرف الثالث افتراضيًا، ما يعني خروج المستخدم من جلسته في الوضع المنفصل.

---

## 5) بعد النشر — قائمة تحقق

- [ ] `https://<الدومين>/` تفتح والواجهة تظهر.
- [ ] تسجيل الدخول ثم تحديث الصفحة: تبقى الجلسة قائمة (هنا يظهر أي خلل في الكوكي أو CORS).
- [ ] البحث يرجع نتائج، وصور المواد تظهر.
- [ ] رفع صورة شخصية ينجح (يتحقق من Cloudinary).
- [ ] إنشاء دورة ورفع فيديو من لوحة الإدارة.
- [ ] `https://<خادمك>/api/docs` تعمل (Swagger) — أغلقها لاحقًا إن أردت.

## متغيرات البيئة في سطر واحد

| المتغير | الخادم | الواجهة |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | — |
| `STORAGE_DRIVER` + مفاتيح Cloudinary | ✅ | — |
| `FRONTEND_URL` | ✅ | — |
| `CROSS_SITE_COOKIES` | ✅ (عند فصل الدومين) | — |
| `VITE_API_URL` | — | ✅ (إلا مع تمرير Vercel) |
