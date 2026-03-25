import { View, Text, StyleSheet, Platform, ActivityIndicator, Pressable } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { colors } from '../theme/colors';

interface MapPin {
  id: string;
  slug: string;
  displayName: string;
  lat: number;
  lng: number;
  avgRating: number;
  category?: string;
}

interface Props {
  pins: MapPin[];
  onPinPress: (slug: string) => void;
  center?: { lat: number; lng: number };
}

// Native fallback
function NativeMapFallback({ pins }: { pins: MapPin[] }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackIcon}>🗺️</Text>
      <Text style={styles.fallbackText}>Carte disponible sur la version web</Text>
      <Text style={styles.fallbackCount}>{pins.length} prestataires dans cette zone</Text>
    </View>
  );
}

export default function MapViewComponent({ pins, onPinPress, center }: Props) {
  if (Platform.OS !== 'web') {
    return <NativeMapFallback pins={pins} />;
  }

  return <WebMap pins={pins} onPinPress={onPinPress} center={center} />;
}

// Web-only map using Mapbox GL JS via CDN
function WebMap({ pins, onPinPress, center }: Props) {
  const mapContainer = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAndInitMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  async function loadAndInitMap() {
    if (typeof document === 'undefined') return;

    try {
      // Load CSS
      if (!document.getElementById('mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).mapboxgl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Mapbox load failed'));
          document.head.appendChild(script);
        });
      }

      const mapboxgl = (window as any).mapboxgl;
      // Use free/public token — user should replace with their own
      mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidG9rb3NzYXBwIiwiYSI6ImNtOG1jcXQ2NzBkMmEya3B6dWVocGF5MmEifQ.placeholder';

      const defaultCenter = center || { lat: -4.325, lng: 15.322 };

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [defaultCenter.lng, defaultCenter.lat],
        zoom: 12,
      });

      mapRef.current = map;
      map.on('load', () => setMapLoaded(true));
    } catch {
      setError('Impossible de charger la carte');
    }
  }

  // Add/update pins
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || typeof document === 'undefined') return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    // Remove old markers
    document.querySelectorAll('.tokoss-pin').forEach(el => el.remove());

    pins.forEach(pin => {
      if (!pin.lat || !pin.lng) return;

      const el = document.createElement('div');
      el.className = 'tokoss-pin';
      Object.assign(el.style, {
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#7C3AED', border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 'bold', fontSize: '14px',
      });
      el.textContent = pin.displayName[0]?.toUpperCase() || '?';
      el.addEventListener('click', () => onPinPress(pin.slug));

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`<div style="font-family:system-ui;padding:4px;">
          <strong style="color:#2D1B69;">${pin.displayName}</strong><br/>
          <span style="color:#E07A5F;font-weight:600;">★ ${pin.avgRating.toFixed(1)}</span>
        </div>`);

      new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(mapRef.current);
    });

    // Fit bounds
    if (pins.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      pins.forEach(p => { if (p.lat && p.lng) bounds.extend([p.lng, p.lat]); });
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [pins, mapLoaded]);

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
      {!mapLoaded && (
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
