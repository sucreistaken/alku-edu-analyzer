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
