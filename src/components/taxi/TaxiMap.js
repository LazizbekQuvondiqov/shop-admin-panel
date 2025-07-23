// frontend/src/components/taxi/TaxiMap.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TaxiMap.css';
import AnimatedCarMarker from './AnimatedCarMarker';
import { useAppContext } from '../../context/AppContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const shopIcon = new L.Icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const destinationIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

const MapController = ({ shopLocation, destinationCoords }) => {
    const map = useMap();
    useEffect(() => {
        if (!shopLocation) return;
        try {
            const bounds = destinationCoords ? L.latLngBounds([shopLocation, destinationCoords]) : L.latLngBounds([shopLocation]);
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch(e) { console.error("Xarita chegaralarini o'rnatishda xato:", e); }
    }, [map, shopLocation, destinationCoords]);
    return null;
};

// <<< O'ZGARISH: `selectedOrder` o'rniga `selectedItem` ishlatiladi >>>
const TaxiMap = ({ selectedItem, hideTitle = false }) => {
    const { settings } = useAppContext();
    const [shopLocation, setShopLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routePolyline, setRoutePolyline] = useState([]);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [tariffRate, setTariffRate] = useState(2500);
    const requestRef = useRef({ timeoutId: null, controller: null });

    // <<< O'ZGARISH: Hardcoded kalit olib tashlandi, faqat .env dan olinadi >>>
    const ORS_API_KEY = process.env.REACT_APP_ORS_API_KEY;
    const TARIFF_OPTIONS = Array.from({ length: 9 }, (_, i) => 2000 + i * 500);

    const parseCoordinates = useCallback((addressString) => {
        if (!addressString || typeof addressString !== 'string') return null;
        const patterns = [ /q=([\d.-]+),([\d.-]+)/, /@(-?[\d.]+),(-?[\d.]+)/, /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/ ];
        for (const pattern of patterns) {
            const match = addressString.match(pattern);
            if (match?.[1] && match?.[2]) {
                const lat = parseFloat(match[1]); const lng = parseFloat(match[2]);
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
            }
        }
        return null;
    }, []);

    useEffect(() => {
        if (settings?.storeLocation) {
            const coords = parseCoordinates(settings.storeLocation);
            setShopLocation(coords ? { ...coords, name: settings.storeName || "Do'kon" } : null);
        }
    }, [settings, parseCoordinates]);

    const fetchRoute = useCallback(async (startCoords, endCoords, destinationName, controller) => {
        if (!ORS_API_KEY) {
            setRouteInfo({ error: "Xarita servisi uchun API kalit topilmadi." });
            return;
        }
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
        setLoadingRoute(true);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Server xatosi (${response.status})`);
            const data = await response.json();
            const route = data.features[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            const summary = route.properties.summary;
            setRouteInfo({
                distance: (summary.distance / 1000).toFixed(2),
                duration: Math.round(summary.duration / 60),
                cost: Math.round((summary.distance / 1000) * tariffRate),
                destinationName,
                durationInSeconds: summary.duration
            });
            setRoutePolyline(coords);
        } catch (error) {
            if (error.name !== 'AbortError') setRouteInfo({ error: "Yo'nalish topilmadi." });
        } finally {
            if (!controller.signal.aborted) setLoadingRoute(false);
        }
    }, [ORS_API_KEY, tariffRate]);

    useEffect(() => {
        clearTimeout(requestRef.current.timeoutId);
        if (requestRef.current.controller) requestRef.current.controller.abort();
        setIsAnimating(false); setRouteInfo(null); setRoutePolyline([]); setDestinationCoords(null);

        // <<< O'ZGARISH: selectedItem dan foydalanish >>>
        if (selectedItem?.address && shopLocation) {
            const coords = parseCoordinates(selectedItem.address);
            if (coords) {
                setDestinationCoords(coords);
                const newController = new AbortController();
                requestRef.current = { controller: newController, timeoutId: setTimeout(() => { fetchRoute(shopLocation, coords, selectedItem.name, newController); }, 300) };
            } else { setRouteInfo({ error: "Manzil formati noto'g'ri." }); }
        }
        const reqRef = requestRef.current;
        return () => { clearTimeout(reqRef.timeoutId); if (reqRef.controller) reqRef.controller.abort(); };
    }, [selectedItem, shopLocation, parseCoordinates, fetchRoute]);

    if (!shopLocation) return <div className="loading-container"><div className="spinner-border text-primary"></div><span>Do'kon manzili sozlanmoqda...</span></div>;

    return (
        <div className="taxi-map-container">
            {!hideTitle && <h4 className="taxi-map-title"><i className="fas fa-map-marked-alt me-2"></i> Yetkazib berish xaritasi</h4>}
            <div className="map-wrapper">
                <MapContainer center={[shopLocation.lat, shopLocation.lng]} zoom={13} key={selectedItem?.id || 'default-map'}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                    <MapController shopLocation={shopLocation} destinationCoords={destinationCoords} />
                    <Marker position={[shopLocation.lat, shopLocation.lng]} icon={shopIcon}><Popup>{shopLocation.name}</Popup></Marker>
                    {destinationCoords && <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}><Popup>{routeInfo?.destinationName}</Popup></Marker>}
                    {routePolyline.length > 0 && <Polyline pathOptions={{ color: '#0d6efd', weight: 5, opacity: 0.7 }} positions={routePolyline} />}
                    <AnimatedCarMarker route={routePolyline} isAnimating={isAnimating} onAnimationEnd={() => setIsAnimating(false)} duration={routeInfo?.durationInSeconds || 30}/>
                </MapContainer>
            </div>
            <div className="taxi-map-info">
                {loadingRoute ? <div className="info-calculating"><div className="spinner-border spinner-border-sm"></div><span>Hisoblanmoqda...</span></div> :
                 routeInfo ? ( routeInfo.error ? <div className="info-error">{routeInfo.error}</div> :
                    ( <div className="route-details">
                        <div className="info-header"><span>{routeInfo.destinationName}</span></div>
                        <div className="info-stats">
                            <div><span className="info-stat-value">{routeInfo.distance} km</span><span className="info-stat-label">Masofa</span></div>
                            <div><span className="info-stat-value">~{routeInfo.duration} daq</span><span className="info-stat-label">Vaqt</span></div>
                            <div><span className="info-stat-value">{new Intl.NumberFormat().format(routeInfo.cost)} so'm</span><span className="info-stat-label">Narx</span></div>
                        </div>
                        <div className="tariff-selector-group">
                            <label htmlFor="tariff-select" className="tariff-label"><i className="fas fa-tags"></i> Tarif (1km uchun):</label>
                            <select id="tariff-select" value={tariffRate} onChange={(e) => setTariffRate(Number(e.target.value))} className="form-select form-select-sm">
                                {TARIFF_OPTIONS.map(rate => (<option key={rate} value={rate}>{rate.toLocaleString()} so'm</option>))}
                            </select>
                        </div>
                    </div>)
                ) : <div className="info-placeholder"><span>Buyurtma tanlang</span></div>}
                {!loadingRoute && routeInfo && !routeInfo.error && (
                    <div className="animation-controls">
                        <button className={`btn-animate ${isAnimating ? 'animating' : ''}`} onClick={() => setIsAnimating(p => !p)}><i className={`fas ${isAnimating ? 'fa-pause' : 'fa-play'} me-2`}></i>{isAnimating ? "Pauza" : "Boshlash"}</button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TaxiMap;
