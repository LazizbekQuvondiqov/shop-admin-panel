import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Mashina ikonkasini yaratamiz (divIcon orqali, FontAwesome ikonkasidan foydalanamiz)
const carIcon = L.divIcon({
    html: `<div style="background-color: rgba(255, 255, 255, 0.9); border: 3px solid #0d6efd; border-radius: 50%; padding: 8px; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3); display: flex; justify-content: center; align-items: center; width: 40px; height: 40px; transition: transform 0.2s ease-in-out;"><i class="fas fa-car" style="color: #0d6efd; font-size: 20px;"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'animated-car-marker'
});

// Progress panelini yaratuvchi alohida komponent
const ProgressControl = ({ onMount }) => {
    const map = useMap();

    useEffect(() => {
        const Control = L.Control.extend({
            onAdd: function() {
                const div = L.DomUtil.create('div', 'delivery-progress-control');
                onMount(div); // ref-larni o'rnatish uchun
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);
                return div;
            },
            onRemove: function() {}
        });

        const controlInstance = new Control({ position: 'topright' });
        map.addControl(controlInstance);

        return () => {
            map.removeControl(controlInstance);
        };
    }, [map, onMount]);

    return null;
};


const AnimatedCarMarker = ({ route, isAnimating, onAnimationEnd, duration = 30 }) => {
    const map = useMap();
    const markerRef = useRef(null);
    const animationFrameId = useRef(null);

    const progressBarRef = useRef(null);
    const progressPercentRef = useRef(null);
    const progressStatusRef = useRef(null);

    // Progress panelining HTML va CSS'ini yaratish
    const onProgressControlMount = useCallback((div) => {
        const progressPanel = document.createElement('div');
        progressPanel.style.cssText = `background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95)); backdrop-filter: blur(10px); padding: 16px 20px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); min-width: 320px; font-family: 'Segoe UI', Arial, sans-serif;`;
        const header = document.createElement('div');
        header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 15px; font-weight: 600;`;
        header.innerHTML = `<div><i class="fas fa-shipping-fast" style="color: #0d6efd; margin-right: 8px;"></i>Yetkazib berish</div>`;
        const percentSpan = document.createElement('span');
        percentSpan.textContent = '0%';
        percentSpan.style.cssText = `color: #0d6efd; font-weight: 700;`;
        progressPercentRef.current = percentSpan;
        header.appendChild(percentSpan);

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `width: 100%; height: 8px; background-color: rgba(226, 232, 240, 0.8); border-radius: 6px; overflow: hidden;`;
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `height: 100%; background: linear-gradient(90deg, #0d6efd, #3b82f6); border-radius: 6px; width: 0%; transition: width 0.4s ease;`;
        progressBarRef.current = progressBar;
        progressContainer.appendChild(progressBar);

        const status = document.createElement('div');
        status.style.cssText = `margin-top: 10px; font-size: 13px; text-align: center; color: #64748b;`;
        status.innerHTML = `<i class="fas fa-clock" style="margin-right: 5px;"></i>Tayyor...`;
        progressStatusRef.current = status;

        progressPanel.appendChild(header);
        progressPanel.appendChild(progressContainer);
        progressPanel.appendChild(status);
        div.appendChild(progressPanel);
    }, []);

    // Progressni yangilash funksiyasi
    const updateProgress = useCallback((percent) => {
        if (!progressBarRef.current || !progressPercentRef.current || !progressStatusRef.current) return;

        const p = Math.min(100, Math.max(0, percent));
        progressBarRef.current.style.width = `${p}%`;
        progressPercentRef.current.textContent = `${Math.round(p)}%`;

        if (p >= 100) {
            progressStatusRef.current.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745; margin-right: 5px;"></i> Manzilga yetib keldi!';
        } else if (p > 0) {
            progressStatusRef.current.innerHTML = '<i class="fas fa-shipping-fast" style="color: #28a745; margin-right: 5px;"></i> Harakat qilmoqda...';
        } else {
            progressStatusRef.current.innerHTML = '<i class="fas fa-clock" style="margin-right: 5px;"></i>Tayyor...';
        }
    }, []);

    // Mashina yo'nalishini hisoblash
    const calculateBearing = useCallback((p1, p2) => {
        if (!p1 || !p2) return 0;
        const lat1 = p1[0] * Math.PI / 180;
        const lon1 = p1[1] * Math.PI / 180;
        const lat2 = p2[0] * Math.PI / 180;
        const lon2 = p2[1] * Math.PI / 180;
        const dLon = lon2 - lon1;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }, []);

    // Animatsiya logikasi
    useEffect(() => {
        if (!isAnimating || !route || route.length < 2 || !markerRef.current) return;

        let startTimestamp = null;
        const totalDuration = duration * 1000;

        const animate = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsedTime = timestamp - startTimestamp;
            const progress = Math.min(elapsedTime / totalDuration, 1);

            const routeIndex = progress * (route.length - 1);
            const currentIndex = Math.floor(routeIndex);
            const nextIndex = Math.min(currentIndex + 1, route.length - 1);
            const segmentProgress = routeIndex - currentIndex;

            const currentPoint = L.latLng(route[currentIndex]);
            const nextPoint = L.latLng(route[nextIndex]);

            const interpolatedPoint = L.latLng(
                currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress,
                currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress
            );

            markerRef.current.setLatLng(interpolatedPoint);
            updateProgress(progress * 100);

            const bearing = calculateBearing(route[currentIndex], route[nextIndex]);
            const carElement = markerRef.current.getElement();
            if (carElement) {
                const iconContainer = carElement.querySelector('div');
                iconContainer.style.transform = `rotate(${bearing}deg)`;
            }

            if (progress < 1) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                updateProgress(100);
                if (onAnimationEnd) onAnimationEnd();
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [isAnimating, route, duration, updateProgress, onAnimationEnd, calculateBearing]);

    // Markerni yaratish
    useEffect(() => {
        if (!route || route.length === 0) return;
        const marker = L.marker(route[0], { icon: carIcon, zIndexOffset: 1000 });
        markerRef.current = marker;
        map.addLayer(marker);

        return () => {
            if (markerRef.current) map.removeLayer(markerRef.current);
            markerRef.current = null;
        };
    }, [map, route]);

    // Agar animatsiya bo'lsa, progress panelini ko'rsat
    if (!isAnimating) return null;

    return <ProgressControl onMount={onProgressControlMount} />;
};
export default AnimatedCarMarker;
