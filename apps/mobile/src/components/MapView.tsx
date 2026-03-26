import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { colors } from '../theme/colors';

interface MapPin {
  id: string;
  slug: string;
  displayName: string;
  lat: number;
  lng: number;
  avgRating: number;
}

interface Props {
  pins: MapPin[];
  onPinPress: (slug: string) => void;
  center?: { lat: number; lng: number };
}

function NativeMapFallback({ pins }: { pins: MapPin[] }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackIcon}>🗺️</Text>
      <Text style={styles.fallbackText}>Carte disponible sur la version web</Text>
      <Text style={styles.fallbackCount}>{pins.length} prestataires</Text>
    </View>
  );
}

export default function MapViewComponent({ pins, onPinPress, center }: Props) {
  if (Platform.OS !== 'web') return <NativeMapFallback pins={pins} />;
  return <WebMap pins={pins} onPinPress={onPinPress} center={center} />;
}

function WebMap({ pins, onPinPress, center }: Props) {
  const mapContainer = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaflet();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  async function loadLeaflet() {
    if (typeof document === 'undefined') return;
    try {
      // Load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Leaflet load failed'));
          document.head.appendChild(script);
        });
      }

      initMap();
    } catch {
      setError('Impossible de charger la carte');
    }
  }

  function initMap() {
    if (!mapContainer.current || !(window as any).L || mapRef.current) return;
    const L = (window as any).L;

    const defaultCenter = center || { lat: -4.325, lng: 15.322 }; // Kinshasa

    const map = L.map(mapContainer.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap tiles — free, no token
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setReady(true);
  }

  // Add/update pins
  useEffect(() => {
    if (!mapRef.current || !ready || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) mapRef.current.removeLayer(layer);
    });

    // Custom violet icon
    const violetIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        background:#2D1B69;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:bold;font-size:12px;
        cursor:pointer;
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -20],
    });

    const markers: any[] = [];

    pins.forEach(pin => {
      if (!pin.lat || !pin.lng) return;

      const marker = L.marker([pin.lat, pin.lng], { icon: violetIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:system-ui;padding:2px;min-width:120px;">
            <strong style="color:#2D1B69;font-size:13px;">${pin.displayName}</strong><br/>
            <span style="color:#E07A5F;font-weight:600;font-size:12px;">★ ${pin.avgRating.toFixed(1)}</span>
          </div>
        `);

      marker.on('click', () => onPinPress(pin.slug));
      markers.push(marker);
    });

    // Fit bounds or center on city
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 });
    } else if (markers.length === 1) {
      mapRef.current.setView([pins[0].lat, pins[0].lng], 14);
    } else if (center) {
      mapRef.current.setView([center.lat, center.lng], 13);
    }
  }, [pins, ready]);

  // Recenter when center prop changes
  useEffect(() => {
    if (mapRef.current && ready && center) {
      const L = (window as any).L;
      if (L) mapRef.current.setView([center.lat, center.lng], 13, { animate: true });
    }
  }, [center?.lat, center?.lng, ready]);

  if (error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}
      />
      {!ready && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 300 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(250,245,255,0.8)',
  },
  fallback: {
    flex: 1, minHeight: 300, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.cardHover, borderRadius: 16,
  },
  fallbackIcon: { fontSize: 48, marginBottom: 12 },
  fallbackText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  fallbackCount: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
