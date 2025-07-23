// Fayl: frontend/src/components/order/OrderAddModal.js (TO'LIQ ALMASHTIRING)

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import './OrderEditModal.css'; // Mavjud stil faylidan foydalanamiz

const OrderAddModal = ({ onClose, onSave }) => {
    const { users, products } = useAppContext();

    const [mijozId, setMijozId] = useState('');
    const [items, setItems] = useState([]);
    const [address, setAddress] = useState('');
    const [productToAdd, setProductToAdd] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Naqd pul');

    const totalSum = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items]);

    const handleAddItem = () => {
        if (!productToAdd) return;
        const product = products.find(p => p.id === productToAdd);
        if (!product || items.some(item => item.productId === product.id)) {
            alert("Bu mahsulot buyurtmada allaqachon mavjud yoki tanlanmagan.");
            return;
        }
        setItems(prev => [...prev, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: product.price
        }]);
        setProductToAdd('');
    };

    const handleRemoveItem = (productId) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };



    const handleQuantityChange = (productId, newQuantity) => {
        setItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity: Math.max(1, Number(newQuantity)) } : item
        ));
    };

    const handleUserChange = (e) => {
        const selectedUserId = e.target.value;
        setMijozId(selectedUserId);
        const selectedUser = users.find(u => u.id === selectedUserId);
        // Manzilni avtomatik to'ldirish (agar mavjud bo'lsa)
        setAddress(selectedUser?.address || '');
    };

    const handleSaveChanges = async () => {
        if (!mijozId || items.length === 0 || !address.trim()) {
            alert("Iltimos, mijozni, kamida bitta mahsulotni va manzilni kiriting.");
            return;
        }
        setIsSaving(true);
        const payload = {
            mijozId: mijozId,
            products: items.map(({ productId, quantity }) => ({ productId, quantity })),
            totalSum,
            address,
            status: 'Tasdiqlandi', // Admin tomonidan qo'shilgani uchun
            paymentMethod: paymentMethod,
            paymentStatus: "To'lanmagan" // Standart holat
        };
        await onSave(payload);
        setIsSaving(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="order-edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h5>Yangi Buyurtma Qo'shish</h5><button onClick={onClose} className="btn-close"></button></div>
                <div className="modal-body">
                    <div className="form-group mb-3">
                        <label className="form-label">Mijozni tanlang</label>
                        <select className="form-select" value={mijozId} onChange={handleUserChange}>
                            <option value="">Mijoz...</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.name} - {user.phone}</option>)}
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label className="form-label">Manzil</label>
                        <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} placeholder="Yetkazib berish manzili" />
                    </div>
                     <div className="form-group mb-3">
                        <label className="form-label">To'lov usuli</label>
                        <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="Naqd pul">Naqd pul</option>
                            <option value="Karta">Karta</option>
                            <option value="Noma'lum">Noma'lum</option>
                        </select>
                    </div>
                    <hr />
                    <h6>Buyurtma tarkibi</h6>
                    <div className="items-list mb-3">
                        {items.length === 0 && <p className="text-muted text-center">Hali mahsulot qo'shilmadi</p>}
                        {items.map(item => (
                            <div key={item.productId} className="order-item-row">
                                <span className="item-name">{item.name}</span>
                                <div className="item-controls">
                                    <input type="number" min="1" className="form-control item-quantity" value={item.quantity} onChange={e => handleQuantityChange(item.productId, e.target.value)} />
                                    <span className="item-price">x {item.price.toLocaleString()} so'm</span>
                                    <button onClick={() => handleRemoveItem(item.productId)} className="btn btn-sm btn-outline-danger item-remove-btn"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="add-item-section">
                        <div className="input-group">
                            <select className="form-select" value={productToAdd} onChange={e => setProductToAdd(e.target.value)}>
                                <option value="">Mahsulot qo'shish...</option>
                                {products.filter(p => !items.some(item => item.productId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button className="btn btn-outline-primary" onClick={handleAddItem} disabled={!productToAdd}>Qo'shish</button>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="total-sum">Jami: <strong>{totalSum.toLocaleString()} so'm</strong></div>
                    <div>
                        <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isSaving}>Bekor qilish</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving || !mijozId || items.length === 0}>
                            {isSaving ? 'Saqlanmoqda...' : 'Yaratish'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderAddModal;
