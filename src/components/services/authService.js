// frontend/src/services/authService.js
import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import API from './apiCore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ilova ochilganda tokenni tekshiramiz
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('currentUser');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setCurrentUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Auth state'ni o'qishda xatolik, tozalash:", e);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    const loginUser = useCallback(async (username, password) => {
        try {
            const result = await API.login({ username, password });
            if (result.success && result.user && result.token) {
                // Token va user ma'lumotlarini saqlaymiz
                setToken(result.token);
                setCurrentUser(result.user);
                setIsAuthenticated(true);
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                return { success: true };
            }
            // Backend'dan kelgan xatolikni qaytarish
            return { success: false, message: result.message || 'Login yoki parol xato' };
        } catch (err) {
            return { success: false, message: err.message || 'Serverga ulanishda noma\'lum xato.' };
        }
    }, []);

    const logoutUser = useCallback(() => {
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberedUsername');
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, token, loading, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
