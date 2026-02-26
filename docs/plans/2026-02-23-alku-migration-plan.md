# ALKU EduAnalyzer Migration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate IEU EduAnalyzer to ALKU EduAnalyzer - replace IEU course data with ALKU's tum_dersler.json, remove Firebase/Auth, use localStorage, translate UI to Turkish.

**Architecture:** Adapter pattern - new dataTransformer utility converts ALKU's 5-level nested JSON to internal Course[] format. Firebase removed entirely, replaced with localStorage middleware. Auth removed, app loads directly. 4-step cascading selector (Fakulte > Bolum > Program > Mufredat).

**Tech Stack:** React 18, TypeScript, Redux Toolkit, Ant Design, Tailwind CSS, Vite, localStorage

---

### Task 1: Move tum_dersler.json into src/data and remove old data

**Files:**
- Move: `ieu-eduanalyzer/tum_dersler.json` -> `ieu-eduanalyzer/src/data/tum_dersler.json`
- Delete: `ieu-eduanalyzer/src/data/departments.json`

**Step 1: Move data file**

```bash
mv ieu-eduanalyzer/tum_dersler.json ieu-eduanalyzer/src/data/tum_dersler.json
```

**Step 2: Delete old IEU data file**

```bash
rm ieu-eduanalyzer/src/data/departments.json
```

---

### Task 2: Update types for ALKU data model

**Files:**
- Modify: `ieu-eduanalyzer/src/types/index.ts`
- Delete: `ieu-eduanalyzer/src/types/department.ts`

**Step 1: Rewrite types/index.ts**

Replace entire content of `src/types/index.ts` with:

```typescript
export type LetterGrade = 'AA' | 'BA' | 'BB' | 'CB' | 'CC' | 'DC' | 'DD' | 'FD' | 'FF' | 'NA';

export type CourseStatus = 'ALIYOR' | 'ALMIYOR';

export interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    letterGrade: LetterGrade;
    status: CourseStatus;
    semester: string;
    type?: string;        // Z=Zorunlu, S=Secmeli
    theoryPractice?: string; // e.g. "3+1"
}

// Raw ALKU JSON types
export interface AlkuCourse {
    kod: string;
    ad: string;
    t_u: string;
    kredi: string;
    akts: string;
    tur: string;
}

export interface AlkuCurriculum {
    ad: string;
    dersler: AlkuCourse[];
}

export interface AlkuProgram {
    ad: string;
    mufredatlar: Record<string, AlkuCurriculum>;
}

export interface AlkuDepartment {
    ad: string;
    programlar: Record<string, AlkuProgram>;
}

export interface AlkuFaculty {
    ad: string;
    bolumler: Record<string, AlkuDepartment>;
}

export type AlkuData = Record<string, AlkuFaculty>;

// Selection state
export interface SelectionKey {
    facultyId: string;
    departmentId: string;
    programId: string;
    curriculumId: string;
}

export interface DepartmentData {
    selectionKey: SelectionKey;
    label: string;  // Display name: "Fakulte - Bolum - Program"
    courses: Course[];
}

export interface RootState {
    course: {
        currentSelection: SelectionKey | null;
        courses: Course[];
        departments: DepartmentData[];
        stats: {
            totalCredits: number;
            completedCredits: number;
            gpa: number;
            activeCourses: number;
            passedCourses: number;
            failedCourses: number;
            remainingCourses: number;
        };
    };
}
```

**Step 2: Delete types/department.ts**

```bash
rm ieu-eduanalyzer/src/types/department.ts
```

---

### Task 3: Create data transformer utility

**Files:**
- Create: `ieu-eduanalyzer/src/utils/dataTransformer.ts`

**Step 1: Create the transformer file**

