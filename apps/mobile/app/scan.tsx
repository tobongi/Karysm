import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { showAlert } from '../src/lib/alert';

const OBF_API = 'https://world.openbeautyfacts.org/api/v0/product';

type ScanState = 'idle' | 'detecting' | 'fetching' | 'found' | 'not_found' | 'error';

interface ProductInfo {
  name: string;
  brand: string;
  ingredients: string;
  categories: string[];
  imageUrl: string | null;
}

async function detectBarcode(dataUri: string): Promise<string | null> {
  const BarcodeDetector = (window as any).BarcodeDetector;
  if (!BarcodeDetector) return null;
  const detector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
  });
  const img = document.createElement('img');
  img.src = dataUri;
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });
  const barcodes: any[] = await detector.detect(img);
  return barcodes[0]?.rawValue ?? null;
}

async function fetchProduct(barcode: string): Promise<ProductInfo | null> {
  const res = await fetch(`${OBF_API}/${barcode}.json`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  return {
    name: p.product_name_fr || p.product_name || '',
    brand: p.brands || '',
    ingredients: p.ingredients_text_fr || p.ingredients_text || '',
    categories: (p.categories_tags || [])
      .map((t: string) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))
      .slice(0, 4),
    imageUrl: p.image_front_url || p.image_url || null,
  };
}

// ─── Native fallback ─────────────────────────────────────────────────────────

function NativeFallback() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.centered}>
        <Text style={styles.fallbackIcon}>📱</Text>
        <Text style={styles.fallbackTitle}>Disponible sur la webapp</Text>
        <Text style={styles.fallbackText}>
          Le scanner de produits cosmétiques fonctionne via{'\n'}app.karysm.com dans Chrome ou Edge.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const [state, setState] = useState<ScanState>('idle');
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);

  if (Platform.OS !== 'web') return <NativeFallback />;

  const handleScan = async () => {
    if (typeof (window as any).BarcodeDetector === 'undefined') {
      showAlert(
        'Navigateur non supporté',
        'Le scan de code-barres requiert Chrome 83+ ou Edge. Safari ne le supporte pas encore.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
    setState('detecting');

    try {
      const code = await detectBarcode(dataUri);
      if (!code) { setState('not_found'); return; }

      setBarcode(code);
      setState('fetching');

      const info = await fetchProduct(code);
      if (!info || !info.name) { setState('not_found'); return; }

      setProduct(info);
      setState('found');
    } catch {
      setState('error');
    }
  };

  const reset = () => { setState('idle'); setProduct(null); setBarcode(null); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scanner un produit</Text>
        <Text style={styles.subtitle}>
          Photographiez le code-barres d'un produit cosmétique pour lire ses ingrédients
        </Text>

        {/* ── Idle ── */}
        {state === 'idle' && (
          <>
            <View style={styles.scanZone}>
              <Text style={styles.scanZoneIcon}>▬▬▬▬▬▬▬▬▬</Text>
              <Text style={styles.scanZoneHint}>Visez le code-barres EAN / UPC</Text>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
            </View>
            <Pressable style={styles.primaryBtn} onPress={handleScan}>
              <Text style={styles.primaryBtnText}>📷  Prendre une photo</Text>
            </Pressable>
            <Text style={styles.supportNote}>Compatible Chrome et Edge · Open Beauty Facts</Text>
          </>
        )}

        {/* ── Loading ── */}
        {(state === 'detecting' || state === 'fetching') && (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>
              {state === 'detecting' ? 'Lecture du code-barres...' : 'Recherche du produit...'}
            </Text>
          </View>
        )}

        {/* ── Not found ── */}
        {state === 'not_found' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>🔍</Text>
            <Text style={styles.stateTitle}>Produit non trouvé</Text>
            <Text style={styles.stateBody}>
              Ce code-barres n'est pas dans la base de données cosmétique.
              Assurez-vous qu'il s'agit d'un produit de beauté.
            </Text>
            {barcode ? <Text style={styles.barcodeChip}>Code : {barcode}</Text> : null}
            <Pressable style={styles.ghostBtn} onPress={reset}>
              <Text style={styles.ghostBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>⚠️</Text>
            <Text style={styles.stateTitle}>Code-barres illisible</Text>
            <Text style={styles.stateBody}>
              Assurez-vous que le code-barres est net, bien éclairé et entièrement visible.
            </Text>
            <Pressable style={styles.ghostBtn} onPress={reset}>
              <Text style={styles.ghostBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {/* ── Found ── */}
        {state === 'found' && product && (
          <View style={styles.productCard}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.productName}>{product.name || 'Produit cosmétique'}</Text>
            {product.brand ? (
              <Text style={styles.productBrand}>{product.brand}</Text>
            ) : null}
            {barcode ? (
              <Text style={styles.barcodeChip}>EAN {barcode}</Text>
            ) : null}

            {product.categories.length > 0 && (
              <View style={styles.chipsRow}>
                {product.categories.map((c, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {product.ingredients ? (
              <View style={styles.ingredientsBox}>
                <Text style={styles.ingredientsLabel}>INGRÉDIENTS</Text>
                <Text style={styles.ingredientsText}>{product.ingredients}</Text>
              </View>
            ) : (
              <Text style={styles.noIngredients}>Ingrédients non disponibles dans la base</Text>
            )}

            <Pressable style={styles.ghostBtn} onPress={reset}>
              <Text style={styles.ghostBtnText}>Scanner un autre produit</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 80 },

  title: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },

  // Scan zone
  scanZone: {
    height: 200, backgroundColor: colors.primaryGhost,
    borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primaryBorder,
    position: 'relative', marginBottom: 20,
  },
  scanZoneIcon: { fontSize: 20, color: colors.textMuted, letterSpacing: 2, marginBottom: 12 },
  scanZoneHint: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.primaryDark },

  // Corner brackets
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.accent },
  cTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  supportNote: {
    textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_400Regular',
    color: colors.textMuted, marginTop: 12,
  },

  // Primary button
  primaryBtn: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 22, alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(139,105,82,0.35)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }
    ) as any,
  },
  primaryBtnText: { color: colors.white, fontSize: 17, fontFamily: 'Poppins_700Bold' },

  // Ghost button
  ghostBtn: {
    marginTop: 16, backgroundColor: colors.primaryGhost,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder,
    alignSelf: 'center',
  },
  ghostBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // State card (loading / error / not found)
  stateCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  stateIcon: { fontSize: 40, marginBottom: 12 },
  stateTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 8 },
  stateText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary, marginTop: 16 },
  stateBody: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  barcodeChip: {
    marginTop: 10, fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted,
    backgroundColor: colors.n300, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },

  // Product card
  productCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  productImage: {
    width: '100%', height: 200, borderRadius: 16, marginBottom: 16,
    backgroundColor: colors.n300,
  },
  productName: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 4 },
  productBrand: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: colors.primaryGhost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  chipText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.primaryDark },
  ingredientsBox: {
    backgroundColor: colors.bg, borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  ingredientsLabel: {
    fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 8,
  },
  ingredientsText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },
  noIngredients: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center', marginVertical: 12 },

  // Native fallback
  fallbackIcon: { fontSize: 48, marginBottom: 16 },
  fallbackTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent, textAlign: 'center', marginBottom: 10 },
  fallbackText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
});
