// Fayl: frontend/src/components/shop/Shops.js (OGOHLANTIRISH TUZATILGAN VERSIYA)

import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../shared/pagination/Pagination';
import './Shops.css';

// --- Modal Oyna Komponenti (o'zgarishsiz) ---
const ShopModal = ({ shop, onClose, onSave }) => {
    const [formData, setFormData] = useState(
        shop
        ? { name: shop.name, botToken: shop.botToken || '', adminChatId: shop.adminChatId || '' }
        : { name: '', ownerUsername: '', ownerPassword: '', botToken: '', adminChatId: '' }
    );
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!shop;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Ma'lumotlarni yuborishdan oldin nomini o'zgartiramiz, chunki backend `shopName` kutadi
        const payload = isEditMode
            ? { name: formData.name, botToken: formData.botToken, adminChatId: formData.adminChatId }
            : { shopName: formData.name, ...formData };

        if (!payload.name && !payload.shopName) {
            alert("Do'kon nomini to'ldiring!");
            return;
        }
        if (!isEditMode && (!payload.ownerUsername || !payload.ownerPassword)) {
            alert("Yangi do'kon uchun egasining logini va parolini to'ldiring!");
            return;
        }

        setIsSaving(true);
        await onSave(payload);
        setIsSaving(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="shop-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h5>{isEditMode ? "Do'konni Tahrirlash" : "Yangi Do'kon Qo'shish"}</h5>
                    <button onClick={onClose} className="btn-close" disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                    <div className="mb-3">
                        <label className="form-label">Do'kon Nomi *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="form-control" />
                    </div>
                    {!isEditMode && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Do'kon Egasi Logini *</label>
                                <input name="ownerUsername" value={formData.ownerUsername} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Do'kon Egasi Paroli *</label>
                                <input type="password" name="ownerPassword" value={formData.ownerPassword} onChange={handleChange} className="form-control" />
                            </div>
                        </>
                    )}
                    <div className="mb-3">
                        <label className="form-label">Bot Tokeni</label>
                        <input name="botToken" value={formData.botToken} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Admin Kanal/Guruh IDsi</label>
                        <input name="adminChatId" value={formData.adminChatId} onChange={handleChange} className="form-control" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>Bekor Qilish</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Asosiy Komponent ---
const Shops = () => {
    // `refetchAll` endi ishlatiladi
    const { shops: allShops, isLoading, error, addShop, updateShop, deleteShop, refetchAll } = useAppContext();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [editingShop, setEditingShop] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const paginatedShops = useMemo(() => {
        if (!allShops) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allShops.slice(startIndex, startIndex + itemsPerPage);
    }, [allShops, currentPage, itemsPerPage]);

    const totalPages = Math.ceil((allShops || []).length / itemsPerPage);

    // ===== O'ZGARISH №1: `refetchAll` ishlatildi =====
    const handleSave = useCallback(async (data) => {
        let result;
        if (editingShop) {
            result = await updateShop(editingShop.id, data);
        } else {
            result = await addShop(data);
        }

        if (result.success) {
            setIsAddModalOpen(false);
            setEditingShop(null);
            refetchAll(); // Ma'lumotlarni yangilaymiz
        } else {
            alert(`Xatolik: ${result.error}`);
        }
    }, [editingShop, addShop, updateShop, refetchAll]); // Bog'liqlikka `refetchAll` qo'shildi

    // ===== O'ZGARISH №2: `refetchAll` ishlatildi =====
    const handleDelete = useCallback(async (shopId) => {
        if (window.confirm("Bu do'konni o'chirishga ishonchingiz komilmi? Bu amalni orqaga qaytarib bo'lmaydi!")) {
            const result = await deleteShop(shopId);
            if (result.success) {
                refetchAll(); // Ma'lumotlarni yangilaymiz
            } else {
                alert(`Xatolik: ${result.error}`);
            }
        }
    }, [deleteShop, refetchAll]); // Bog'liqlikka `refetchAll` qo'shildi

    if (isLoading && !(allShops && allShops.length > 0)) {
        return <div className="loader-container"><div className="spinner-border text-primary"></div></div>;
    }

    if (error) {
        return <div className="error-container"><div className="alert alert-danger">Xato: {error}</div></div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><i className="fas fa-store me-2"></i>Do'konlar Boshqaruvi</h1>
                <button className="btn btn-primary" onClick={() => { setEditingShop(null); setIsAddModalOpen(true); }}>
                    <i className="fas fa-plus me-2"></i>Yangi Do'kon Qo'shish
                </button>
            </div>

            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Do'kon Nomi</th>
                                <th>Egasining Logini</th>
                                <th>Mahsulotlar</th>
                                <th>Buyurtmalar</th>
                                <th className="text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedShops.map(shop => (
                                <tr key={shop.id}>
                                    <td><strong>{shop.name}</strong></td>
                                    <td>{shop.owner?.username || 'N/A'}</td>
                                    <td><span className="badge bg-primary">{shop._count?.products || 0}</span></td>
                                    <td><span className="badge bg-success">{shop._count?.orders || 0}</span></td>
                                    <td className="text-center">
                                        <div className="btn-group">
                                            <button onClick={() => setEditingShop(shop)} className="btn btn-sm btn-outline-primary">Tahrirlash</button>
                                            <button onClick={() => handleDelete(shop.id)} className="btn btn-sm btn-outline-danger">O'chirish</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {(allShops && allShops.length > 0) && (
                    <div className="card-footer">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={(allShops || []).length}
                            onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                        />
                    </div>
                )}
            </div>

            {(isAddModalOpen || editingShop) && (
                <ShopModal
                    shop={editingShop}
                    onClose={() => { setIsAddModalOpen(false); setEditingShop(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default Shops;