```typescript
import alkuData from '../data/tum_dersler.json';
import { AlkuData, AlkuCourse, Course } from '../types';
import { v4 as uuidv4 } from 'uuid';

const data = alkuData as unknown as AlkuData;

export interface SelectOption {
    id: string;
    name: string;
}

export const getFaculties = (): SelectOption[] => {
    return Object.entries(data).map(([id, faculty]) => ({
        id,
        name: faculty.ad,
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
};

export const getDepartments = (facultyId: string): SelectOption[] => {
    const faculty = data[facultyId];
    if (!faculty) return [];
    return Object.entries(faculty.bolumler).map(([id, dept]) => ({
        id,
        name: dept.ad,
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
};

export const getPrograms = (facultyId: string, departmentId: string): SelectOption[] => {
    const dept = data[facultyId]?.bolumler[departmentId];
    if (!dept) return [];
    return Object.entries(dept.programlar).map(([id, prog]) => ({
        id,
        name: prog.ad,
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
};

export const getCurricula = (facultyId: string, departmentId: string, programId: string): SelectOption[] => {
    const prog = data[facultyId]?.bolumler[departmentId]?.programlar[programId];
    if (!prog) return [];
    return Object.entries(prog.mufredatlar).map(([id, curr]) => ({
        id,
        name: curr.ad,
    })).sort((a, b) => b.name.localeCompare(a.name, 'tr')); // newest first
};

const transformCourse = (raw: AlkuCourse): Course => ({
    id: uuidv4(),
    code: raw.kod,
    name: raw.ad,
    credits: parseInt(raw.akts, 10) || 0,
    letterGrade: 'NA',
    status: 'ALMIYOR',
    semester: '',
    type: raw.tur,
    theoryPractice: raw.t_u,
});

export const getCourses = (
    facultyId: string,
    departmentId: string,
    programId: string,
    curriculumId: string
): Course[] => {
    const curr = data[facultyId]?.bolumler[departmentId]?.programlar[programId]?.mufredatlar[curriculumId];
    if (!curr) return [];
    return curr.dersler.map(transformCourse);
};

export const getSelectionLabel = (
    facultyId: string,
    departmentId: string,
    programId: string
): string => {
    const faculty = data[facultyId]?.ad || '';
    const dept = data[facultyId]?.bolumler[departmentId]?.ad || '';
    const prog = data[facultyId]?.bolumler[departmentId]?.programlar[programId]?.ad || '';
    return `${faculty} - ${dept} - ${prog}`;
};
```

---

### Task 4: Create localStorage service and middleware

**Files:**
- Create: `ieu-eduanalyzer/src/services/localStorageService.ts`
- Create: `ieu-eduanalyzer/src/store/middleware/localStorageSync.ts`
- Delete: `ieu-eduanalyzer/src/store/middleware/firebaseSync.ts`
- Delete: `ieu-eduanalyzer/src/services/departmentService.ts`

**Step 1: Create localStorage service**

Create `src/services/localStorageService.ts`:

```typescript
const STORAGE_KEY = 'alku_edu_state';

export const saveState = (state: unknown): void => {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
        console.error('localStorage kaydetme hatasi:', err);
    }
};

export const loadState = (): unknown | undefined => {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized === null) return undefined;
        return JSON.parse(serialized);
    } catch (err) {
        console.error('localStorage okuma hatasi:', err);
        return undefined;
    }
};

export const clearState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('localStorage temizleme hatasi:', err);
    }
};
```

**Step 2: Create localStorage sync middleware**

Create `src/store/middleware/localStorageSync.ts`:

```typescript
import { Middleware } from '@reduxjs/toolkit';
import { saveState } from '../../services/localStorageService';

export const localStorageSyncMiddleware: Middleware = store => next => action => {
    const result = next(action);
    const state = store.getState();
    saveState(state.course);
    return result;
};
```

**Step 3: Delete old Firebase files**

```bash
rm ieu-eduanalyzer/src/store/middleware/firebaseSync.ts
rm ieu-eduanalyzer/src/services/departmentService.ts
rm ieu-eduanalyzer/src/firebase.ts
rm ieu-eduanalyzer/src/contexts/AuthContext.tsx
rm ieu-eduanalyzer/src/contexts/DepartmentContext.tsx
rm ieu-eduanalyzer/src/components/Auth.tsx
```

---

### Task 5: Rewrite Redux store (courseSlice)

**Files:**
- Modify: `ieu-eduanalyzer/src/store/courseSlice.ts`
- Modify: `ieu-eduanalyzer/src/store/index.ts`

**Step 1: Rewrite courseSlice.ts**

