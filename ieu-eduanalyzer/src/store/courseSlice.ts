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
