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
        ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'NA'], []);

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
                    course.code, course.name, course.credits, course.letterGrade, course.status,
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
        Array.from(new Set(courses.map(course => course.semester))).sort(), [courses]);

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
        editForm.setFieldsValue({ code: course.code, name: course.name, credits: course.credits, semester: course.semester });
        setIsEditModalVisible(true);
    }, [editForm]);

    const handleUpdateCourse = useCallback(() => {
        if (!editingCourse) return;
        editForm.validateFields().then(values => {
            dispatch(updateCourse({
                courseId: editingCourse.id,
                updates: { ...values, letterGrade: editingCourse.letterGrade, status: editingCourse.status },
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
        { title: 'Kod', dataIndex: 'code', key: 'code', width: 120 },
        {
            title: 'Ders Adi', dataIndex: 'name', key: 'name', width: 400,
            render: (name: string) => {
                const truncated = name.length > MAX_COURSE_NAME_LENGTH ? `${name.substring(0, MAX_COURSE_NAME_LENGTH)}...` : name;
                return <Tooltip title={name} placement="topLeft"><span>{truncated}</span></Tooltip>;
            }
        },
        { title: 'AKTS', dataIndex: 'credits', key: 'credits', width: 70 },
        {
            title: 'Harf Notu', dataIndex: 'letterGrade', key: 'letterGrade', width: 120,
            render: (_: LetterGrade | undefined, record: Course) => (
                <Select value={record.letterGrade || 'NA'} onChange={(value: LetterGrade) => handleGradeChange(record.id, value)}
                    className={`!w-20 ${record.letterGrade === 'FF' || record.letterGrade === 'FD' ? 'text-gray-500' : record.letterGrade !== 'NA' ? 'text-green-600 font-semibold' : ''}`}>
                    {letterGrades.map(grade => <Option key={grade} value={grade}>{grade}</Option>)}
                </Select>
            ),
        },
        {
            title: 'Durum', dataIndex: 'status', key: 'status', width: 120,
            render: (_: CourseStatus | undefined, record: Course) => (
                <Select value={record.status || 'ALMIYOR'} onChange={(value: CourseStatus) => handleStatusChange(record.id, value)} className="!w-32">
                    {courseStatuses.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                </Select>
            ),
        },
        {
            title: 'Islemler', key: 'actions', width: 100,
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Ders Ekle</Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>CSV Olarak Indir</Button>
                </Space>
            </div>
            <div className="space-y-10 overflow-x-auto">
                {uniqueSemesters.map(semester => (
                    <div key={semester} className="mb-8">
                        <div className="text-lg font-semibold mb-2 flex justify-between items-center">
                            <div className="text-gray-700 flex items-center">
                                <Tooltip title="Donem ortalamasi"><CompassOutlined className="ml-2 mr-2" /></Tooltip>
                                {semester || 'Donem Belirtilmemis'}
                            </div>
                            <Tag icon={<TrophyOutlined />} color="success">
                                Donem Ortalamasi: {calculateSemesterAverage(courses.filter(c => c.semester === semester))}
                            </Tag>
                        </div>
                        <Table columns={columns} dataSource={courses.filter(c => c.semester === semester)} rowKey="id"
                            className="bg-gray-100 rounded-lg shadow p-1.5" pagination={false} rowHoverable={false} size="small"
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
            <Modal title="Yeni Ders Ekle" open={isModalVisible} onOk={handleAddCourse}
                onCancel={() => { setIsModalVisible(false); form.resetFields(); }} okText="Ekle" cancelText="Iptal">
                <Form form={form} layout="vertical">
                    <Form.Item name="code" label="Ders Kodu" rules={[{ required: true, message: 'Ders kodu gerekli' }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Ders Adi" rules={[{ required: true, message: 'Ders adi gerekli' }]}><Input /></Form.Item>
                    <Form.Item name="credits" label="AKTS" rules={[{ required: true, message: 'AKTS gerekli' }]}><InputNumber min={1} max={30} /></Form.Item>
                    <Form.Item name="semester" label="Donem"><Input placeholder="Ornegin: 1. Sinif Guz" /></Form.Item>
                </Form>
            </Modal>
            <Modal title="Ders Duzenle" open={isEditModalVisible} onOk={handleUpdateCourse}
                onCancel={() => { setIsEditModalVisible(false); setEditingCourse(null); editForm.resetFields(); }} okText="Kaydet" cancelText="Iptal">
                <Form form={editForm} layout="vertical">
                    <Form.Item name="code" label="Ders Kodu" rules={[{ required: true, message: 'Ders kodu gerekli' }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Ders Adi" rules={[{ required: true, message: 'Ders adi gerekli' }]}><Input /></Form.Item>
                    <Form.Item name="credits" label="AKTS" rules={[{ required: true, message: 'AKTS gerekli' }]}><InputNumber min={1} max={30} /></Form.Item>
                    <Form.Item name="semester" label="Donem"><Input /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default React.memo(CourseTable);
