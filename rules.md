# WBGL Coding Standards — rules.md

Bu doküman, Web-Based Gaming Library (WBGL) projesinde tüm katkıların uyması gereken kod standartlarını ve mimari kuralları tanımlar.

---

## 1. Dosya Boyutu Limiti

- Her kaynak dosyası **200 satırı geçmemelidir.**
- Veri dosyaları (çeviriler, tema presetleri vb.) **250 satırı geçmemelidir.**
- CSS dosyaları **200 satırı** geçmemelidir; her bölüm kendi dosyasına taşınmalıdır.
- **200 satıra yaklaşıldığında**, dosya anlamlı parçalara bölünmeli ve katkı kabulü reddedilebilir.

## 2. Modülerlik

- Her dosya **tek bir sorumluluğa** (Single Responsibility Principle) sahip olmalıdır.
- Bir component birden fazla UI kaygısını barındırıyorsa alt component'lara bölünmelidir.
- API çağrıları, state mantığı ve UI katmanı **ayrı tutulmalıdır.**
- Backend route'ları mantıksal gruplara bölünerek ayrı router dosyalarına ayrılmalıdır.

## 3. Frontend Component Kuralları

```
frontend/src/
├── App.jsx              ← yalnızca orkestrasyon; max 150 satır
├── main.jsx             ← entry point; max 20 satır
├── hooks/               ← tüm custom hook'lar
├── api/                 ← tüm API çağrıları
├── i18n/                ← çeviri sistemi
│   ├── LocaleContext.jsx
│   ├── translations/
│   │   ├── tr.js        ← Türkçe
│   │   └── en.js        ← İngilizce
│   └── index.js         ← merge & re-export
├── styles/              ← bölünmüş CSS modülleri
│   ├── base.css         ← reset, root variables
│   ├── layout.css       ← main-content, sidebar, topbar
│   ├── cards.css        ← game-card, game-grid
│   ├── modals.css       ← modal-overlay, glass-panel
│   ├── settings.css     ← settings modal specific
│   └── themes.css       ← ps-mode, hero-background
└── components/
    └── [domain]/        ← örn: game/, layout/, settings/
```

- Bir component dosyası **max 200 satır** olmalıdır.
- İç (helper) component'lar aynı dosyada tanımlanabilir, ancak 40 satırı geçmemelidir.
- Inline style'dan mümkün olduğunca kaçınılmalı; CSS sınıfı veya CSS değişkeni (`var(--x)`) tercih edilmelidir.
- Hardcoded renk değerleri (`#fff`, `rgba(0,0,0,...)`) **yasaktır**; her zaman CSS değişkeni kullanılmalıdır.

## 4. Backend Kuralları

```
backend/
├── index.js        ← sadece app setup + listen; max 40 satır
├── routes/
│   ├── games.js    ← /api/games endpoints
│   ├── groups.js   ← /api/groups endpoints
│   ├── config.js   ← /api/config endpoints
│   ├── scan.js     ← /api/scan endpoints
│   ├── sgdb.js     ← /api/steamgrid endpoints
│   └── files.js    ← /api/drives, /api/directory, uploads
├── scanner.js      ← EXE detection logic
├── launcher.js     ← game launching
├── metadata.js     ← SteamGridDB HTTP calls
└── database.js     ← JSON persistence
```

- Her route dosyası **max 150 satır** olmalıdır.
- Route handler'ları iş mantığını doğrudan barındırmamalı; servis katmanına (scanner, metadata vb.) delege etmelidir.
- Tüm endpoint'lerde hata yönetimi (`try/catch`) ve anlamlı HTTP status kodları zorunludur.

## 5. Genel Kod Kalitesi

- `console.log` geliştirme amaçlı debug için kabul edilir; production'da `console.error` / `console.warn` kullanılmalıdır.
- Magic number ve string'lerden kaçınılmalıdır; sabitler (constant) olarak tanımlanmalıdır.
- `var` kullanılmamalıdır; `const` ve gerektiğinde `let` tercih edilmelidir.
- Kullanılmayan importlar, fonksiyonlar ve değişkenler **derhal temizlenmelidir.**

## 6. Git Commit Standartları

Commit mesajları aşağıdaki prefix'leri kullanmalıdır:

| Prefix | Kullanım |
|--------|----------|
| `feat:` | Yeni özellik |
| `fix:` | Hata düzeltme |
| `refactor:` | Davranış değişikliği olmadan kod iyileştirme |
| `style:` | Yalnızca biçimlendirme değişiklikleri |
| `chore:` | Build, CI, bağımlılık güncellemeleri |
| `docs:` | Yalnızca dokümantasyon değişiklikleri |

## 7. İhlal Sınıflandırması

| Seviye | Kural | Eylem |
|--------|-------|-------|
| 🔴 Kritik | Dosya > 300 satır | Hemen bölünmeli |
| 🟡 Önemli | 200–300 satır arası | Bir sonraki PR'da bölünmeli |
| 🔵 Bilgi | Hardcoded renk var | İlgili PR'da düzeltilmeli |
