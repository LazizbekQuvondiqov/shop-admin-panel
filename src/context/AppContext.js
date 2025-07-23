// Fayl: frontend/src/context/AppContext.js (AVTOMATIK YANGILANISH TIKLANGAN VA HAMMA UCHUN ISHLAYDI)

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import API from '../components/services/apiCore';

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // --- STATE'LAR ---
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [currentUser, setCurrentUser] = useState(() => {
        try { const user = localStorage.getItem('currentUser'); return user ? JSON.parse(user) : null; }
        catch { return null; }
    });
    const [authLoading, setAuthLoading] = useState(true);
    const isAuthenticated = !!token && !!currentUser;
    const [data, setData] = useState({ shops: [], orders: [], products: [], users: [], categories: [], settings: null });
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- FUNKSIYALAR ---
    const loginUser = useCallback(async (username, password) => {
        try {
            const result = await API.auth.login({ username, password });
            if (result.token && result.user) {
                setToken(result.token);
                setCurrentUser(result.user);
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                return { success: true };
            }
            return { success: false, message: result.message || 'Login yoki parol xato' };
        } catch (err) { return { success: false, message: err.message }; }
    }, []);

    const logoutUser = useCallback(() => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setData({ shops: [], orders: [], products: [], users: [], categories: [], settings: null });
    }, []);

    // fetchData endi `isLoadingSpinnerNeeded` degan parametr qabul qiladi.
    // Bu orqa fonda yangilanganda keraksiz spinner chiqishining oldini oladi.
    const fetchData = useCallback(async (isLoadingSpinnerNeeded = true) => {
        if (!isAuthenticated || !currentUser || !currentUser.role) return;

        if (isLoadingSpinnerNeeded) setDataLoading(true);
        setError(null);

        try {
            if (currentUser.role === 'SUPER_ADMIN') {
                const [shops, users, orders] = await Promise.all([ API.shops.get(), API.users.get(), API.orders.get() ]);
                setData(prev => ({ ...prev, shops, users, orders, products: [], categories: [], settings: null }));
            } else if (currentUser.role === 'SHOP_OWNER') {
                const [orders, products, categories, settings, users] = await Promise.all([ API.orders.get(), API.products.get(), API.categories.get(), API.settings.get(), API.users.get() ]);
                setData(prev => ({ ...prev, orders, products, categories, settings, users, shops: [] }));
            }
        } catch (err) {
            setError(err.message);
            if (String(err.message).includes('401')) logoutUser();
        } finally {
            if (isLoadingSpinnerNeeded) setDataLoading(false);
        }
    }, [isAuthenticated, currentUser, logoutUser]);

    // Birinchi yuklanish uchun
    useEffect(() => {
        setAuthLoading(false);
    }, []);

    // ===== AVTOMATIK YANGILANISH MANTIG'I =====
    useEffect(() => {
        // Agar foydalanuvchi tizimga kirgan bo'lsa...
        if (isAuthenticated) {
            // 1. Darhol bir marta ma'lumotlarni yuklaymiz (yuklanish spinneri bilan)
            fetchData(true);

            // 2. Keyin har 70 soniyada ma'lumotlarni orqa fonda, spinner ko'rsatmasdan yangilab turamiz
            const intervalId = setInterval(() => {
                // console.log(`🔄 Ma'lumotlar (${currentUser.role} uchun) avtomatik yangilanmoqda...`);
                fetchData(false); // `false` parametri spinnerni ko'rsatmaslik uchun
            }, 70000); // 70 soniya

            // 3. Komponent yo'q qilinganda (masalan, tizimdan chiqqanda) intervalni to'xtatamiz
            return () => clearInterval(intervalId);
        }
    }, [isAuthenticated, fetchData, currentUser]); // currentUser bog'liqlikka qo'shildi
    // =========================================================

    // CRUD funksiyalari (o'zgarishsiz)
    const createEntity = useCallback(async (apiFunc, payload, entityName) => {
        const result = await apiFunc(payload);
        await fetchData(false); // Har qanday o'zgarishdan keyin ma'lumotlarni yangilaymiz
        return { success: true, data: result };
    }, [fetchData]);

    const updateEntity = useCallback(async (apiFunc, id, payload, entityName) => {
        const result = await apiFunc(id, payload);
        await fetchData(false);
        return { success: true, data: result };
    }, [fetchData]);

    const removeEntity = useCallback(async (apiFunc, id, entityName) => {
        await apiFunc(id);
        await fetchData(false);
        return { success: true };
    }, [fetchData]);

    // `value` obyekti (o'zgarishsiz)
    const value = useMemo(() => ({
        isAuthenticated, currentUser, isLoading: authLoading || dataLoading, error, ...data,
        loginUser, logoutUser, refetchAll: () => fetchData(true),
        addShop: (payload) => createEntity(API.shops.create, payload, 'shops'),
        updateShop: (id, payload) => updateEntity(API.shops.update, id, payload, 'shops'),
        deleteShop: (id) => removeEntity(API.shops.remove, id, 'shops'),
        addCategory: (payload) => createEntity(API.categories.create, payload, 'categories'),
        updateCategory: (id, payload) => updateEntity(API.categories.update, id, payload, 'categories'),
        deleteCategory: (id) => removeEntity(API.categories.remove, id, 'categories'),
        addProduct: (payload) => createEntity(API.products.create, payload, 'products'),
        updateProduct: (id, payload) => updateEntity(API.products.update, id, payload, 'products'),
        deleteProduct: (id) => removeEntity(API.products.remove, id, 'products'),
        addOrder: (payload) => createEntity(API.orders.create, payload, 'orders'),
        updateOrder: (id, payload) => updateEntity(API.orders.update, id, payload, 'orders'),
        deleteOrder: (id) => removeEntity(API.orders.remove, id, 'orders'),
        updateOrderStatus: (id, payload) => updateEntity(API.orders.updateStatus, id, payload, 'orders'),
        saveSettings: async (newSettings) => {
            try { const updatedSettings = await API.settings.update(newSettings); setData(prev => ({ ...prev, settings: updatedSettings })); return { success: true }; }
            catch (err) { return { success: false, error: err.message }; }
        },
        updatePassword: async (passwords) => {
             try { const result = await API.auth.updatePassword(passwords); return { success: true, message: result.message }; }
             catch (err) { return { success: false, error: err.message }; }
        }
    }), [ isAuthenticated, currentUser, authLoading, dataLoading, error, data, loginUser, logoutUser, fetchData, createEntity, updateEntity, removeEntity ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
