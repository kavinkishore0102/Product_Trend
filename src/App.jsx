import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './layouts/DashboardLayout';
import AsinResearch from './pages/AsinResearch';
import TrendHistory from './pages/TrendHistory';
import KeywordResearch from './pages/KeywordResearch';
import ReverseAsin from './pages/ReverseAsin';
import ProductScore from './pages/ProductScore';
import DashboardHome from './pages/DashboardHome';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="research" element={<AsinResearch />} />
                    <Route path="trends" element={<TrendHistory />} />
                    <Route path="keywords" element={<KeywordResearch />} />
                    <Route path="cerebro" element={<ReverseAsin />} />
                    <Route path="score" element={<ProductScore />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
