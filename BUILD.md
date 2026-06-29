# 🏗️ بناء تطبيق دفتر المحاسب الذكي

## طريقة البناء باستخدام CodeMagic:

1. ارفع المشروع إلى GitHub
2. سجل في [CodeMagic](https://codemagic.io)
3. اضف المشروع من GitHub
4. اختر `codemagic.yaml` من إعدادات البناء
5. اضغط "Start build"

## طريقة البناء يدوياً:

```bash
chmod +x build.sh
./build.sh
cat > BUILD.md << 'EOF'
# 🔮 تعليمات البناء باستخدام CodeMagic

## 🚀 خطوات الإعداد:

### 1. التسجيل في CodeMagic
- اذهب إلى https://codemagic.io
- سجل الدخول بحساب GitHub/GitLab/Bitbucket

### 2. ربط المشروع
- اضغط "Add Application"
- اختر المستودع الخاص بك
- اختر نوع المشروع: React Native (Expo)

### 3. إعداد المتغيرات السرية
في إعدادات المشروع في CodeMagic، أضف:

#### للأندرويد:
- `KEYSTORE_FILE` (base64 encoded)
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`
- `GOOGLE_PLAY_JSON_KEY`

#### للـ iOS:
- `APP_STORE_CONNECT_KEY`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APPLE_DEVELOPER_TEAM_ID`

### 4. تشغيل البناء
- اختر workflow من القائمة
- اضغط "Start new build"
- اختر الفرع (branch)
- اضغط "Start build"

## ⏱️ مدة البناء التقريبية:
- Android APK: 10-15 دقيقة
- Android AAB: 15-20 دقيقة
- iOS: 20-30 دقيقة
- Web: 5-8 دقائق

## 📦 المخرجات:
- Android: APK/AAB جاهز للتحميل
- iOS: IPA جاهز للتثبيت
- Web: ملفات موقع جاهزة للنشر

## 🔄 التحديث التلقائي:
يمكن إعداد Trigger للبناء التلقائي عند:
- Push إلى فرع معين
- Pull Request
- Tag جديد
