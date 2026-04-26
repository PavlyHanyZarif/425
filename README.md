# مكتبة الألحان — مشروع كامل قابل للتعديل

مشروع جاهز يعمل على أي جهاز فيه **Node.js 18+**، بدون أي علاقة بـ Replit.

## ✨ خصائص

- React + Vite + TypeScript للواجهة
- Express + Multer للسيرفر
- تخزين الكتب في ملفات JSON + ملفات PDF/صور على القرص (لا يحتاج قاعدة بيانات)
- يعمل بدون إنترنت بعد تحميل الكتب على الجهاز
- ثلاث سكربتات فقط: `dev` / `build` / `start`

---

## 🚀 خطوات سريعة

### 1) ثبّت Node.js
حمّل النسخة LTS من https://nodejs.org

### 2) ثبّت الحزم (مرة واحدة فقط)
افتح Terminal/PowerShell داخل مجلد المشروع واكتب:
```bash
npm install
```
هذا يستغرق دقيقة أو اثنتين أول مرة.

### 3) شغّل المعاينة (development)
```bash
npm run dev
```
سيفتح:
- **الواجهة (للتعديل المباشر):** http://localhost:5173
- **السيرفر (API):** http://localhost:3001

عدّل أي ملف في `src/` أو `server/` وستحدّث الصفحة تلقائيًا.

### 4) ابنِ النسخة النهائية
```bash
npm run build
```
سينشئ مجلد `dist/` فيه الواجهة الجاهزة.

### 5) شغّل النسخة النهائية
```bash
npm start
```
- يفتح كل شيء على بورت واحد: http://localhost:3001
- لتغيير البورت: `PORT=8080 npm start` (لينكس/ماك) أو `set PORT=8080 && npm start` (ويندوز)

---

## 🔐 بيانات الأدمن

- **الإيميل:** `admin@app.com`
- **كلمة السر:** `123456`

لتغييرها: عدّل `src/types.ts` (السطرين `ADMIN_EMAIL` و `ADMIN_PASSWORD`) ثم أعد بناء المشروع بـ `npm run build`.

---

## 📂 هيكل المشروع

```
.
├── package.json            # سكربتات التشغيل والمكتبات
├── vite.config.ts          # إعدادات vite
├── tsconfig.json           # إعدادات TypeScript
├── index.html              # نقطة الدخول للواجهة
│
├── src/                    # كود الواجهة (React)
│   ├── main.tsx
│   ├── App.tsx             # الصفحة الرئيسية
│   ├── storage.ts          # كل الاتصالات بالـ API + IndexedDB
│   ├── types.ts            # الأنواع + الإعدادات الافتراضية
│   ├── styles.css          # كل التصميم
│   └── components/
│       ├── BookCard.tsx
│       ├── PdfReader.tsx
│       ├── UploadModal.tsx
│       └── LoginModal.tsx
│
├── server/
│   └── server.mjs          # السيرفر (Express + Multer)
│
├── public/                 # ملفات ثابتة
│   ├── 12.png              # شعار الصليب القبطي
│   ├── favicon.svg
│   └── manifest.webmanifest # ملف PWA لتحويل الموقع لتطبيق
│
├── dist/                   # (يُنشأ تلقائيًا بعد npm run build)
└── data/                   # (يُنشأ تلقائيًا، فيه كل الكتب والصور)
    ├── books.json
    ├── categories.json
    └── uploads/
        ├── pdfs/
        └── covers/
```

---

## 🌐 النشر على الإنترنت (4 خيارات)

### الأسهل: Render.com (مجاني)
1. ارفع المجلد على GitHub.
2. ادخل https://dashboard.render.com → **New** → **Web Service**.
3. اختر الـ repo.
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm start`
6. **Environment Variables:** `PORT=10000`, `DATA_DIR=/var/data`
7. أضف **Persistent Disk:** Mount `/var/data`، حجم 1GB.
8. **Create** → بعد دقايق ستحصل على رابط مباشر.

### Railway.app (~$5/شهر)
1. https://railway.app/new → Deploy from GitHub.
2. أضف Volume على `/data` → اضبط `DATA_DIR=/data`.
3. اضبط `PORT` تلقائيًا.

### VPS (Hetzner/DigitalOcean ~$4/شهر)
```bash
# على السيرفر
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install nodejs git
git clone <your-repo>
cd maktabat-alhan
npm install
npm run build
npm install -g pm2
pm2 start "npm start" --name maktabat
pm2 startup && pm2 save
```
ثم اضبط Nginx + Let's Encrypt SSL.

### استضافة منزلية
شغّل `npm start` على كمبيوتر داخل بيتك ووجّه له دومين عبر [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (مجاني).

---

## 📱 تحويل الموقع لتطبيق أندرويد

بعد أن تنشر الموقع وتحصل على رابط (مثل `https://your-app.com`):

1. ادخل **https://www.pwabuilder.com**
2. الصق الرابط واضغط **Start →**
3. اضغط **Package For Stores** → **Android**
4. املأ:
   - **Package ID:** `com.alhan.library`
   - **App name:** `مكتبة الألحان`
   - **Status bar color:** `#08152E`
   - **Icon URL:** `https://your-app.com/12.png`
5. اضغط **Generate** → نزّل ملف `app-release-signed.apk` → نقّله للهاتف وثبّته.

---

## 🛠 تعديلات شائعة

### تغيير الأقسام الافتراضية
عدّل `src/types.ts`:
```typescript
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "your-id", name: "اسم القسم" },
  // ...
];
```

### تغيير ألوان التصميم
عدّل المتغيرات في أعلى `src/styles.css` (مثل `--gold`, `--bg`, إلخ).

### تغيير الشعار
استبدل `public/12.png` بصورة جديدة بنفس الاسم (يُفضّل 512×512 PNG شفافة).

### تغيير عنوان الموقع
عدّل `<title>` في `index.html`.

### تغيير حد حجم رفع الكتاب (افتراضي 200MB)
عدّل `server/server.mjs`، السطر:
```javascript
limits: { fileSize: 200 * 1024 * 1024 },
```

---

## 💾 نسخ احتياطي

كل شيء داخل مجلد `data/`:
- لأخذ نسخة: انسخ المجلد كله.
- لاستعادة: انسخ المجلد إلى نفس المكان واعد التشغيل.

---

## ❓ مشاكل شائعة

**"Cannot find module" بعد `npm install`**
احذف `node_modules` و `package-lock.json` ثم أعد `npm install`.

**في dev، الـ API يرجع 404**
تأكد إن السيرفر شغّال على البورت 3001 (شوف Terminal). لو غيّرته، عدّل `vite.config.ts` كذلك.

**الصور لا تظهر بعد الرفع**
شوف Terminal للسيرفر، ابحث عن أخطاء في الـ multer. تأكد إن مجلد `data/uploads/covers/` موجود وله صلاحيات كتابة.

**الرفع يفشل مع ملف PDF كبير**
الحد 200MB. لزيادته عدّل `server/server.mjs`.

---

ربنا يعينك ويبارك خدمتك ✚
