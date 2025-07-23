// frontend/src/components/header/Header.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

const Header = ({ onLogout }) => {
    const { orders, settings, isLoading, error, updateOrder, currentUser } = useAppContext();
    const navigate = useNavigate();

    // Bildirishnomalar uchun state
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
    const notificationRef = useRef(null);

    // Profil uchun state
    const [profileImage, setProfileImage] = useState(() => localStorage.getItem('adminProfileImage') || null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);
    const fileInputRef = useRef(null);

    // Bildirishnomalar ro'yxatini yangilash logikasi
    useEffect(() => {
        if (orders) {
            const unreadOrders = orders.filter(order => !order.read);
            const notificationsList = unreadOrders.map(order => ({
                id: `order-${order.id}`,
                title: "Yangi Buyurtma",
                message: `${order.userId?.name || 'Noma\'lum mijoz'}dan buyurtma`,
                dateObject: new Date(order.createdAt),
                entityId: order.id,
                link: '/orders'
            })).sort((a, b) => new Date(b.dateObject) - new Date(a.dateObject));
            setNotifications(notificationsList);
        }
    }, [orders]);

    const getTimeAgo = useCallback((dateString) => {
        if (!dateString) return 'Noma\'lum';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 5) return "Hozirgina";
        if (diffInSeconds < 60) return `${diffInSeconds} son. oldin`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} daq. oldin`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} soat oldin`;
        return date.toLocaleDateString('uz-UZ');
    }, []);

    // Tashqarida bosishni aniqlash uchun useEffect
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Bildirishnoma bilan ishlash funksiyalari
    const handleNotificationClick = (notification) => {
        navigate(notification.link);
        setShowNotifications(false);
        markOneAsRead(new Event('click'), notification.entityId);
    };
    const markOneAsRead = useCallback(async (event, notificationId) => {
        event.stopPropagation();
        setNotifications(prev => prev.filter(n => n.entityId !== notificationId));
        await updateOrder(notificationId, { read: true });
    }, [updateOrder]);
    const markAllAsRead = useCallback(async () => {
        if (notifications.length === 0) return;
        setIsMarkingAsRead(true);
        const unreadOrderIds = notifications.map(n => n.entityId);
        setNotifications([]);
        try {
            await Promise.all(unreadOrderIds.map(id => updateOrder(id, { read: true })));
        } catch (e) { console.error("Barchasini o'qishda xato:", e); }
        finally { setIsMarkingAsRead(false); }
    }, [notifications, updateOrder]);

    // Profil rasmi bilan ishlash funksiyalari
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => { setProfileImage(e.target.result); localStorage.setItem('adminProfileImage', e.target.result); };
            reader.readAsDataURL(file);
        }
        setShowProfileMenu(false);
    };
    const removeProfileImage = () => {
        setProfileImage(null);
        localStorage.removeItem('adminProfileImage');
        setShowProfileMenu(false);
    };

    return (
        <header className="header">
            <div className="header-title"><h1><b>{settings?.storeName || 'Admin Panel'}</b></h1></div>
            <div className="header-actions">
                <div className="notification-container" ref={notificationRef}>
                    <button className={`notification-bell ${notifications.length > 0 ? 'has-notifications' : ''}`} onClick={() => setShowNotifications(p => !p)} disabled={isLoading}>
                        <i className="far fa-bell"></i>
                        {notifications.length > 0 && <span className="notification-badge">{notifications.length > 99 ? '99+' : notifications.length}</span>}
                    </button>
                    {/* <<< BU BLOK OLDINGI JAVOBDA QOLIB KETGAN EDI, ENDI TO'LIQ >>> */}
                    {showNotifications && (
                         <div className="notification-dropdown">
                            <div className="notification-header">
                                <h3>Bildirishnomalar</h3>
                                {notifications.length > 0 && <button className="mark-all-read" onClick={markAllAsRead} disabled={isMarkingAsRead}>{isMarkingAsRead ? 'O\'qilmoqda...' : 'Barchasini o\'qish'}</button>}
                            </div>
                            <div className="notification-list custom-scrollbar">
                                {isLoading && !orders.length ? (
                                    <div className="notification-item text-center py-3"><div className="spinner-border spinner-border-sm"></div></div>
                                ) : error ? (
                                    <div className="notification-item text-center py-3 text-danger"><i className="fas fa-exclamation-triangle"></i><p className="mt-2">{error}</p></div>
                                ) : notifications.length === 0 ? (
                                    <div className="no-notifications"><i className="far fa-bell-slash fa-2x text-muted"></i><p className="mt-2 text-muted">Yangi bildirishnomalar yo'q</p></div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="notification-item-wrapper">
                                            <div className="notification-item" onClick={() => handleNotificationClick(notification)}>
                                                <div className="notification-content">
                                                    <h5 className="notification-title">{notification.title}</h5>
                                                    <p className="notification-message text-truncate">{notification.message}</p>
                                                    <span className="notification-time">{getTimeAgo(notification.dateObject)}</span>
                                                </div>
                                            </div>
                                            <button className="mark-one-read-btn" title="O'qildi deb belgilash" onClick={(e) => markOneAsRead(e, notification.entityId)}>
                                                <i className="fas fa-check-circle"></i>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="admin-profile-container" ref={profileRef}>
                    <div className="admin-profile" onClick={() => setShowProfileMenu(p => !p)}>
                        {profileImage ? (<img src={profileImage} alt="Admin" className="profile-image" />) : (<div className="profile-placeholder"><i className="fas fa-user-circle"></i></div>)}
                        <span className="admin-username-header">{currentUser?.username}</span>
                        <i className={`fas fa-chevron-down profile-arrow ${showProfileMenu ? 'open' : ''}`}></i>
                    </div>
                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="profile-menu-item" onClick={() => fileInputRef.current?.click()}><i className="fas fa-camera"></i><span>Rasm tanlash</span></div>
                            {profileImage && (<div className="profile-menu-item" onClick={removeProfileImage}><i className="fas fa-trash-alt"></i><span>Rasmni o'chirish</span></div>)}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>

                <button className="btn btn-logout" onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Chiqish</button>
            </div>
        </header>
    );
};

export default Header;
