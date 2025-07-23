// Fayl: frontend/src/components/user/Users.js (YAKUNIY, TO'LIQ TUZATILGAN VERSIYA)

import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../shared/pagination/Pagination';
import MapModal from '../shared/modal/MapModal';
import './Users.css';

const Users = () => {
    // `allUsers` va `allOrders` sukut bo'yicha bo'sh massiv bo'lsin
    const { users: allUsers = [], orders: allOrders = [], isLoading, error, addUser, updateUser, deleteUser } = useAppContext();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', phone: '', address: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemForMap, setItemForMap] = useState(null);

    // <<< ASOSIY O'ZGARISH: Buyurtmalar sonini hisoblash logikasi tuzatildi >>>
    const usersWithOrderCount = useMemo(() => {
        if (!allUsers.length || !allOrders.length) {
            return allUsers.map(user => ({ ...user, orderCount: 0 }));
        }

        // Har bir mijoz ID'si uchun buyurtmalar sonini sanab chiqamiz
        const orderCounts = allOrders.reduce((acc, order) => {
            const mijozId = order.mijoz?.id; // `order.mijoz.id` ni olamiz
            if (mijozId) {
                acc[mijozId] = (acc[mijozId] || 0) + 1;
            }
            return acc;
        }, {});

        // Mijozlar massiviga `orderCount` ni qo'shamiz
        return allUsers.map(user => ({
            ...user,
            orderCount: orderCounts[user.id] || 0, // Har bir mijoz uchun sonni olamiz
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    }, [allUsers, allOrders]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return usersWithOrderCount;
        const lowercasedTerm = searchTerm.toLowerCase().trim();
        return usersWithOrderCount.filter(user =>
            (user.name?.toLowerCase() || '').includes(lowercasedTerm) ||
            (user.phone || '').includes(lowercasedTerm)
        );
    }, [usersWithOrderCount, searchTerm]);

    const totalItems = filteredUsers.length;
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleAddModalOpen = useCallback(() => { setNewUser({ name: '', phone: '', address: '' }); setShowAddModal(true); }, []);
    const handleAddModalClose = useCallback(() => setShowAddModal(false), []);
    const handleEditModalOpen = useCallback((user) => { setEditingUser({ ...user }); setShowEditModal(true); }, []);
    const handleEditModalClose = useCallback(() => { setShowEditModal(false); setEditingUser(null); }, []);

    // Xaritani ko'rsatish logikasi ham to'g'rilandi
    const handleShowOnMap = useCallback((user) => {
        if (!user.address || !user.address.includes(',')) {
             alert("Ushbu mijoz uchun to'g'ri manzil (koordinata) kiritilmagan. Misol: 41.123,69.456");
             return;
        }
        setItemForMap(user);
    }, []);
    const handleCloseMapModal = useCallback(() => setItemForMap(null), []);

    const handleSaveNew = useCallback(async () => {
        if (!newUser.name.trim() || !newUser.phone.trim()) { alert('Ism va telefon raqami majburiy!'); return; }
        const result = await addUser(newUser);
        if (result.success) handleAddModalClose(); else alert(`Xatolik: ${result.error}`);
    }, [newUser, addUser, handleAddModalClose]);

    const handleSaveEdit = useCallback(async () => {
        if (!editingUser || !editingUser.id) return;
        const result = await updateUser(editingUser.id, editingUser);
        if (result.success) handleEditModalClose(); else alert(`Xatolik: ${result.error}`);
    }, [editingUser, updateUser, handleEditModalClose]);

    const handleDelete = useCallback(async (userId) => {
        if (window.confirm('Ushbu mijozni o\'chirishga ishonchingiz komilmi?')) {
            await deleteUser(userId);
        }
    }, [deleteUser]);

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uz-UZ') : 'Noma\'lum';

    if (isLoading && !allUsers.length) {
        return <div className="loader-container"><div className="spinner-border text-primary"></div></div>;
    }
    if (error) {
        return <div className="error-container"><div className="alert alert-danger">Xato: {error}</div></div>;
    }

    return (
        <div className="page-container users-page-container">
            <div className="page-header">
                <h1><i className="fas fa-users me-2"></i>Mijozlar</h1>
                <button className="btn btn-primary" onClick={handleAddModalOpen}><i className="fas fa-plus me-2"></i>Yangi qo'shish</button>
            </div>

            <div className="card shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="input-group" style={{ maxWidth: '400px' }}>
                        <span className="input-group-text"><i className="fas fa-search"></i></span>
                        <input type="text" className="form-control" placeholder="Ism yoki telefon bo'yicha qidirish..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="text-muted">Jami: <b>{totalItems}</b> ta mijoz</div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Nomi</th>
                                <th>Telefon</th>
                                <th>Buyurtmalar</th>
                                <th>Ro'yxatdan o'tgan</th>
                                <th className="text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="fw-bold">{user.name}</div>
                                        <div className="small text-muted">ID: {user.id.slice(-6)}</div>
                                    </td>
                                    <td>{user.phone}</td>
                                    <td><span className="badge bg-primary rounded-pill">{user.orderCount} ta</span></td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td className="text-center">
                                        <div className="btn-group">
                                            <button onClick={() => handleShowOnMap(user)} className="btn btn-sm btn-outline-secondary" title="Xaritada ko'rish" disabled={!user.address}><i className="fas fa-map-marked-alt"></i></button>
                                            <button onClick={() => handleEditModalOpen(user)} className="btn btn-sm btn-outline-primary" title="Tahrirlash"><i className="fas fa-pencil-alt"></i></button>
                                            <button onClick={() => handleDelete(user.id)} className="btn btn-sm btn-outline-danger" title="O'chirish"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <i className="fas fa-user-slash fa-2x text-muted mb-2"></i>
                                        <p className="mb-0">{searchTerm ? "Qidiruv bo'yicha mijozlar topilmadi" : "Mijozlar mavjud emas"}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalItems > 0 && (
                    <div className="card-footer bg-light">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
                    </div>
                )}
            </div>

            {(showAddModal || showEditModal) && (
                 <div className="users-modal-overlay" onClick={showAddModal ? handleAddModalClose : handleEditModalClose}>
                    <div className="users-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="users-modal-header">
                            <h5 className="users-modal-title">{showAddModal ? 'Yangi Mijoz Qo\'shish' : 'Mijozni Tahrirlash'}</h5>
                            <button onClick={showAddModal ? handleAddModalClose : handleEditModalClose} className="btn-close"></button>
                        </div>
                        <div className="users-modal-body">
                            <div className="mb-3">
                                <label className="form-label">Mijoz Nomi *</label>
                                <input className="form-control" type="text" value={showAddModal ? newUser.name : editingUser?.name || ''} onChange={(e) => showAddModal ? setNewUser({...newUser, name: e.target.value}) : setEditingUser({...editingUser, name: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Telefon Raqami *</label>
                                <input className="form-control" type="text" value={showAddModal ? newUser.phone : editingUser?.phone || ''} onChange={(e) => showAddModal ? setNewUser({...newUser, phone: e.target.value}) : setEditingUser({...editingUser, phone: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Manzil (Koordinatalar)</label>
                                <input className="form-control" type="text" placeholder="Misol: 41.123,69.456" value={showAddModal ? newUser.address : editingUser?.address || ''} onChange={(e) => showAddModal ? setNewUser({...newUser, address: e.target.value}) : setEditingUser({...editingUser, address: e.target.value})} />
                            </div>
                        </div>
                        <div className="users-modal-footer">
                            <button onClick={showAddModal ? handleAddModalClose : handleEditModalClose} className="btn btn-secondary">Bekor qilish</button>
                            <button onClick={showAddModal ? handleSaveNew : handleSaveEdit} className="btn btn-primary">Saqlash</button>
                        </div>
                    </div>
                 </div>
            )}
            {itemForMap && <MapModal item={itemForMap} onClose={handleCloseMapModal} />}
        </div>
    );
};

export default Users;
