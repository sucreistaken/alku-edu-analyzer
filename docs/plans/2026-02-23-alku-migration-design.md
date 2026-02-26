# ALKU EduAnalyzer Migration Design

## Overview

IEU EduAnalyzer projesini ALKU (Alanya Alaaddin Keykubat Universitesi) icin revize ediyoruz.

## Temel Kararlar

- **Hiyerarsi:** Tam 4 seviye secim (Fakulte > Bolum > Program > Mufredat)
- **Firebase:** Tamamen kaldirilacak
- **Veri saklama:** localStorage
- **Auth:** Kaldirilacak, direkt erisim
- **Dil:** Tamamen Turkce arayuz

## Mimari

### Veri Katmani

`tum_dersler.json` 5 seviyeli nested JSON:

```
fakulteId -> { ad, bolumler }
  bolumId -> { ad, programlar }
    programId -> { ad, mufredatlar }
      mufredatId -> { ad, dersler[] }
        { kod, ad, t_u, kredi, akts, tur }
```

Yeni `src/utils/dataTransformer.ts` dosyasi:
- `getFaculties()` -> Fakulte listesi
- `getDepartments(facultyId)` -> Bolum listesi
- `getPrograms(facultyId, deptId)` -> Program listesi
- `getCurricula(facultyId, deptId, programId)` -> Mufredat listesi
- `getCourses(...)` -> Course[] formatinda dersler

### Firebase -> localStorage

Kaldirilan dosyalar:
- `src/firebase.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/Auth.tsx`
- `src/store/middleware/firebaseSync.ts`
- `src/services/departmentService.ts`

Yeni dosyalar:
- `src/services/localStorageService.ts` - CRUD islemleri
- `src/store/middleware/localStorageSync.ts` - Redux middleware

localStorage key yapisi:
- `alku_departments` - Kaydedilen bolum/program secimler
- `alku_courses_{key}` - Her secim icin ders verileri

### Bilesen Degisiklikleri

**FacultyDepartmentSelector.tsx:**
- 4 cascading dropdown: Fakulte -> Bolum -> Program -> Mufredat
- Her secim bir sonrakini filtreler

**App.tsx:**
- Auth bileşenleri kaldirilir
- Direkt ana ekran gosterilir
- Tum metinler Turkce

**CourseTable.tsx:**
- Kolon basliklari Turkce (Kod, Ders Adi, Kredi, Not, Durum, Islemler)
- Butonlar Turkce
- Yeni kolon: Tur (Z/S)

**CourseStats.tsx:**
- Tum istatistik etiketleri Turkce

### Type Guncellemeleri

```typescript
interface Course {
  id: string
  code: string        // kod
  name: string        // ad
  credits: number     // akts
  letterGrade: LetterGrade
  status: CourseStatus
  semester: string    // mufredat adından turetilecek
  type?: string       // Z/S
  theoryPractice?: string  // t_u
}
```

### Redux Store

`courseSlice.ts` guncellenir:
- faculty/department yerine: facultyId, departmentId, programId, curriculumId
- Middleware localStorage'a yazar
- Stats hesaplama mantigi ayni kalir

### Branding

- "IEU EduAnalyzer" -> "ALKU EduAnalyzer" (index.html, App.tsx)
- package.json name guncellenir
