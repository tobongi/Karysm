import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';

// ─── Types ─────────────────────────────────────────────────────────────────

type TryOnCategory = 'levres' | 'joues' | 'yeux';
type TryOnState = 'idle' | 'loading' | 'ready' | 'error';

interface Product {
  id: string;
  name: string;
  price: string;
  color: string;
  opacity: number;
  finish: string;
}

// ─── Product catalogue ──────────────────────────────────────────────────────

const PRODUCTS: Record<TryOnCategory, Product[]> = {
  levres: [
    { id: 'l1', name: 'Rouge Passion',   price: '4 500 FC', color: '#C41E3A', opacity: 0.75, finish: 'Matte' },
    { id: 'l2', name: 'Rose Poudré',     price: '4 500 FC', color: '#D4888A', opacity: 0.70, finish: 'Satin' },
    { id: 'l3', name: 'Prune Royale',    price: '5 000 FC', color: '#6B2D5E', opacity: 0.78, finish: 'Velvet' },
    { id: 'l4', name: 'Terracotta',      price: '4 500 FC', color: '#A0522D', opacity: 0.72, finish: 'Matte' },
    { id: 'l5', name: 'Corail Vif',      price: '4 500 FC', color: '#FF6B47', opacity: 0.70, finish: 'Gloss' },
    { id: 'l6', name: 'Bordeaux Nuit',   price: '5 000 FC', color: '#722F37', opacity: 0.80, finish: 'Matte' },
    { id: 'l7', name: 'Nude Naturel',    price: '4 000 FC', color: '#C4906A', opacity: 0.65, finish: 'Gloss' },
  ],
  joues: [
    { id: 'j1', name: 'Rose Pêche',      price: '3 500 FC', color: '#FFAD99', opacity: 0.40, finish: 'Poudre' },
    { id: 'j2', name: 'Rose Doré',       price: '3 500 FC', color: '#E8929A', opacity: 0.35, finish: 'Shimmer' },
    { id: 'j3', name: 'Bronze Africain', price: '4 000 FC', color: '#B5651D', opacity: 0.30, finish: 'Matte' },
    { id: 'j4', name: 'Mauve Doux',      price: '3 500 FC', color: '#C3A0B8', opacity: 0.35, finish: 'Poudre' },
    { id: 'j5', name: 'Corail Soleil',   price: '3 500 FC', color: '#FF7F50', opacity: 0.30, finish: 'Shimmer' },
    { id: 'j6', name: 'Terracotta Rose', price: '4 000 FC', color: '#CC7A5A', opacity: 0.32, finish: 'Matte' },
  ],
  yeux: [
    { id: 'y1', name: 'Fumée Noire',    price: '3 000 FC', color: '#2D2D2D', opacity: 0.60, finish: 'Matte' },
    { id: 'y2', name: 'Prune Mystère',  price: '3 500 FC', color: '#7B2D8B', opacity: 0.55, finish: 'Shimmer' },
    { id: 'y3', name: 'Or Africain',    price: '4 000 FC', color: '#CFB53B', opacity: 0.50, finish: 'Glitter' },
    { id: 'y4', name: 'Taupe Nude',     price: '3 000 FC', color: '#8B7355', opacity: 0.50, finish: 'Satin' },
    { id: 'y5', name: 'Bleu Saphir',    price: '3 500 FC', color: '#0F4C81', opacity: 0.55, finish: 'Shimmer' },
    { id: 'y6', name: 'Kaki Forêt',     price: '3 500 FC', color: '#4A5940', opacity: 0.52, finish: 'Matte' },
  ],
};

const CATEGORY_TABS: Array<{ key: TryOnCategory; label: string; emoji: string }> = [
  { key: 'levres', label: 'Lèvres', emoji: '💋' },
  { key: 'joues',  label: 'Joues',  emoji: '🌸' },
  { key: 'yeux',   label: 'Yeux',   emoji: '👁' },
];

// ─── MediaPipe landmark indices ─────────────────────────────────────────────

// Full outer lip polygon (clockwise)
const LIP_OUTLINE = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
  375, 321, 405, 314, 17, 84, 181, 91, 146,
];

// ─── Drawing helpers ────────────────────────────────────────────────────────

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function lmPt(lm: any[], idx: number, W: number, H: number): [number, number] {
  return [lm[idx].x * W, lm[idx].y * H];
}