Replace entire content of `src/store/courseSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Course, LetterGrade, SelectionKey, DepartmentData } from '../types';

interface CourseState {
    currentSelection: SelectionKey | null;
    courses: Course[];
    departments: DepartmentData[];
    stats: {
        totalCredits: number;
        completedCredits: number;
        gpa: number;
        activeCourses: number;
        passedCourses: number;
        failedCourses: number;
        remainingCourses: number;
    };
}

const calculateGPA = (courses: Course[]): number => {
    const gradePoints: Record<LetterGrade, number> = {
        'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5,
        'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FD': 0.5,
        'FF': 0.0, 'NA': 0.0
    };

    const completedCourses = courses.filter(c => c.letterGrade !== 'NA');
    if (completedCourses.length === 0) return 0;

    const totalPoints = completedCourses.reduce((sum, c) =>
        sum + (gradePoints[c.letterGrade] * c.credits), 0);
    const totalCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
};

const computeStats = (courses: Course[]) => {
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const completedCourses = courses.filter(c => c.letterGrade !== 'NA');
    const completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    const gpa = calculateGPA(courses);
    const activeCourses = courses.filter(c => c.status === 'ALIYOR').length;
    const passedCourses = completedCourses.filter(c =>
        c.letterGrade !== 'FF' && c.letterGrade !== 'FD' && c.status !== 'ALIYOR'
    ).length;
    const failedCourses = completedCourses.filter(c =>
        (c.letterGrade === 'FF' || c.letterGrade === 'FD') && c.status !== 'ALIYOR'
    ).length;
    const remainingCourses = courses.filter(c =>
        c.status !== 'ALIYOR' && c.letterGrade === 'NA'
    ).length;

    return { totalCredits, completedCredits, gpa, activeCourses, passedCourses, failedCourses, remainingCourses };
};

const selectionKeysMatch = (a: SelectionKey, b: SelectionKey): boolean =>
    a.facultyId === b.facultyId &&
    a.departmentId === b.departmentId &&
    a.programId === b.programId &&
    a.curriculumId === b.curriculumId;

const initialState: CourseState = {
    currentSelection: null,
    courses: [],
    departments: [],
    stats: {
        totalCredits: 0, completedCredits: 0, gpa: 0,
        activeCourses: 0, passedCourses: 0, failedCourses: 0, remainingCourses: 0
    }
};

const courseSlice = createSlice({
    name: 'course',
    initialState,
    reducers: {
        setState: (_state, action) => {
            return { ...initialState, ...action.payload };
        },
        setSelection: (state, action: PayloadAction<{
            selectionKey: SelectionKey;
            label: string;
            courses: Course[];
        }>) => {
            const { selectionKey, label, courses } = action.payload;
            const existingIdx = state.departments.findIndex(d =>
                selectionKeysMatch(d.selectionKey, selectionKey)
            );

            if (existingIdx === -1) {
                state.departments.push({ selectionKey, label, courses });
                state.currentSelection = selectionKey;
                state.courses = courses;
            } else {
                state.currentSelection = selectionKey;
                state.courses = state.departments[existingIdx].courses;
            }
            state.stats = computeStats(state.courses);
        },
        switchSelection: (state, action: PayloadAction<SelectionKey>) => {
            const dept = state.departments.find(d =>
                selectionKeysMatch(d.selectionKey, action.payload)
            );
            if (dept) {
                state.currentSelection = action.payload;
                state.courses = dept.courses;
                state.stats = computeStats(state.courses);
            }
        },
        updateCourse: (state, action: PayloadAction<{
            courseId: string;
            updates: Partial<Course>;
        }>) => {
            const idx = state.courses.findIndex(c => c.id === action.payload.courseId);
            if (idx !== -1) {
                state.courses[idx] = { ...state.courses[idx], ...action.payload.updates };

                // Sync to departments array
                if (state.currentSelection) {
                    const deptIdx = state.departments.findIndex(d =>
                        selectionKeysMatch(d.selectionKey, state.currentSelection!)
                    );
                    if (deptIdx !== -1) {
                        const cIdx = state.departments[deptIdx].courses.findIndex(
                            c => c.id === action.payload.courseId
                        );
                        if (cIdx !== -1) {
                            state.departments[deptIdx].courses[cIdx] = state.courses[idx];
                        }
                    }
                }
                state.stats = computeStats(state.courses);
            }
        },
        addCourse: (state, action: PayloadAction<Course>) => {
            state.courses.push(action.payload);

            if (state.currentSelection) {
                const deptIdx = state.departments.findIndex(d =>
                    selectionKeysMatch(d.selectionKey, state.currentSelection!)
                );
                if (deptIdx !== -1) {
                    state.departments[deptIdx].courses.push(action.payload);
                }
            }
            state.stats = computeStats(state.courses);
        },
        deleteCourse: (state, action: PayloadAction<string>) => {
            state.courses = state.courses.filter(c => c.id !== action.payload);

            if (state.currentSelection) {
                const deptIdx = state.departments.findIndex(d =>
                    selectionKeysMatch(d.selectionKey, state.currentSelection!)
                );
                if (deptIdx !== -1) {
                    state.departments[deptIdx].courses =
                        state.departments[deptIdx].courses.filter(c => c.id !== action.payload);
                }
            }
            state.stats = computeStats(state.courses);
        },
        removeSelection: (state, action: PayloadAction<SelectionKey>) => {
            state.departments = state.departments.filter(d =>
                !selectionKeysMatch(d.selectionKey, action.payload)
            );
            if (state.currentSelection && selectionKeysMatch(state.currentSelection, action.payload)) {
                state.currentSelection = null;
                state.courses = [];
                state.stats = computeStats([]);
            }
        },
        calculateStats: (state) => {
            state.stats = computeStats(state.courses);
        }
    }
});

export const {
    setState,
    setSelection,
    switchSelection,
    updateCourse,
    addCourse,
    deleteCourse,
    removeSelection,
    calculateStats,
} = courseSlice.actions;

export default courseSlice.reducer;
```

**Step 2: Rewrite store/index.ts**

