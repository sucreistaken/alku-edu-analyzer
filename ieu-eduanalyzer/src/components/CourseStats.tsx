import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import {
    TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined, HourglassOutlined,
    BookOutlined, CheckSquareOutlined, ExceptionOutlined, PercentageOutlined
} from '@ant-design/icons';

const CourseStats: React.FC = () => {
    const { stats } = useSelector((state: RootState) => state.course);

    const statItems = useMemo(() => [
        { title: 'GNO', value: stats.gpa, precision: 2, icon: <TrophyOutlined />, color: '#3f8600', tooltip: 'Genel Not Ortalamasi' },
        { title: 'Toplam AKTS', value: stats.totalCredits, icon: <BookOutlined />, tooltip: 'Toplam AKTS kredisi' },
        { title: 'Tamamlanan AKTS', value: stats.completedCredits, icon: <CheckSquareOutlined />, color: '#3f8600', tooltip: 'Basariyla tamamlanan AKTS kredisi' },
        { title: 'Kalan AKTS', value: stats.totalCredits - stats.completedCredits, icon: <ExceptionOutlined />, color: '#faad14', tooltip: 'Mezuniyet icin kalan AKTS kredisi' },
        { title: 'Gecen Dersler', value: stats.passedCourses, icon: <CheckCircleOutlined />, color: '#3f8600', tooltip: 'Basariyla tamamlanan ders sayisi' },
        { title: 'Kalan Dersler', value: stats.failedCourses, icon: <CloseCircleOutlined />, color: '#cf1322', tooltip: 'Basarisiz olunan ders sayisi' },
        { title: 'Alinan Dersler', value: stats.activeCourses, icon: <HourglassOutlined />, color: '#096dd9', tooltip: 'Su anda alinan ders sayisi' },
        { title: 'Alinmamis Dersler', value: stats.remainingCourses, icon: <ExceptionOutlined />, color: '#eb2f96', tooltip: 'Henuz alinmamis ders sayisi' },
        {
            title: 'Basari Orani',
            value: stats.passedCourses + stats.failedCourses > 0 ? ((stats.passedCourses / (stats.passedCourses + stats.failedCourses)) * 100) : 0,
            precision: 1, suffix: '%', icon: <PercentageOutlined />, color: '#1890ff', tooltip: 'Basariyla tamamlanan derslerin yuzdesi'
        },
    ], [stats]);

    return (
        <Row gutter={[16, 16]}>
            {statItems.map((item, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                    <Tooltip title={item.tooltip}>
                        <Card className="text-center shadow hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center mb-2">
                                <span className="text-xl" style={{ color: item.color }}>{item.icon}</span>
                            </div>
                            <Statistic title={<span>{item.title}</span>} value={item.value} precision={item.precision}
                                suffix={item.suffix} valueStyle={{ color: item.color, fontSize: '24px' }} />
                        </Card>
                    </Tooltip>
                </Col>
            ))}
        </Row>
    );
};

export default React.memo(CourseStats);
