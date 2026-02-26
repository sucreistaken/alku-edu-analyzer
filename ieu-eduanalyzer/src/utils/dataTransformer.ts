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
    })).sort((a, b) => b.name.localeCompare(a.name, 'tr'));
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
