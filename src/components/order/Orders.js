// Fayl: frontend/src/components/order/Orders.js (YAKUNIY, ISHONCHLI VERSIYA)

import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../shared/pagination/Pagination';
import MapModal from '../shared/modal/MapModal';
import OrderEditModal from './OrderEditModal';
import OrderAddModal from './OrderAddModal';
import './Orders.css';

// --- Statusni o'zgartirish uchun Modal Komponent ---
const StatusUpdateModalComponent = ({ order, onClose, onSave }) => {
    const [status, setStatus] = useState(order.status);
    // Izoh maydoni har doim bo'sh boshlanadi, bu avtomatik xabar yuborish uchun muhim.
    const [comment, setComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(order.id, { status, adminComment: comment });
        setIsSaving(false);
        onClose();
    };

    const selectableStatuses = ["Tasdiqlandi", "Yetkazildi", "Bekor qilindi"];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="status-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header"><h5>Statusni O'zgartirish</h5><button onClick={onClose} className="btn-close" disabled={isSaving}></button></div>
                <div className="modal-body">
                    <p>Buyurtma #{order?.id?.slice(-6).toUpperCase()}</p>
                    <div className="form-group mb-3"><label>Yangi Holat</label><select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>{![...selectableStatuses, "Yangi"].includes(order.status) && <option value={order.status}>{order.status}</option>}<option value="Yangi">Yangi</option>{selectableStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="form-group"><label>Izoh (Mijozga yuborish uchun)</label><textarea className="form-control" rows="3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Avtomatik xabar uchun bu joyni bo'sh qoldiring..."></textarea></div>
                    <div className="text-muted small mt-2">Agar izoh maydoni bo'sh qoldirilsa, statusga mos standart xabar yuboriladi.</div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Bekor qilish</button><button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
            </div>
        </div>
    );
};

// --- Buyurtma tarkibini ko'rsatish uchun Komponent ---
const OrderItemsDisplay = ({ items }) => {
    if (!items || items.length === 0) return <span className="text-muted">Buyurtma bo'sh</span>;
    return (
        <div className="order-items-display-container">
            {items.map((item, index) => (<div key={item.productId || index} className="order-item-display"><img src={item.product?.image || "https://via.placeholder.com/40"} alt={item.product?.name || 'Mahsulot'} className="order-item-image-small" /><div className="order-item-info"><span className="order-item-name">{item.product?.name || "O'chirilgan mahsulot"}</span><span className="order-item-quantity">{item.quantity} dona</span></div></div>))}
        </div>
    );
};

