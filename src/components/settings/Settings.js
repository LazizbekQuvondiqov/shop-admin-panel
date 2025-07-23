// frontend/src/components/settings/Settings.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Settings.css';

const Settings = () => {
    const { settings: initialSettings, saveSettings, updatePassword, isLoading: contextLoading } = useAppContext();

    // Do'kon sozlamalari uchun state
    const [settings, setSettings] = useState({ storeName: '', storePhone: '', storeAddress: '', storeLocation: '', currencySymbol: 'so\'m', karta: '', kartaEgasi: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    // Parol o'zgartirish uchun state
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Umumiy bildirishnoma (toast) uchun state
    const [toast, setToast] = useState({ show: false, message: '', status: '' });

    useEffect(() => {
        if (initialSettings) {
            setSettings({
                id: initialSettings.id || null,
                storeName: initialSettings.storeName || '',
                storePhone: initialSettings.storePhone || '',
                storeAddress: initialSettings.storeAddress || '',
                storeLocation: initialSettings.storeLocation || '',
                currencySymbol: initialSettings.currencySymbol || 'so\'m',
                karta: initialSettings.karta || '',
                kartaEgasi: initialSettings.kartaEgasi || ''
            });
        }
    }, [initialSettings]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ show: false, message: '', status: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = useCallback((message, status = 'success') => {
        setToast({ show: true, message, status });
    }, []);

    const extractCoordsFromUrl = (url) => { if (!url || typeof url !== 'string') return ''; const regex1 = /[?&](q|ll)=([\d.-]+),([\d.-]+)/; const match1 = url.match(regex1); if (match1?.[2] && match1?.[3]) return `${parseFloat(match1[2])}, ${parseFloat(match1[3])}`; const regex2 = /@(-?[\d.]+),(-?[\d.]+)/; const match2 = url.match(regex2); if (match2?.[1] && match2?.[2]) return `${parseFloat(match2[1])}, ${parseFloat(match2[2])}`; return ''; };

    // <<< O'ZGARISH: Bu funksiyalar endi ishlatiladi >>>
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setSettings(prev => {
            const newSettings = { ...prev, [name]: value };
            if (name === 'storeAddress') {
                newSettings.storeLocation = extractCoordsFromUrl(value);
            }
            return newSettings;
        });
    }, []);

    const handleCardNumberChange = useCallback((e) => {
        const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
        setSettings(prev => ({ ...prev, karta: formatted }));
    }, []);

    const handleSaveSettings = useCallback(async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        const result = await saveSettings(settings);
        if (result.success) { showToast('Do\'kon sozlamalari saqlandi!', 'success'); }
        else { showToast(`Xatolik: ${result.error}`, 'error'); }
        setSavingSettings(false);
    }, [settings, saveSettings, showToast]);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
        if (passwordError) setPasswordError('');
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (passwords.newPassword.length < 6) { setPasswordError("Yangi parol kamida 6 belgi bo'lishi kerak."); return; }
        if (passwords.newPassword !== passwords.confirmPassword) { setPasswordError("Yangi parollar mos kelmadi."); return; }

        setSavingPassword(true);
        const result = await updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
        if (result.success) {
            showToast(result.message, 'success');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            setPasswordError(result.error);
        }
        setSavingPassword(false);
    };

    if (contextLoading && !initialSettings) { return <div className="loader-container"><div className="spinner-border text-primary"></div><p>Sozlamalar yuklanmoqda...</p></div>; }

    return (
        <div className="settings-container">
            {toast.show && (<div className={`toast-notification show ${toast.status}`}><div className="toast-content">{toast.message}</div></div>)}
            <div className="settings-header mb-4"><h1 className="h2"><i className="fas fa-cog me-2"></i>Sozlamalar</h1><p className="text-muted">Do'kon ma'lumotlari va admin parolini boshqarish</p></div>

            <form onSubmit={handleSaveSettings}>
                <div className="card mb-4 shadow-sm">
                    <div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-store me-2"></i>Do'kon Ma'lumotlari</h5></div>
                    <div className="card-body p-4">
                        <div className="row g-3 mb-3">
                            <div className="col-md-6"><label htmlFor="storeName" className="form-label">Do'kon nomi *</label><input type="text" id="storeName" name="storeName" className="form-control" value={settings.storeName} onChange={handleInputChange} required /></div>
                            <div className="col-md-6"><label htmlFor="storePhone" className="form-label">Do'kon telefoni *</label><input type="text" id="storePhone" name="storePhone" className="form-control" value={settings.storePhone} onChange={handleInputChange} required /></div>
                        </div>
                        <div className="mb-3"><label htmlFor="storeAddress" className="form-label">Do'kon manzili (Google Maps havolasi) *</label><textarea id="storeAddress" name="storeAddress" className="form-control" value={settings.storeAddress} onChange={handleInputChange} rows="2" required placeholder="https://maps.google.com/..."/></div>
                        <div className="mb-3"><label htmlFor="storeLocation" className="form-label">Joylashuv (koordinatalar)</label><input type="text" id="storeLocation" name="storeLocation" className="form-control bg-light" value={settings.storeLocation} readOnly placeholder="Avtomatik to'ldiriladi"/></div>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6"><label htmlFor="karta" className="form-label">Karta raqami</label><input type="text" id="karta" name="karta" className="form-control" placeholder="0000 0000 0000 0000" value={settings.karta} onChange={handleCardNumberChange} maxLength="19"/></div>
                            <div className="col-md-6"><label htmlFor="kartaEgasi" className="form-label">Karta egasi (Ism Familiya)</label><input type="text" id="kartaEgasi" name="kartaEgasi" className="form-control" placeholder="Lazizbek Quvondiqov" value={settings.kartaEgasi} onChange={handleInputChange} /></div>
                            <div className="col-md-6"><label htmlFor="currencySymbol" className="form-label">Valyuta belgisi</label><select id="currencySymbol" name="currencySymbol" className="form-select" value={settings.currencySymbol} onChange={handleInputChange}><option value="so'm">so'm</option><option value="$">$</option></select></div>
                        </div>
                        <div className="d-flex justify-content-end">
                            {/* <<< O'ZGARISH: Bu tugma endi 'savingSettings' ni ishlatadi >>> */}
                            <button type="submit" className="btn btn-primary px-4" disabled={savingSettings}>{savingSettings ? (<><span className="spinner-border spinner-border-sm me-2"></span>Saqlanmoqda...</>) : (<>Saqlash</>)}</button>
                        </div>
                    </div>
                </div>
            </form>

            <form onSubmit={handleSavePassword}>
                <div className="card shadow-sm">
                    <div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-user-shield me-2"></i>Admin Parolini O'zgartirish</h5></div>
                    <div className="card-body p-4">
                        {passwordError && <div className="alert alert-danger py-2">{passwordError}</div>}
                        <div className="row g-3">
                            <div className="col-md-12"><label htmlFor="currentPassword" className="form-label">Joriy Parol *</label><input type="password" id="currentPassword" name="currentPassword" className="form-control" value={passwords.currentPassword} onChange={handlePasswordChange} required /></div>
                            <div className="col-md-6"><label htmlFor="newPassword" className="form-label">Yangi Parol *</label><input type="password" id="newPassword" name="newPassword" className="form-control" value={passwords.newPassword} onChange={handlePasswordChange} required /></div>
                            <div className="col-md-6"><label htmlFor="confirmPassword" className="form-label">Yangi Parolni Tasdiqlang *</label><input type="password" id="confirmPassword" name="confirmPassword" className="form-control" value={passwords.confirmPassword} onChange={handlePasswordChange} required /></div>
                        </div>
                        <div className="d-flex justify-content-end mt-3">
                            <button type="submit" className="btn btn-primary px-4" disabled={savingPassword || !passwords.currentPassword || !passwords.newPassword}>
                                {savingPassword ? <><span className="spinner-border spinner-border-sm me-2"></span>Yangilanmoqda...</> : <>Parolni Yangilash</>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;
