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
    type?: string;
    theoryPractice?: string;
}

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

export interface SelectionKey {
    facultyId: string;
    departmentId: string;
    programId: string;
    curriculumId: string;
}

export interface DepartmentData {
    selectionKey: SelectionKey;
    label: string;
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