Replace entire content of `src/store/index.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './courseSlice';
import { localStorageSyncMiddleware } from './middleware/localStorageSync';

export const store = configureStore({
    reducer: {
        course: courseReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(localStorageSyncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

### Task 6: Rewrite FacultyDepartmentSelector for ALKU

**Files:**
- Modify: `ieu-eduanalyzer/src/components/FacultyDepartmentSelector.tsx`

**Step 1: Rewrite the component**

Replace entire content of `src/components/FacultyDepartmentSelector.tsx`:

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Select, Card, Row, Col, Tag, Space, Modal, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setSelection, switchSelection, removeSelection } from '../store/courseSlice';
import { SelectionKey, RootState, DepartmentData } from '../types';
import {
    getFaculties,
    getDepartments,
    getPrograms,
    getCurricula,
    getCourses,
    getSelectionLabel,
} from '../utils/dataTransformer';

const { Option } = Select;

const FacultyDepartmentSelector: React.FC = () => {
    const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [selectedCurriculum, setSelectedCurriculum] = useState<string | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentData | null>(null);

    const dispatch = useDispatch();
    const { departments, currentSelection } = useSelector((state: RootState) => state.course);

    const faculties = useMemo(() => getFaculties(), []);

    const departmentOptions = useMemo(() => {
        if (!selectedFaculty) return [];
        return getDepartments(selectedFaculty);
    }, [selectedFaculty]);

    const programOptions = useMemo(() => {
        if (!selectedFaculty || !selectedDepartment) return [];
        return getPrograms(selectedFaculty, selectedDepartment);
    }, [selectedFaculty, selectedDepartment]);

    const curriculumOptions = useMemo(() => {
        if (!selectedFaculty || !selectedDepartment || !selectedProgram) return [];
        return getCurricula(selectedFaculty, selectedDepartment, selectedProgram);
    }, [selectedFaculty, selectedDepartment, selectedProgram]);

    useEffect(() => {
        if (selectedFaculty && selectedDepartment && selectedProgram && selectedCurriculum) {
            const selectionKey: SelectionKey = {
                facultyId: selectedFaculty,
                departmentId: selectedDepartment,
                programId: selectedProgram,
                curriculumId: selectedCurriculum,
            };

            const alreadyExists = departments.some(d =>
                d.selectionKey.facultyId === selectionKey.facultyId &&
                d.selectionKey.departmentId === selectionKey.departmentId &&
                d.selectionKey.programId === selectionKey.programId &&
                d.selectionKey.curriculumId === selectionKey.curriculumId
            );

            if (!alreadyExists) {
                const courses = getCourses(
                    selectedFaculty,
                    selectedDepartment,
                    selectedProgram,
                    selectedCurriculum
                );
                const label = getSelectionLabel(selectedFaculty, selectedDepartment, selectedProgram);
                dispatch(setSelection({ selectionKey, label, courses }));
            }
        }
    }, [selectedFaculty, selectedDepartment, selectedProgram, selectedCurriculum, dispatch, departments]);

    const handleFacultyChange = (value: string) => {
        setSelectedFaculty(value);
        setSelectedDepartment(null);
        setSelectedProgram(null);
        setSelectedCurriculum(null);
    };

    const handleDepartmentChange = (value: string) => {
        setSelectedDepartment(value);
        setSelectedProgram(null);
        setSelectedCurriculum(null);
    };

    const handleProgramChange = (value: string) => {
        setSelectedProgram(value);
        setSelectedCurriculum(null);
    };

    const handleCurriculumChange = (value: string) => {
        setSelectedCurriculum(value);
    };

    const handleTagClick = (dept: DepartmentData) => {
        dispatch(switchSelection(dept.selectionKey));
    };

    const handleDeleteDepartment = (dept: DepartmentData) => {
        setDepartmentToDelete(dept);
    };

    const confirmDelete = () => {
        if (!departmentToDelete) return;
        dispatch(removeSelection(departmentToDelete.selectionKey));
        message.success('Program basariyla silindi');
        setDepartmentToDelete(null);
    };

    const isActiveSelection = (dept: DepartmentData): boolean => {
        if (!currentSelection) return false;
        return (
            dept.selectionKey.facultyId === currentSelection.facultyId &&
            dept.selectionKey.departmentId === currentSelection.departmentId &&
            dept.selectionKey.programId === currentSelection.programId &&
            dept.selectionKey.curriculumId === currentSelection.curriculumId
        );
    };

    return (
        <div className="space-y-4">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="Fakulte Secimi" className="h-full shadow">
                        <Select
                            showSearch
                            placeholder="Fakulte seciniz"
                            style={{ width: '100%' }}
                            value={selectedFaculty}
                            onChange={handleFacultyChange}
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    ?.toLowerCase()
                                    .includes(input.toLowerCase()) ?? false
                            }
                        >
                            {faculties.map(f => (
                                <Option key={f.id} value={f.id}>{f.name}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Bolum Secimi" className="h-full shadow">
                        <Select
                            showSearch
                            placeholder="Bolum seciniz"
                            style={{ width: '100%' }}
                            value={selectedDepartment}
                            onChange={handleDepartmentChange}
                            disabled={!selectedFaculty}
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    ?.toLowerCase()
                                    .includes(input.toLowerCase()) ?? false
                            }
                        >
                            {departmentOptions.map(d => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="Program Secimi" className="h-full shadow">
                        <Select
                            showSearch
                            placeholder="Program seciniz"
                            style={{ width: '100%' }}
                            value={selectedProgram}
                            onChange={handleProgramChange}
                            disabled={!selectedDepartment}
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    ?.toLowerCase()
                                    .includes(input.toLowerCase()) ?? false
                            }
                        >
                            {programOptions.map(p => (
                                <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Mufredat Secimi" className="h-full shadow">
                        <Select
                            showSearch
                            placeholder="Mufredat seciniz"
                            style={{ width: '100%' }}
                            value={selectedCurriculum}
                            onChange={handleCurriculumChange}
                            disabled={!selectedProgram}
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    ?.toLowerCase()
                                    .includes(input.toLowerCase()) ?? false
                            }
                        >
                            {curriculumOptions.map(c => (
                                <Option key={c.id} value={c.id}>{c.name}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>
            </Row>

            {departments.length > 0 && (
                <Card title="Eklenen Programlar" className="mt-4 overflow-x-auto shadow">
                    <Space size={[0, 8]} wrap>
                        {departments.map((dept) => (
                            <Tag
                                key={`${dept.selectionKey.facultyId}-${dept.selectionKey.programId}-${dept.selectionKey.curriculumId}`}
                                color={isActiveSelection(dept) ? 'blue' : 'default'}
                                style={{ padding: '8px', margin: '4px', cursor: 'pointer' }}
                                onClick={() => handleTagClick(dept)}
                                closable
                                onClose={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteDepartment(dept);
                                }}
                            >
                                {dept.label}
                            </Tag>
                        ))}
                    </Space>
                </Card>
            )}

            <Modal
                title="Program Silme Onayi"
                open={departmentToDelete !== null}
                onOk={confirmDelete}
                onCancel={() => setDepartmentToDelete(null)}
                okText="Sil"
                cancelText="Iptal"
                okButtonProps={{ danger: true }}
            >
                <p>
                    {departmentToDelete && `"${departmentToDelete.label}" programini silmek istediginizden emin misiniz? Bu islem geri alinamaz.`}
                </p>
            </Modal>
        </div>
    );
};

export default FacultyDepartmentSelector;
```

