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
                const courses = getCourses(selectedFaculty, selectedDepartment, selectedProgram, selectedCurriculum);
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
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
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
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
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
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
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
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
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