// --- Asosiy Komponent ---
const Orders = () => {
    const { orders: allOrders, isLoading, error, addOrder, updateOrder, deleteOrder, updateOrderStatus } = useAppContext();
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemForMap, setItemForMap] = useState(null);
    const [orderToUpdateStatus, setOrderToUpdateStatus] = useState(null);
    const [orderToEdit, setOrderToEdit] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredOrders = useMemo(() => {
        if (!allOrders) return []; let tempOrders = [...allOrders];
        if (filterStatus !== 'all') tempOrders = tempOrders.filter(order => order.status === filterStatus);
        if (searchTerm) { const lowercasedTerm = searchTerm.toLowerCase(); tempOrders = tempOrders.filter(order => order.mijoz?.name?.toLowerCase().includes(lowercasedTerm) || order.mijoz?.phone?.includes(lowercasedTerm) || order.id?.toLowerCase().includes(lowercasedTerm)); }
        return tempOrders;
    }, [allOrders, filterStatus, searchTerm]);

    const totalItems = filteredOrders.length;
    const paginatedOrders = useMemo(() => { const startIndex = (currentPage - 1) * itemsPerPage; return filteredOrders.slice(startIndex, startIndex + itemsPerPage); }, [filteredOrders, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleStatusSave = useCallback(async (orderId, data) => {
        const result = await updateOrderStatus(orderId, data);
        if (result.success) setOrderToUpdateStatus(null); else alert(`Xatolik: ${result.error}`);
    }, [updateOrderStatus]);

    const handleEditSave = useCallback(async (orderId, data) => {
        const result = await updateOrder(orderId, data);
        if (result.success) setOrderToEdit(null); else alert(`Xatolik: ${result.error}`);
    }, [updateOrder]);

    const handleAddOrder = useCallback(async (payload) => {
        const result = await addOrder(payload);
        if (result.success) setIsAddModalOpen(false); else alert(`Xatolik: ${result.error}`);
    }, [addOrder]);

    const handleDelete = async (orderId) => {
        if (!orderId) { alert("O'chirish uchun ID topilmadi!"); return; }
        if (window.confirm(`Haqiqatan ham #${orderId.slice(-6).toUpperCase()} raqamli buyurtmani o'chirmoqchimisiz?`)) {
            const result = await deleteOrder(orderId);
            if (!result.success) alert(`Xatolik: ${result.error}`);
        }
    };

    const handleViewProof = (adminMessageId) => {
        const ADMIN_CHAT_ID = process.env.REACT_APP_ADMIN_CHAT_ID;
        if (!ADMIN_CHAT_ID) { alert("Iltimos, frontend/.env fayliga REACT_APP_ADMIN_CHAT_ID o'zgaruvchisini qo'shing."); return; }
        const publicChatId = String(ADMIN_CHAT_ID).replace('-100', '');
        const proofUrl = `https://t.me/c/${publicChatId}/${adminMessageId}`;
        window.open(proofUrl, '_blank');
    };

    if (isLoading && !allOrders.length) return <div className="loader-container"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="error-container"><div className="alert alert-danger">Xato: {error}</div></div>;
    const allStatusesForFilter = ["Yangi", "To'lov tekshirilmoqda", "Tasdiqlandi", "Yetkazildi", "Bekor qilindi"];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className='text-dark'><i className="fas fa-shopping-cart me-2"></i>Buyurtmalar</h1>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}><i className="fas fa-plus me-2"></i>Yangi Buyurtma</button>
            </div>
            <div className="controls-card card mb-4">
                <div className="search-box"><i className="fas fa-search"></i><input type="text" placeholder="Mijoz, telefon yoki ID bo'yicha qidirish..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} /></div>
                <div className="filter-controls"><select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}><option value="all">Barcha holatlar</option>{allStatusesForFilter.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                <div className="page-stats"><span className="badge bg-primary">Jami: {totalItems}</span></div>
            </div>
            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light"><tr><th>Mijoz</th><th>Buyurtma</th><th>Summa</th><th>To'lov</th><th>Chek</th><th>Vaqt</th><th>Holati</th><th className="text-center">Amallar</th></tr></thead>
                        <tbody>
                            {paginatedOrders.map(order => (
                                <tr key={order.id}>
                                    <td><div className="customer-info"><div className="customer-name">{order.mijoz?.name || 'Noma\'lum'}</div><div className="customer-phone">{order.mijoz?.phone || ''}</div></div></td>
                                    <td><OrderItemsDisplay items={order.products} /></td>
                                    <td className="amount">{new Intl.NumberFormat('uz-UZ').format(order.totalSum)} so'm</td>
                                    <td className="payment-method">{order.paymentMethod || 'Noma\'lum'}</td>
                                    <td className="text-center">{order.adminMessageId ? (<button onClick={() => handleViewProof(order.adminMessageId)} className="btn btn-sm btn-outline-success" title="Chekni Telegramda ko'rish"><i className="fas fa-receipt"></i></button>) : (<span className="text-muted">-</span>)}</td>
                                    <td className="order-time">{new Date(order.createdAt).toLocaleString('uz-UZ')}</td>
                                    <td><button className={`status-badge-button status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setOrderToUpdateStatus(order)}>{order.status}</button></td>
                                    <td className="actions-cell"><div className="btn-group" role="group"><button onClick={() => setItemForMap(order)} className="btn btn-sm btn-outline-secondary" title="Xaritada ko'rish" disabled={!order.address || order.address === "Olib ketish"}><i className="fas fa-map-marked-alt"></i></button><button onClick={() => setOrderToEdit(order)} className="btn btn-sm btn-outline-primary" title="Buyurtma tarkibini tahrirlash"><i className="fas fa-pencil-alt"></i></button><button onClick={() => handleDelete(order.id)} className="btn btn-sm btn-outline-danger" title="O'chirish"><i className="fas fa-trash"></i></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalItems > 0 && (<div className="card-footer"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} /></div>)}
            </div>
            {itemForMap && <MapModal item={itemForMap} onClose={() => setItemForMap(null)} />}
            {orderToUpdateStatus && <StatusUpdateModalComponent order={orderToUpdateStatus} onClose={() => setOrderToUpdateStatus(null)} onSave={handleStatusSave} />}
            {orderToEdit && <OrderEditModal order={orderToEdit} onClose={() => setOrderToEdit(null)} onSave={handleEditSave} />}
            {isAddModalOpen && <OrderAddModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddOrder} />}
        </div>
    );
};

export default Orders;
