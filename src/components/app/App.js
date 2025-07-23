// Fayl: frontend/src/components/app/App.js (SUPER ADMIN MARSHRUTLARI TUZATILGAN)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { useAppContext } from '../../context/AppContext';

// Komponentlarni import qilish
import Dashboard from '../dashboard/Dashboard';
import Orders from '../order/Orders';
import Products from '../product/Products';
import ProductForm from '../product/ProductForm';
import Users from '../user/Users';
import Categories from '../category/Categories';
import Settings from '../settings/Settings';
import Login from '../auth/login';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
import Shops from '../shop/Shops';

// --- ProtectedRoute (o'zgarishsiz) ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAppContext();

    if (isLoading) { // Endi `isLoading` ni ishlatamiz (authLoading va dataLoading ni birlashtiradi)
        return (
            <div className="loader-container">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// --- Super Admin uchun marshrutlar (YANGILANDI) ---
const SuperAdminRoutes = () => (
    <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shops" element={<Shops />} />
        {/* ===== ASOSIY O'ZGARISH ===== */}
        {/* Endi bu sahifalar uchun to'g'ri komponentlarni ko'rsatamiz */}
        <Route path="/all-orders" element={<Orders />} />
        <Route path="/all-users" element={<Users />} />
        {/* ============================= */}
        {/* Super Adminga tegishli bo'lmagan yo'llar */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

// --- Do'kon Egasi uchun marshrutlar (o'zgarishsiz) ---
const ShopOwnerRoutes = () => (
    <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/edit/:id" element={<ProductForm />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        {/* Do'kon egasiga tegishli bo'lmagan yo'llar */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

// --- Asosiy Layout (o'zgarishsiz) ---
const AppLayout = () => {
    const { logoutUser, currentUser } = useAppContext();
    if (!currentUser) return null;
    return (
        <div className="app">
            <Sidebar />
            <div className="content-container">
                <Header onLogout={logoutUser} />
                <main className="main-content">
                    {currentUser.role === 'SUPER_ADMIN' ? <SuperAdminRoutes /> : <ShopOwnerRoutes />}
                </main>
            </div>
        </div>
    );
};

// --- Asosiy App Komponenti (o'zgarishsiz) ---
const App = () => {
    const { isAuthenticated } = useAppContext();
    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> : <Login />}
                />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;
