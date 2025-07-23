import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    // 1. MA'LUMOTLARNI CONTEXT'DAN OLISH
    const {
        orders,
        users,
        products,
        isLoading,
        error
    } = useAppContext();

    // 2. STATISTIKALARNI `useMemo` BILAN HISOBLASH (XATOSIZ VERSIYA)
    const stats = useMemo(() => {
        // --- ENG MUHIM O'ZGARISH: Ma'lumotlar kelmaguncha, bo'sh qiymat qaytaramiz ---
        if (isLoading || !orders || !users || !products) {
            return { totalRevenue: 0, pendingOrders: 0, todayOrders: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0, dailyData: [] };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalRevenue = orders
            .filter(o => o.status === 'Yetkazildi')
            .reduce((sum, o) => sum + o.totalSum, 0);

        const pendingOrders = orders.filter(o => o.status === 'Yangi' || o.status === "To'lov tekshirilmoqda").length;
        const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;

        // Oxirgi 7 kunlik statistika (grafik uchun)
        const dailyData = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' });
            return { name: dayStr, Buyurtmalar: 0, Daromad: 0 };
        }).reverse();

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const diffDays = Math.floor((new Date(today) - new Date(orderDate.setHours(0,0,0,0))) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                const dayIndex = 6 - diffDays;
                if(dailyData[dayIndex]) {
                    dailyData[dayIndex].Buyurtmalar += 1;
                    if (order.status === 'Yetkazildi') {
                        dailyData[dayIndex].Daromad += order.totalSum;
                    }
                }
            }
        });

        return {
            totalRevenue,
            pendingOrders,
            todayOrders,
            totalOrders: orders.length,
            totalUsers: users.length,
            totalProducts: products.length,
            dailyData
        };
    }, [isLoading, orders, users, products]); // `isLoading` bog'liqlikka qo'shildi

    // So'nggi 5 ta buyurtmani olish
    const recentOrders = useMemo(() => {
        if (isLoading || !orders) return [];
        return [...orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }, [isLoading, orders]);

    // Yordamchi funksiyalar
    const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount || 0) + ' so\'m';
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

    // --- RENDER QISMI ---

    // Agar ma'lumotlar yuklanayotgan bo'lsa, yuklanish ekranini ko'rsatamiz
    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div>
                <p className="mt-3">Yuklanmoqda...</p>
            </div>
        );
    }

    // Agar xatolik bo'lsa, xato xabarini ko'rsatamiz
    if (error) {
        return <div className="alert alert-danger mx-4">Xatolik: {error}</div>;
    }

    const statCards = [
        { title: "Jami Daromad", value: formatCurrency(stats.totalRevenue), icon: "fa-wallet", color: "success" },
        { title: "Kutilayotgan Buyurtmalar", value: stats.pendingOrders, icon: "fa-hourglass-half", color: "warning" },
        { title: "Bugungi Buyurtmalar", value: stats.todayOrders, icon: "fa-calendar-day", color: "info" },
        { title: "Jami Buyurtmalar", value: stats.totalOrders, icon: "fa-shopping-cart", color: "primary" },
        { title: "Jami Mijozlar", value: stats.totalUsers, icon: "fa-users", color: "secondary" },
        { title: "Jami Mahsulotlar", value: stats.totalProducts, icon: "fa-box-open", color: "dark" },
    ];

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Boshqaruv Paneli</h1>

            {/* Statistika Kartalari */}
            <div className="row g-4 mb-4">
                {statCards.map(card => (
                    <div key={card.title} className="col-xl-4 col-md-6">
                        <div className={`stat-card-new shadow-sm h-100 card-bg-${card.color}`}>
                            <div className="stat-card-body">
                                <div className="stat-value">{card.value}</div>
                                <div className="stat-title">{card.title}</div>
                            </div>
                            <div className="stat-icon-bg"><i className={`fas ${card.icon}`}></i></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grafik */}
            <div className="card shadow-sm mb-4">
                <div className="card-header"><h5 className="mb-0"><i className="fas fa-chart-line me-2"></i>Oxirgi 7 kunlik statistika</h5></div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip formatter={(value, name) => name === 'Daromad' ? formatCurrency(value) : value} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="Buyurtmalar" stroke="#8884d8" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="Daromad" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* So'nggi buyurtmalar va Tezkor harakatlar */}
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><i className="fas fa-history me-2"></i>So'nggi Buyurtmalar</h5>
                            <Link to="/orders" className="btn btn-sm btn-outline-primary">Barchasini ko'rish <i className="fas fa-arrow-right ms-1"></i></Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead><tr><th>Mijoz</th><th>Summa</th><th>Holati</th><th>Vaqt</th></tr></thead>
                                <tbody>
                                    {recentOrders.length > 0 ? recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td><div className="fw-bold">{order.userName || 'Noma\'lum'}</div><small className="text-muted">ID: {order.id?.slice(-6)}</small></td>
                                            <td className="fw-bold">{formatCurrency(order.totalSum)}</td>
                                            <td><span className={`badge status-badge status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></td>
                                            <td>{formatDate(order.createdAt)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center py-4">Hozircha buyurtmalar yo'q.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header"><h5 className="mb-0"><i className="fas fa-bolt me-2"></i>Tezkor Harakatlar</h5></div>
                        <div className="list-group list-group-flush">
                            <Link to="/orders" className="list-group-item list-group-item-action"><i className="fas fa-shopping-cart fa-fw me-2 text-primary"></i>Buyurtmalarni Boshqarish</Link>
                            <Link to="/products/new" className="list-group-item list-group-item-action"><i className="fas fa-plus fa-fw me-2 text-success"></i>Yangi Mahsulot Qo'shish</Link>
                            <Link to="/categories" className="list-group-item list-group-item-action"><i className="fas fa-tags fa-fw me-2 text-warning"></i>Kategoriyalarni Sozlash</Link>
                            <Link to="/settings" className="list-group-item list-group-item-action"><i className="fas fa-cog fa-fw me-2 text-secondary"></i>Asosiy Sozlamalar</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
