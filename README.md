# ALKU EduAnalyzer

Alanya Alaaddin Keykubat Universitesi (ALKU) ogrencileri icin gelistirilmis ders takip ve analiz uygulamasi. Fakulte, bolum, program ve mufredat secimi yaparak derslerinizi yonetebilir, not girisi yapabilir ve akademik istatistiklerinizi gorebilirsiniz.

## Ozellikler

- **Program Secimi**: Fakulte, bolum, program ve mufredat bazinda hiyerarsik secim
- **Birden Fazla Program Destegi**: Ayni anda birden fazla programi ekleyip aralarinda gecis yapabilme
- **Ders Yonetimi**: Ders ekleme, duzenleme, silme ve harf notu girisi
- **GNO Hesaplama**: Otomatik genel not ortalamasi ve donem ortalamasi hesaplama
- **Istatistikler**: Toplam AKTS, tamamlanan AKTS, gecen/kalan ders sayisi, basari orani
- **CSV Disari Aktarma**: Ders listesini CSV formatinda indirme
- **Yerel Depolama**: Veriler tarayicida otomatik olarak saklanir

## Teknolojiler

- **React 18** + **TypeScript**
- **Vite** - Build araci
- **Redux Toolkit** - State yonetimi
- **Ant Design** - UI bilesen kutuphanesi
- **Tailwind CSS** - Stil yonetimi

## Kurulum

```bash
cd alku-edu-analyzer
npm install
npm run dev
```

Uygulama varsayilan olarak `http://localhost:5173` adresinde calisir.

## Build

```bash
npm run build
```

## Proje Yapisi

```
alku-edu-analyzer/
├── src/
│   ├── components/
│   │   ├── CourseStats.tsx        # Istatistik kartlari
│   │   ├── CourseTable.tsx        # Ders tablosu ve yonetimi
│   │   └── FacultyDepartmentSelector.tsx  # Program secici
│   ├── store/
│   │   └── courseSlice.ts         # Redux state yonetimi
│   ├── services/
│   │   └── localStorageService.ts # Yerel depolama servisi
│   ├── data/
│   │   └── tum_dersler.json       # ALKU mufredat verileri
│   ├── types/
│   │   └── index.ts               # TypeScript tip tanimlari
│   ├── utils/
│   │   └── dataTransformer.ts     # Veri donusturucu
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```