function drawLips(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  color: string,
  opacity: number,
  W: number,
  H: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  const [x0, y0] = lmPt(lm, LIP_OUTLINE[0], W, H);
  ctx.moveTo(x0, y0);
  for (let i = 1; i < LIP_OUTLINE.length; i++) {
    const [x, y] = lmPt(lm, LIP_OUTLINE[i], W, H);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBlush(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  color: string,
  opacity: number,
  W: number,
  H: number,
) {
  // Approximate cheek centers (left: 50, right: 280)
  const cheekIdxs = [50, 280];
  const radius = W * 0.10;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  cheekIdxs.forEach(idx => {
    const [cx, cy] = lmPt(lm, idx, W, H);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, hexToRgba(color, opacity));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawEyeShadow(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  color: string,
  opacity: number,
  W: number,
  H: number,
) {
  // Top of each eye (upper eyelid landmark)
  const eyeTopIdxs = [159, 386];
  // Approximate face width for scaling
  const faceW = Math.abs(lm[454].x - lm[234].x) * W;
  const radius = faceW * 0.11;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  eyeTopIdxs.forEach(idx => {
    const [cx, cy] = lmPt(lm, idx, W, H);
    // Shift slightly above the eyelid
    const ey = cy - radius * 0.25;
    const grad = ctx.createRadialGradient(cx, ey, 0, cx, ey, radius);
    grad.addColorStop(0, hexToRgba(color, opacity * 0.9));
    grad.addColorStop(0.55, hexToRgba(color, opacity * 0.45));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, ey, radius, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function applyMakeup(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  product: Product,
  category: TryOnCategory,
  W: number,
  H: number,
) {
  if (category === 'levres') drawLips(ctx, lm, product.color, product.opacity, W, H);
  else if (category === 'joues') drawBlush(ctx, lm, product.color, product.opacity, W, H);
  else drawEyeShadow(ctx, lm, product.color, product.opacity, W, H);
}

// ─── Script loader ─────────────────────────────────────────────────────────

function loadScript(src: string, crossOrigin?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    if (crossOrigin) s.crossOrigin = crossOrigin;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ─── Native fallback ────────────────────────────────────────────────────────

function NativeFallback() {
  return (
    <SafeAreaView style={nf.safe} edges={['top']}>
      <View style={nf.center}>
        <Text style={nf.icon}>💋</Text>
        <Text style={nf.title}>Miroir Virtuel</Text>
        <Text style={nf.sub}>
          L'essayage virtuel fonctionne via{'\n'}app.karysm.com dans Chrome ou Edge.
        </Text>
        <Pressable style={nf.btn} onPress={() => router.back()}>
          <Text style={nf.btnText}>Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const nf = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20 },
  btnText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});

// ─── Main ────────────────────────────────────────────────────────────────────

export default function VirtualTryOnScreen() {
  if (Platform.OS !== 'web') return <NativeFallback />;

  const containerRef = useRef<any>(null);
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const rafRef       = useRef<number>(0);
  const faceMeshRef  = useRef<any>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  // Refs mirror state so RAF callbacks always read current values
  const productRef   = useRef<Product>(PRODUCTS.levres[0]);
  const categoryRef  = useRef<TryOnCategory>('levres');
  const sendingRef   = useRef(false);

  const [tryOnState, setTryOnState] = useState<TryOnState>('idle');
  const [errMsg, setErrMsg]         = useState('');
  const [category, setCategory]     = useState<TryOnCategory>('levres');
  const [product, setProduct]       = useState<Product>(PRODUCTS.levres[0]);
  const [faceOk, setFaceOk]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Keep refs in sync
  useEffect(() => { productRef.current = product; }, [product]);
  useEffect(() => { categoryRef.current = category; }, [category]);

  // Inject <video> + <canvas> into the View once it mounts
  useEffect(() => {
    const div = containerRef.current as HTMLDivElement | null;
    if (!div) return;

    const video = document.createElement('video');
    video.autoplay   = true;
    video.playsInline = true;
    video.muted      = true;
    video.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'object-fit:cover;transform:scaleX(-1);';

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'transform:scaleX(-1);pointer-events:none;';

    div.appendChild(video);
    div.appendChild(canvas);
    videoRef.current  = video;
    canvasRef.current = canvas;

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (div.contains(video))  div.removeChild(video);
      if (div.contains(canvas)) div.removeChild(canvas);
    };
  }, []);

  const startCamera = useCallback(async () => {
    setTryOnState('loading');
    setErrMsg('');
    try {
      // Check camera support
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Caméra non supportée par ce navigateur');
      }

      // Load MediaPipe face_mesh from CDN
      const BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';
      await loadScript(`${BASE}/face_mesh.js`, 'anonymous');

      const FaceMeshCtor = (window as any).FaceMesh;
      if (!FaceMeshCtor) throw new Error('Modèle IA indisponible — réessayez dans quelques secondes');

      const faceMesh = new FaceMeshCtor({
        locateFile: (f: string) => `${BASE}/${f}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMeshRef.current = faceMesh;

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await new Promise<void>(res => { video.onloadedmetadata = () => res(); });
      await video.play();

      const canvas = canvasRef.current!;
      const ctx    = canvas.getContext('2d')!;

      faceMesh.onResults((results: any) => {
        const W = video.videoWidth;
        const H = video.videoHeight;
        if (canvas.width !== W)  canvas.width  = W;
        if (canvas.height !== H) canvas.height = H;
        ctx.clearRect(0, 0, W, H);
        const lm = results.multiFaceLandmarks?.[0];
        if (lm) {
          setFaceOk(true);
          applyMakeup(ctx, lm, productRef.current, categoryRef.current, W, H);
        } else {
          setFaceOk(false);
        }
        sendingRef.current = false;
      });

      // RAF loop — throttle to prevent queuing
      const tick = () => {
        if (video.readyState >= 2 && !sendingRef.current) {
          sendingRef.current = true;
          faceMesh.send({ image: video }).catch(() => { sendingRef.current = false; });
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setTryOnState('ready');
    } catch (err: any) {
      const raw = err?.message ?? '';
      const friendly =
        raw.includes('Permission') || raw.includes('NotAllowed') || raw.includes('denied')
          ? 'Permission caméra refusée — autorisez l\'accès dans votre navigateur'
          : raw.includes('NotFound') || raw.includes('DevicesNotFound')
          ? 'Aucune caméra détectée sur cet appareil'
          : raw || 'Erreur de démarrage';
      setErrMsg(friendly);
      setTryOnState('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current  = null;
    sendingRef.current = false;
    const cv = canvasRef.current;
    if (cv) cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
    setTryOnState('idle');
    setFaceOk(false);
  }, []);

  const pickCategory = useCallback((cat: TryOnCategory) => {
    setCategory(cat);
    categoryRef.current = cat;
    const first = PRODUCTS[cat][0];
    setProduct(first);
    productRef.current = first;
  }, []);

  const pickProduct = useCallback((p: Product) => {
    setProduct(p);
    productRef.current = p;
  }, []);

  const saveLook = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const isRunning = tryOnState === 'ready';
  const showPanel = tryOnState === 'ready' || tryOnState === 'idle';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Camera / Mirror area ── */}
      <View ref={containerRef} style={styles.mirror}>

        {/* Idle */}
        {tryOnState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayIcon}>💋</Text>
            <Text style={styles.overlayTitle}>Miroir Virtuel</Text>
            <Text style={styles.overlaySub}>
              Essayez rouge à lèvres, blush et fard à paupières en temps réel grâce à l'IA
            </Text>
            <Pressable style={styles.startBtn} onPress={startCamera}>
              <Text style={styles.startBtnText}>Activer la caméra</Text>
            </Pressable>
            <Text style={styles.overlayNote}>
              Chrome ou Edge requis{'\n'}Votre vidéo ne quitte pas votre appareil
            </Text>
          </View>
        )}

        {/* Loading */}
        {tryOnState === 'loading' && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Chargement du modèle IA…</Text>
            <Text style={styles.loadingNote}>Premier chargement : 10–20 s selon votre connexion</Text>
          </View>
        )}

        {/* Error */}
        {tryOnState === 'error' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayIcon}>⚠️</Text>
            <Text style={styles.overlayTitle}>Oops</Text>
            <Text style={styles.overlaySub}>{errMsg}</Text>
            <Pressable style={styles.startBtn} onPress={startCamera}>
              <Text style={styles.startBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {/* No-face hint */}
        {isRunning && !faceOk && (
          <View style={styles.hintBar}>
            <Text style={styles.hintText}>Positionnez votre visage dans le cadre</Text>
          </View>
        )}

        {/* Stop button */}
        {isRunning && (
          <Pressable style={styles.stopBtn} onPress={stopCamera} hitSlop={8}>
            <Text style={styles.stopBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Product panel ── */}
      {showPanel && (
        <View style={styles.panel}>

          {/* Category tabs */}
          <View style={styles.tabs}>
            {CATEGORY_TABS.map(tab => {
              const active = category === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => pickCategory(tab.key)}
                >
                  <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Color swatches */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatchRow}
          >
            {PRODUCTS[category].map(p => {
              const active = product.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.swatch,
                    { backgroundColor: p.color },
                    active && styles.swatchActive,
                  ]}
                  onPress={() => pickProduct(p)}
                />
              );
            })}
          </ScrollView>

          {/* Product info + CTA */}
          <View style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>{product.finish} · {product.price}</Text>
            </View>
            <Pressable
              style={[styles.saveBtn, saved && styles.saveBtnDone]}
              onPress={saveLook}
            >
              <Text style={styles.saveBtnText}>
                {saved ? 'Ajouté ✓' : 'Dans mon look'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },

  mirror: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    position: 'relative' as const,
    overflow: 'hidden' as any,
  },

  overlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(10,10,10,0.88)',
  },
  overlayIcon: { fontSize: 48, marginBottom: 16 },
  overlayTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 10,
  },
  overlaySub: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  overlayNote: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center' as const,
    marginTop: 14,
    lineHeight: 17,
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 22,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(139,105,82,0.50)' } as any : {}),
  },
  startBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },

  loadingText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    marginTop: 16,
  },
  loadingNote: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center' as const,
  },

  hintBar: {
    position: 'absolute' as const,
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },

  stopBtn: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  // Panel
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingBottom: 12,
  },

  tabs: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 9,
    gap: 5,
    borderRadius: 16,
    backgroundColor: colors.bg,
  },
  tabActive: { backgroundColor: colors.accent },
  tabEmoji: { fontSize: 14 },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.text,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },

  swatchRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.accent,
    transform: [{ scale: 1.18 }],
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 3px rgba(91,33,182,0.35)' } as any : {}),
  },

  productRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    gap: 12,
  },
  productName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  productMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveBtnDone: { backgroundColor: colors.success },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});
