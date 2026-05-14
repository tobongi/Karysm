import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconAlertTriangle from '@tabler/icons-react-native/dist/esm/icons/IconAlertTriangle.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconDroplet from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import IconEye from '@tabler/icons-react-native/dist/esm/icons/IconEye.mjs';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';

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

const CATEGORY_TABS: Array<{ key: TryOnCategory; label: string; Icon: React.ComponentType<{size:number;color:string}> }> = [
  { key: 'levres', label: 'Lèvres', Icon: IconDroplet },
  { key: 'joues',  label: 'Joues',  Icon: IconSparkles },
  { key: 'yeux',   label: 'Yeux',   Icon: IconEye },
];

// ─── MediaPipe landmark indices ─────────────────────────────────────────────
// All indices verified for face_mesh 0.4 with refineLandmarks: true

// Outer lip: upper arc (left corner → cupid's bow → right corner)
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
// Outer lip: lower arc (right corner → chin ridge → left corner)
const LOWER_LIP_OUTER = [291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
// Inner lip edge (upper philtrum ridge) — defines the mouth opening
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
// Inner lip edge (lower)
const LOWER_LIP_INNER = [308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// Zygomatic cheek clusters — centroid gives apple-of-cheek position
const LEFT_CHEEK_IDX  = [116, 117, 118, 101, 36, 205, 50];
const RIGHT_CHEEK_IDX = [345, 346, 347, 330, 266, 425, 280];

// Upper eyelid contour (outer corner → inner corner across the lash line)
const RIGHT_EYE_UPPER = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const LEFT_EYE_UPPER  = [263, 466, 388, 387, 386, 385, 384, 398, 362];

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

function centroid(lm: any[], idxs: number[], W: number, H: number): [number, number] {
  let sx = 0, sy = 0;
  for (const i of idxs) { sx += lm[i].x; sy += lm[i].y; }
  return [sx / idxs.length * W, sy / idxs.length * H];
}

// Smooth closed curve through pts using midpoint-anchored quadratic beziers.
// Draws a subpath — caller must ctx.beginPath() first (or just moveTo from prior subpath).
function smoothClosedCurve(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  const n = pts.length;
  if (n < 3) return;
  ctx.moveTo(
    (pts[n - 1][0] + pts[0][0]) / 2,
    (pts[n - 1][1] + pts[0][1]) / 2,
  );
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const nxt = pts[(i + 1) % n];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + nxt[0]) / 2, (p[1] + nxt[1]) / 2);
  }
}

function drawLips(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  color: string,
  opacity: number,
  finish: string,
  W: number,
  H: number,
) {
  // Build outer polygon (upper arc + lower arc, corners shared)
  const outerPts = [
    ...UPPER_LIP_OUTER.map(i => lmPt(lm, i, W, H)),
    ...LOWER_LIP_OUTER.slice(1, -1).map(i => lmPt(lm, i, W, H)),
  ];
  // Build inner polygon (mouth opening) for evenodd hole
  const innerPts = [
    ...UPPER_LIP_INNER.map(i => lmPt(lm, i, W, H)),
    ...LOWER_LIP_INNER.slice(1, -1).map(i => lmPt(lm, i, W, H)),
  ];

  // Fill lip color — evenodd rule punches inner opening as transparent
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color;
  ctx.beginPath();
  smoothClosedCurve(ctx, outerPts);
  smoothClosedCurve(ctx, innerPts);
  ctx.fill('evenodd');
  ctx.restore();

  // Gloss / Satin highlight: linear gradient from upper lip down
  if (finish === 'Gloss' || finish === 'Satin') {
    const [cx, topY] = lmPt(lm, 0, W, H);  // Cupid's bow center
    const [, botY]   = lmPt(lm, 17, W, H); // chin ridge center
    const midY = topY + (botY - topY) * 0.45;
    const grad = ctx.createLinearGradient(cx, topY - 2, cx, midY + 4);
    grad.addColorStop(0,   'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.beginPath();
    smoothClosedCurve(ctx, outerPts);
    smoothClosedCurve(ctx, innerPts);
    ctx.fill('evenodd');
    ctx.restore();
  }
}

function drawBlush(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  color: string,
  opacity: number,
  W: number,
  H: number,
) {
  // Face width for radius scaling (cheekbone-to-cheekbone)
  const faceW = Math.abs(lm[454].x - lm[234].x) * W;
  const rx = faceW * 0.13;
  const ry = rx * 0.68;
  // Slight diagonal tilt toward nose (~15°)
  const tilt = -Math.PI / 12;

  ctx.save();
  // soft-light blends beautifully on all skin tones without darkening dark skin
  ctx.globalCompositeOperation = 'soft-light';

  for (const clusterIdxs of [LEFT_CHEEK_IDX, RIGHT_CHEEK_IDX]) {
    const [cx, cy] = centroid(lm, clusterIdxs, W, H);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0,    hexToRgba(color, opacity));
    grad.addColorStop(0.55, hexToRgba(color, opacity * 0.35));
    grad.addColorStop(1,    hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI * 2);
    ctx.fill();
  }

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
  // Shadow height scales with face height (~4.5%)
  const faceH = Math.abs(lm[10].y - lm[152].y) * H;
  const shadowH = faceH * 0.045;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  for (const eyeIdxs of [RIGHT_EYE_UPPER, LEFT_EYE_UPPER]) {
    const lidPts = eyeIdxs.map(i => lmPt(lm, i, W, H));
    // Shift each lid point upward to form the top edge of the shadow band
    const upPts: [number, number][] = lidPts.map(([x, y]) => [x, y - shadowH]);

    const botY = Math.max(...lidPts.map(p => p[1]));
    const topY = Math.min(...upPts.map(p => p[1]));
    const cx   = lidPts.reduce((a, p) => a + p[0], 0) / lidPts.length;

    // Gradient: opaque at lash line, transparent at top edge
    const grad = ctx.createLinearGradient(cx, botY, cx, topY);
    grad.addColorStop(0,    hexToRgba(color, opacity));
    grad.addColorStop(0.45, hexToRgba(color, opacity * 0.5));
    grad.addColorStop(1,    hexToRgba(color, 0));
    ctx.fillStyle = grad;

    // Band shape: upper boundary → reversed lid points → close
    ctx.beginPath();
    ctx.moveTo(upPts[0][0], upPts[0][1]);
    for (const p of upPts.slice(1)) ctx.lineTo(p[0], p[1]);
    for (const p of [...lidPts].reverse()) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fill();
  }

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
  if (category === 'levres')
    drawLips(ctx, lm, product.color, product.opacity, product.finish, W, H);
  else if (category === 'joues')
    drawBlush(ctx, lm, product.color, product.opacity, W, H);
  else
    drawEyeShadow(ctx, lm, product.color, product.opacity, W, H);
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
        <IconSparkles size={48} color={colors.accent} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60, gap: 16 },
  title: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20 },
  btnText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});

