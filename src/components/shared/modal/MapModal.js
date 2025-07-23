// frontend/src/components/shared/modal/MapModal.js

import React, { useEffect, useMemo } from 'react';
import TaxiMap from '../../taxi/TaxiMap';
import './MapModal.css';

const MapModal = ({ item, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) onClose();
    };

    // <<< YANGI: Ma'lumotlarni standartlashtirish >>>
    // `item` User yoki Order bo'lishi mumkin
    const mapItemData = useMemo(() => {
        if (!item) return null;
        return {
            id: item._id,
            address: item.address, // Ikkalasida ham 'address' bor deb hisoblaymiz
            name: item.userId?.name || item.name || 'Noma\'lum mijoz', // Buyurtmadan yoki to'g'ridan-to'g'ri foydalanuvchidan ismni olamiz
        };
    }, [item]);

    return (
        <div className="map-modal-backdrop" onClick={handleBackdropClick}>
            <div className="map-modal-content">
                <div className="map-modal-header">
                    <h5 className="map-modal-title"><i className="fas fa-truck-loading me-2"></i>Buyurtma Yetkazish Xaritasi</h5>
                    <button type="button" className="map-modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="map-modal-body">
                    {mapItemData && <TaxiMap selectedItem={mapItemData} hideTitle={true} />}
                </div>
            </div>
        </div>
    );
};

export default MapModal;
