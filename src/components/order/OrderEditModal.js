// Fayl: frontend/src/components/order/OrderEditModal.js (TO'LIQ ALMASHTIRING)

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import './OrderEditModal.css';

const OrderEditModal = ({ order, onClose, onSave }) => {
    const { products: allProducts, isLoading } = useAppContext();

    const [editedItems, setEditedItems] = useState([]);
    const [productToAdd, setProductToAdd] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (order && order.products) {
            // `order.products` bu `OrderProduct` massivi
            const initialItems = order.products.map(item => ({
                productId: item.productId,
                name: item.product?.name || 'O\'chirilgan mahsulot',
                priceAtOrder: item.priceAtOrder, // Buyurtma vaqtidagi narx
                quantity: item.quantity,
                // Tahrirlashda hozirgi narxni ham bilish uchun
                currentPrice: item.product?.price || item.priceAtOrder
            })).filter(item => item.productId);
            setEditedItems(initialItems);
        }
    }, [order]);

    const totalSum = useMemo(() => {
        // Tahrirlashda hozirgi narx bo'yicha hisoblaymiz
        return editedItems.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);
    }, [editedItems]);

    const handleQuantityChange = (productId, newQuantity) => {
        const quantity = Math.max(1, Number(newQuantity));
        setEditedItems(prevItems =>
            prevItems.map(item =>
                item.productId === productId ? { ...item, quantity: quantity } : item
            )
        );
    };

    const handleRemoveItem = (productId) => {
        setEditedItems(prevItems => prevItems.filter(item => item.productId !== productId));
    };

    const handleAddItem = () => {
        if (!productToAdd) return;
        const product = allProducts.find(p => p.id === productToAdd);
        if (!product) return;
        const isAlreadyInOrder = editedItems.some(item => item.productId === product.id);
        if (isAlreadyInOrder) {
            alert("Bu mahsulot buyurtmada allaqachon mavjud. Uning sonini o'zgartirishingiz mumkin.");
            return;
        }
        const newItem = {
            productId: product.id,
            name: product.name,
            priceAtOrder: product.price, // Hozirgi narxni saqlaymiz
            currentPrice: product.price,
            quantity: 1
        };
        setEditedItems(prevItems => [...prevItems, newItem]);
        setProductToAdd('');
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        // Backend'ga `products` massivini yuboramiz
        const payload = {
            products: editedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
            totalSum: totalSum
        };
        await onSave(order.id, payload);
        setIsSaving(false);
    };

    if (!order) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="order-edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h5>Buyurtmani Tahrirlash (#{order?.id?.slice(-6).toUpperCase() || '...'})</h5>
                    <button onClick={onClose} className="btn-close" disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                    {isLoading ? <div className="text-center p-5"><div className="spinner-border"></div></div> :
                    <>
                        <div className="items-list">
                            {editedItems.map(item => (
                                <div key={item.productId} className="order-item-row">
                                    <span className="item-name" title={item.name}>{item.name}</span>
                                    <div className="item-controls">
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control item-quantity"
                                            value={item.quantity}
                                            onChange={e => handleQuantityChange(item.productId, e.target.value)}
                                        />
                                        <span className="item-price">x {item.currentPrice.toLocaleString()} so'm</span>
                                        <button onClick={() => handleRemoveItem(item.productId)} className="btn btn-sm btn-outline-danger item-remove-btn">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <hr />
                        <div className="add-item-section">
                            <h6>Yangi mahsulot qo'shish</h6>
                            <div className="input-group">
                                <select className="form-select" value={productToAdd} onChange={e => setProductToAdd(e.target.value)}>
                                    <option value="">Mahsulotni tanlang...</option>
                                    {allProducts
                                      .filter(p => !editedItems.some(item => item.productId === p.id))
                                      .map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()} so'm</option>
                                    ))}
                                </select>
                                <button className="btn btn-outline-primary" onClick={handleAddItem} disabled={!productToAdd}>Qo'shish</button>
                            </div>
                        </div>
                    </>
                    }
                </div>
                <div className="modal-footer">
                    <div className="total-sum">Jami: <strong>{totalSum.toLocaleString()} so'm</strong></div>
                    <div>
                        <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isSaving}>Bekor qilish</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving || editedItems.length === 0}>
                            {isSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saqlanmoqda...</> : 'Saqlash'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderEditModal;