---

### Task 7: Rewrite App.tsx - Remove auth, Turkish UI

**Files:**
- Modify: `ieu-eduanalyzer/src/App.tsx`

**Step 1: Rewrite App.tsx**

Replace entire content of `src/App.tsx`:

```tsx
import React, { useEffect } from 'react';
import { Layout, Typography, Card } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store';
import { setState } from './store/courseSlice';
import { loadState } from './services/localStorageService';
import FacultyDepartmentSelector from './components/FacultyDepartmentSelector';
import CourseTable from './components/CourseTable';
import CourseStats from './components/CourseStats';
import { BarChartOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppContent: React.FC = () => {
    useEffect(() => {
        const savedState = loadState();
        if (savedState) {
            store.dispatch(setState(savedState));
        }
    }, []);

    return (
        <Layout className="min-h-screen">
            <Header className="shadow flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                    <BarChartOutlined style={{ fontSize: '24px', marginRight: '10px' }} />
                    <Title level={3} className="py-4 m-3">
                        ALKU EduAnalyzer
                    </Title>
                </div>
            </Header>
            <Content className="p-6 bg-[#F0F2F5]">
                <div className="max-w-5xl flex flex-col justify-center mx-auto space-y-5">
                    <Card title="Program Secimi" className="shadow">
                        <FacultyDepartmentSelector />
                    </Card>
                    <Card title="Ders Istatistikleri" className="shadow">
                        <CourseStats />
                    </Card>
                    <Card title="Ders Yonetimi" className="shadow">
                        <CourseTable />
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
};

export default App;
```

---

### Task 8: Update CourseTable - Turkish UI, remove auth/firebase refs

**Files:**
- Modify: `ieu-eduanalyzer/src/components/CourseTable.tsx`

**Step 1: Rewrite CourseTable.tsx**

Replace entire content of `src/components/CourseTable.tsx`:

```tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Table, Select, Button, Space, Modal, Form, InputNumber, Input, message, Tooltip, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Course, LetterGrade, CourseStatus, RootState } from '../types';
import { updateCourse, addCourse, calculateStats, deleteCourse } from '../store/courseSlice';
import { PlusOutlined, DownloadOutlined, DeleteOutlined, EditOutlined, TrophyOutlined, CompassOutlined } from '@ant-design/icons';

const { Option } = Select;

const CourseTable: React.FC = () => {
    const dispatch = useDispatch();
    const { courses } = useSelector((state: RootState) => state.course);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const letterGrades: LetterGrade[] = useMemo(() =>
        ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'NA'],
        []
    );

    const courseStatuses: { value: CourseStatus; label: string }[] = useMemo(() => [
        { value: 'ALIYOR', label: 'Aliyor' },
        { value: 'ALMIYOR', label: 'Almiyor' },
    ], []);

    const handleGradeChange = useCallback((courseId: string, letterGrade: LetterGrade) => {
        dispatch(updateCourse({ courseId, updates: { letterGrade } }));
        dispatch(calculateStats());
    }, [dispatch]);

    const handleStatusChange = useCallback((courseId: string, status: CourseStatus) => {
        dispatch(updateCourse({ courseId, updates: { status } }));
        dispatch(calculateStats());
    }, [dispatch]);

    const handleDeleteCourse = useCallback((courseId: string) => {
        Modal.confirm({
            title: 'Ders Sil',
            content: 'Bu dersi silmek istediginizden emin misiniz?',
            okText: 'Evet',
            cancelText: 'Hayir',
            onOk: () => {
                dispatch(deleteCourse(courseId));
                dispatch(calculateStats());
                message.success('Ders basariyla silindi');
            }
        });
    }, [dispatch]);

    const handleAddCourse = useCallback(() => {
        form.validateFields().then(values => {
            const newCourse: Course = {
                id: Date.now().toString(),
                code: values.code,
                name: values.name,
                credits: values.credits,
                semester: values.semester || '',
                letterGrade: 'NA',
                status: 'ALMIYOR'
            };
            dispatch(addCourse(newCourse));
            dispatch(calculateStats());
            setIsModalVisible(false);
            form.resetFields();
            message.success('Ders basariyla eklendi');
        });
    }, [dispatch, form]);

    const handleExport = useCallback(() => {
        try {
            const csvContent = [
                ['Kod', 'Ders Adi', 'Kredi', 'Not', 'Durum'],
                ...courses.map(course => [
                    course.code,
                    course.name,
                    course.credits,
                    course.letterGrade,
                    course.status,
                ])
            ].map(row => row.join(';')).join('\n');

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'dersler.csv';
            link.click();
            message.success('Dersler basariyla disari aktarildi');
        } catch {
            message.error('Disari aktarma sirasinda hata olustu');
        }
    }, [courses]);

    const uniqueSemesters = useMemo(() =>
        Array.from(new Set(courses.map(course => course.semester))).sort(),
        [courses]
    );

    const calculateSemesterAverage = useCallback((semesterCourses: Course[]) => {
        const gradePoints: Record<LetterGrade, number> = {
            'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5,
            'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FD': 0.5, 'FF': 0.0, 'NA': 0.0
        };

        const completedCourses = semesterCourses.filter(c => c.letterGrade !== 'NA');
        if (completedCourses.length === 0) return 0;

        const totalPoints = completedCourses.reduce((sum, c) =>
            sum + (gradePoints[c.letterGrade] * (c.credits || 0)), 0);
        const totalCredits = completedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
        return totalCredits > 0 ? Number(totalPoints / totalCredits).toFixed(2) : 0;
    }, []);

    const handleEditCourse = useCallback((course: Course) => {
        setEditingCourse(course);
        editForm.setFieldsValue({
            code: course.code,
            name: course.name,
            credits: course.credits,
            semester: course.semester,
        });
        setIsEditModalVisible(true);
    }, [editForm]);

    const handleUpdateCourse = useCallback(() => {
        if (!editingCourse) return;
        editForm.validateFields().then(values => {
            dispatch(updateCourse({
                courseId: editingCourse.id,
                updates: {
                    ...values,
                    letterGrade: editingCourse.letterGrade,
                    status: editingCourse.status
                },
            }));
            dispatch(calculateStats());
            setIsEditModalVisible(false);
            setEditingCourse(null);
            editForm.resetFields();
            message.success('Ders basariyla guncellendi');
        });
    }, [dispatch, editForm, editingCourse]);

    const MAX_COURSE_NAME_LENGTH = 50;

    const columns = useMemo(() => [
        {
            title: 'Kod',
            dataIndex: 'code',
            key: 'code',
            width: 120,
        },
        {
            title: 'Ders Adi',
            dataIndex: 'name',
            key: 'name',
            width: 400,
            render: (name: string) => {
                const truncated = name.length > MAX_COURSE_NAME_LENGTH
                    ? `${name.substring(0, MAX_COURSE_NAME_LENGTH)}...`
                    : name;
                return (
                    <Tooltip title={name} placement="topLeft">
                        <span>{truncated}</span>
                    </Tooltip>
                );
            }
        },
        {
            title: 'AKTS',
            dataIndex: 'credits',
            key: 'credits',
            width: 70,
        },
        {
            title: 'Harf Notu',
            dataIndex: 'letterGrade',
            key: 'letterGrade',
            width: 120,
            render: (_: LetterGrade | undefined, record: Course) => (
                <Select
                    value={record.letterGrade || 'NA'}
                    onChange={(value: LetterGrade) => handleGradeChange(record.id, value)}
                    className={`!w-20 ${record.letterGrade === 'FF' || record.letterGrade === 'FD'
                        ? 'text-gray-500'
                        : record.letterGrade !== 'NA'
                            ? 'text-green-600 font-semibold'
                            : ''
                        }`}
                >
                    {letterGrades.map(grade => (
                        <Option key={grade} value={grade}>{grade}</Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (_: CourseStatus | undefined, record: Course) => (
                <Select
                    value={record.status || 'ALMIYOR'}
                    onChange={(value: CourseStatus) => handleStatusChange(record.id, value)}
                    className="!w-32"
                >
                    {courseStatuses.map(s => (
                        <Option key={s.value} value={s.value}>{s.label}</Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Islemler',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: Course) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditCourse(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCourse(record.id)} />
                </Space>
            ),
        }
    ], [letterGrades, courseStatuses, handleGradeChange, handleStatusChange, handleDeleteCourse, handleEditCourse]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Ders Ekle
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        CSV Olarak Indir
                    </Button>
                </Space>
            </div>

            <div className="space-y-10 overflow-x-auto">
                {uniqueSemesters.map(semester => (
                    <div key={semester} className="mb-8">
                        <div className="text-lg font-semibold mb-2 flex justify-between items-center">
                            <div className="text-gray-700 flex items-center">
                                <Tooltip title="Donem ortalamasi">
                                    <CompassOutlined className="ml-2 mr-2" />
                                </Tooltip>
                                {semester || 'Donem Belirtilmemis'}
                            </div>
                            <Tag icon={<TrophyOutlined />} color="success">
                                Donem Ortalamasi: {calculateSemesterAverage(courses.filter(c => c.semester === semester))}
                            </Tag>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={courses.filter(c => c.semester === semester)}
                            rowKey="id"
                            className="bg-gray-100 rounded-lg shadow p-1.5"
                            pagination={false}
                            rowHoverable={false}
                            size="small"
                            rowClassName={(record) => {
                                if (record.status === 'ALIYOR') return 'bg-orange-200';
                                if (record.letterGrade === 'FF' || record.letterGrade === 'FD') return 'bg-red-200';
                                if (record.letterGrade !== 'NA') return 'bg-green-100';
                                return '';
                            }}
                        />
                    </div>
                ))}
            </div>

            <Modal
                title="Yeni Ders Ekle"
                open={isModalVisible}
                onOk={handleAddCourse}
                onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
                okText="Ekle"
                cancelText="Iptal"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="code" label="Ders Kodu" rules={[{ required: true, message: 'Ders kodu gerekli' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="Ders Adi" rules={[{ required: true, message: 'Ders adi gerekli' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="credits" label="AKTS" rules={[{ required: true, message: 'AKTS gerekli' }]}>
                        <InputNumber min={1} max={30} />
                    </Form.Item>
                    <Form.Item name="semester" label="Donem">
                        <Input placeholder="Ornegin: 1. Sinif Guz" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Ders Duzenle"
                open={isEditModalVisible}
                onOk={handleUpdateCourse}
                onCancel={() => { setIsEditModalVisible(false); setEditingCourse(null); editForm.resetFields(); }}
                okText="Kaydet"
                cancelText="Iptal"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="code" label="Ders Kodu" rules={[{ required: true, message: 'Ders kodu gerekli' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="Ders Adi" rules={[{ required: true, message: 'Ders adi gerekli' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="credits" label="AKTS" rules={[{ required: true, message: 'AKTS gerekli' }]}>
                        <InputNumber min={1} max={30} />
                    </Form.Item>
                    <Form.Item name="semester" label="Donem">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default React.memo(CourseTable);
```

