// Fayl: frontend/src/components/sidebar/Sidebar.js (ROLGA ASOSLANGAN YANGI VERSIYA)

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

const Sidebar = () => {
    const { settings, currentUser } = useAppContext();

    // Agar `currentUser` hali yuklanmagan bo'lsa, hech narsa ko'rsatmaymiz
    if (!currentUser) {
        return <aside className="sidebar"></aside>;
    }

    // Rolga qarab menyu va sarlavhani aniqlaymiz
    let navItems = [];
    let panelTitle = 'Admin Panel';
    const isAdmin = currentUser.role === 'SUPER_ADMIN';

    if (isAdmin) {
        // --- SUPER ADMIN UCHUN MENYU ---
        panelTitle = 'Platforma Boshqaruvi';
        navItems = [
            { to: "/", icon: "fa-tachometer-alt", label: "Dashboard" },
            { to: "/shops", icon: "fa-store", label: "Do'konlar" },
            { to: "/all-orders", icon: "fa-globe-asia", label: "Barcha Buyurtmalar" },
            { to: "/all-users", icon: "fa-users-cog", label: "Barcha Mijozlar" },
        ];
    } else {
        // --- DO'KON EGASI UCHUN MENYU ---
        panelTitle = settings?.storeName || 'Do\'kon Boshqaruvi';
        navItems = [
            { to: "/", icon: "fa-tachometer-alt", label: "Dashboard" },
            { to: "/orders", icon: "fa-shopping-cart", label: "Buyurtmalar" },
            { to: "/products", icon: "fa-boxes", label: "Mahsulotlar" },
            { to: "/categories", icon: "fa-tags", label: "Kategoriyalar" },
            { to: "/users", icon: "fa-users", label: "Mijozlar" },
            { to: "/settings", icon: "fa-cog", label: "Sozlamalar" }
        ];
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="store-title">{panelTitle}</div>
                <div className="admin-info">
                    <i className={`fas ${isAdmin ? 'fa-user-shield' : 'fa-user-cog'} me-2`}></i>
                    <span className="admin-username">{currentUser.username}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {navItems.map(item => (
                        <li key={item.to}>
                            <NavLink to={item.to} end={item.to === "/"}>
                                <i className={`fas ${item.icon} me-2 nav-icon`}></i>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