const API_BASE = 'https://tokoss-production.up.railway.app';

// ─── Main ────────────────────────────────────────────────────────────────────

export default function VirtualTryOnScreen() {
  if (Platform.OS !== 'web') return <NativeFallback />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { token } = useAuth();

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
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorTip, setAdvisorTip]         = useState<string | null>(null);

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
      'object-fit:cover;transform:scaleX(-1);pointer-events:none;';

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
    setAdvisorTip(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Caméra non supportée par ce navigateur');
      }

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
    setAdvisorTip(null);
  }, []);

  const pickCategory = useCallback((cat: TryOnCategory) => {
    setCategory(cat);
    categoryRef.current = cat;
    const first = PRODUCTS[cat][0];
    setProduct(first);
    productRef.current = first;
    setAdvisorTip(null);
  }, []);

  const pickProduct = useCallback((p: Product) => {
    setProduct(p);
    productRef.current = p;
    setAdvisorTip(null);
  }, []);

  const saveLook = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  // Captures a JPEG frame from the live video feed
  const getAIAdvice = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    // Snapshot the current frame
    const tmp = document.createElement('canvas');
    tmp.width  = video.videoWidth;
    tmp.height = video.videoHeight;
    tmp.getContext('2d')!.drawImage(video, 0, 0);
    const imageBase64 = tmp.toDataURL('image/jpeg', 0.70).split(',')[1];

    const p   = productRef.current;
    const cat = categoryRef.current;

    setAdvisorLoading(true);
    setAdvisorTip(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/makeup-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image: imageBase64,
          category: cat,
          productName: p.name,
          color: p.color,
          finish: p.finish,
        }),
      });
      const json = await res.json();
      setAdvisorTip(json.success ? json.data.advice : 'Conseil non disponible.');
    } catch {
      setAdvisorTip('Conseil non disponible pour le moment.');
    } finally {
      setAdvisorLoading(false);
    }
  }, [token]);

  const isRunning = tryOnState === 'ready';
  const showPanel = tryOnState === 'ready' || tryOnState === 'idle';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Camera / Mirror area ── */}
      <View ref={containerRef} style={styles.mirror}>

        {/* Idle */}
        {tryOnState === 'idle' && (
          <View style={styles.overlay}>
            <IconSparkles size={48} color={colors.primary} />
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
            <IconAlertTriangle size={48} color={colors.error} />
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
            <IconX size={15} color="#FFFFFF" />
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
                  <tab.Icon size={14} color={active ? '#FFFFFF' : colors.text} />
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

          {/* Product info + CTAs */}
          <View style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>{product.finish} · {product.price}</Text>
            </View>
            {isRunning && (
              <Pressable
                style={[styles.advisorBtn, advisorLoading && styles.advisorBtnLoading]}
                onPress={getAIAdvice}
                disabled={advisorLoading}
              >
                <Text style={styles.advisorBtnText}>
                  {advisorLoading ? '…' : 'Conseil IA'}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveBtn, saved && styles.saveBtnDone]}
              onPress={saveLook}
            >
              <Text style={styles.saveBtnText}>
                {saved ? 'Ajouté' : 'Dans mon look'}
              </Text>
            </Pressable>
          </View>

          {/* AI advisor tip */}
          {advisorTip && (
            <View style={styles.advisorCard}>
              <Text style={styles.advisorCardLabel}>Conseil IA</Text>
              <Text style={styles.advisorCardText}>{advisorTip}</Text>
              <Pressable onPress={() => setAdvisorTip(null)} hitSlop={8}>
                <Text style={styles.advisorCardDismiss}>Fermer</Text>
              </Pressable>
            </View>
          )}
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
  stopBtnInner: { justifyContent: 'center', alignItems: 'center' },

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
    gap: 8,
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

  advisorBtn: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  advisorBtnLoading: { opacity: 0.55 },
  advisorBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },

  saveBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveBtnDone: { backgroundColor: colors.success },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },

  advisorCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F5F0FF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  advisorCardLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.accent,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  advisorCardText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  advisorCardDismiss: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
    textAlign: 'right' as const,
  },
});