---

### Task 9: Update CourseStats - Turkish labels

**Files:**
- Modify: `ieu-eduanalyzer/src/components/CourseStats.tsx`

**Step 1: Rewrite CourseStats.tsx**

Replace entire content of `src/components/CourseStats.tsx`:

```tsx
import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import {
    TrophyOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    HourglassOutlined,
    BookOutlined,
    CheckSquareOutlined,
    ExceptionOutlined,
    PercentageOutlined
} from '@ant-design/icons';

const CourseStats: React.FC = () => {
    const { stats } = useSelector((state: RootState) => state.course);

    const statItems = useMemo(() => [
        {
            title: 'GNO',
            value: stats.gpa,
            precision: 2,
            icon: <TrophyOutlined />,
            color: '#3f8600',
            tooltip: 'Genel Not Ortalamasi'
        },
        {
            title: 'Toplam AKTS',
            value: stats.totalCredits,
            icon: <BookOutlined />,
            tooltip: 'Toplam AKTS kredisi'
        },
        {
            title: 'Tamamlanan AKTS',
            value: stats.completedCredits,
            icon: <CheckSquareOutlined />,
            color: '#3f8600',
            tooltip: 'Basariyla tamamlanan AKTS kredisi'
        },
        {
            title: 'Kalan AKTS',
            value: stats.totalCredits - stats.completedCredits,
            icon: <ExceptionOutlined />,
            color: '#faad14',
            tooltip: 'Mezuniyet icin kalan AKTS kredisi'
        },
        {
            title: 'Gecen Dersler',
            value: stats.passedCourses,
            icon: <CheckCircleOutlined />,
            color: '#3f8600',
            tooltip: 'Basariyla tamamlanan ders sayisi'
        },
        {
            title: 'Kalan Dersler',
            value: stats.failedCourses,
            icon: <CloseCircleOutlined />,
            color: '#cf1322',
            tooltip: 'Basarisiz olunan ders sayisi'
        },
        {
            title: 'Alinan Dersler',
            value: stats.activeCourses,
            icon: <HourglassOutlined />,
            color: '#096dd9',
            tooltip: 'Su anda alinan ders sayisi'
        },
        {
            title: 'Alinmamis Dersler',
            value: stats.remainingCourses,
            icon: <ExceptionOutlined />,
            color: '#eb2f96',
            tooltip: 'Henuz alinmamis ders sayisi'
        },
        {
            title: 'Basari Orani',
            value: stats.passedCourses + stats.failedCourses > 0
                ? ((stats.passedCourses / (stats.passedCourses + stats.failedCourses)) * 100)
                : 0,
            precision: 1,
            suffix: '%',
            icon: <PercentageOutlined />,
            color: '#1890ff',
            tooltip: 'Basariyla tamamlanan derslerin yuzdesi'
        },
    ], [stats]);

    return (
        <Row gutter={[16, 16]}>
            {statItems.map((item, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                    <Tooltip title={item.tooltip}>
                        <Card className="text-center shadow hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center mb-2">
                                <span className="text-xl" style={{ color: item.color }}>
                                    {item.icon}
                                </span>
                            </div>
                            <Statistic
                                title={<span>{item.title}</span>}
                                value={item.value}
                                precision={item.precision}
                                suffix={item.suffix}
                                valueStyle={{ color: item.color, fontSize: '24px' }}
                            />
                        </Card>
                    </Tooltip>
                </Col>
            ))}
        </Row>
    );
};

export default React.memo(CourseStats);
```

---

### Task 10: Update branding and config files

**Files:**
- Modify: `ieu-eduanalyzer/index.html` (line 8)
- Modify: `ieu-eduanalyzer/package.json` (line 2)
- Modify: `ieu-eduanalyzer/src/main.tsx`

**Step 1: Update index.html title**

Change line 8 from:
```html
<title>IEU EduAnalyzer</title>
```
To:
```html
<title>ALKU EduAnalyzer</title>
```

**Step 2: Update package.json name**

Change line 2 from:
```json
"name": "ieu-eduanalyzer",
```
To:
```json
"name": "alku-eduanalyzer",
```

**Step 3: Simplify main.tsx**

Keep main.tsx as-is (it doesn't reference IEU or Firebase). No changes needed.

---

### Task 11: Remove Firebase dependency and clean up

**Files:**
- Modify: `ieu-eduanalyzer/package.json`

**Step 1: Uninstall firebase**

```bash
cd ieu-eduanalyzer && npm uninstall firebase
```

**Step 2: Remove .env file if it exists**

```bash
rm -f ieu-eduanalyzer/.env ieu-eduanalyzer/.env.local
```

**Step 3: Delete contexts directory (now empty)**

```bash
rm -rf ieu-eduanalyzer/src/contexts
```

---

### Task 12: Build and verify

**Step 1: Install dependencies**

```bash
cd ieu-eduanalyzer && npm install
```

**Step 2: Build to check for TypeScript errors**

```bash
cd ieu-eduanalyzer && npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Start dev server and verify**

```bash
cd ieu-eduanalyzer && npm run dev
```

Expected: App loads at localhost, shows "ALKU EduAnalyzer" header, faculty dropdown populated with ALKU faculties.

---

## Task Dependency Order

```
Task 1 (move data) -> Task 2 (types) -> Task 3 (transformer) -> Task 4 (localStorage) -> Task 5 (redux) -> Task 6 (selector) -> Task 7 (App) -> Task 8 (CourseTable) -> Task 9 (CourseStats) -> Task 10 (branding) -> Task 11 (cleanup) -> Task 12 (build & verify)
```

All tasks are sequential - each builds on the previous.
