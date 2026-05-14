import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { showAlert } from '../../src/lib/alert';
import { pickAndUploadAvatar } from '../../src/lib/upload';
import { TabCrossfade } from '../../src/components/animations';

// ─── Curved Header ──────────────────────────────────────────────────────────

const HEADER_H = 180;
const CURVE_DIP = 45;
const W = Platform.OS === 'web' ? 480 : 420;

function ProfileHeader({
  name,
  avatar,
  onAvatarPress,
  uploading,
}: {
  name: string;
  avatar: string | null;
  onAvatarPress: () => void;
  uploading: boolean;
}) {
  const totalH = HEADER_H + CURVE_DIP;
  const d = `M0,0 L0,${HEADER_H} C${W * 0.3},${HEADER_H + CURVE_DIP} ${W * 0.7},${HEADER_H - CURVE_DIP * 0.6} ${W},${HEADER_H - 15} L${W},0 Z`;

  return (
    <View style={headerStyles.wrap}>
      <View style={{ height: totalH + 40 }}>
        <Svg width={W} height={totalH} viewBox={`0 0 ${W} ${totalH}`} style={StyleSheet.absoluteFill}>
          <Path d={d} fill={colors.headerDark} />
        </Svg>

        {/* Back button */}
        <Pressable style={headerStyles.back} onPress={() => router.back()} hitSlop={8}>
          <IconArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        {/* Title */}
        <Text style={headerStyles.title}>Mon profil</Text>

        {/* Avatar — overlaps curve */}
        <Pressable style={headerStyles.avatarWrap} onPress={onAvatarPress}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={headerStyles.avatar} />
          ) : (
            <View style={headerStyles.avatar}>
              <Text style={headerStyles.avatarInitial}>{name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={headerStyles.cameraBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <IconCamera size={14} color="#FFF" strokeWidth={2} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: { width: '100%' },
  back: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 24,
    alignSelf: 'center',
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    zIndex: 3,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
});

// ─── Tab Pill ───────────────────────────────────────────────────────────────

function TabPills({
  active,
  onChange,
  isProvider,
}: {
  active: 'client' | 'provider';
  onChange: (tab: 'client' | 'provider') => void;
  isProvider: boolean;
}) {
  return (
    <View style={tabStyles.row}>
      <Pressable
        style={[tabStyles.pill, active === 'client' && tabStyles.pillActive]}
        onPress={() => onChange('client')}
      >
        <Text style={[tabStyles.pillText, active === 'client' && tabStyles.pillTextActive]}>
          Cliente
        </Text>
      </Pressable>
      {isProvider && (
        <Pressable
          style={[tabStyles.pill, active === 'provider' && tabStyles.pillActive]}
          onPress={() => onChange('provider')}
        >
          <Text style={[tabStyles.pillText, active === 'provider' && tabStyles.pillTextActive]}>
            Prestataire
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.headerDark,
    borderColor: colors.headerDark,
  },
  pillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { user, isProvider, updateUser } = useAuth();
  const [tab, setTab] = useState<'client' | 'provider'>(isProvider ? 'provider' : 'client');
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(isProvider);

  useEffect(() => {
    if (isProvider) loadProviderProfile();
  }, [isProvider]);

  async function loadProviderProfile() {
    try {
      const res: any = await api('/provider/profile');
      if (res.data) {
        setBio(res.data.bio || '');
        setWhatsapp(res.data.whatsappNumber || '');
        setInstagram(res.data.instagramHandle || '');
        setTiktok(res.data.tiktokHandle || '');
        setCity(res.data.city || '');
      }
    } catch {}
    setLoadingProvider(false);
  }

  async function handleAvatarUpload() {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar();
      if (!url) { setUploadingAvatar(false); return; }
      setAvatar(url);
      if (isProvider) {
        try { await api('/provider/profile', { method: 'PUT', body: JSON.stringify({ avatarUrl: url }) }); } catch {}
      }
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer la photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      showAlert('Erreur', 'Le nom est requis.');
      return;
    }
    setSaving(true);
    try {
      if (name.trim() !== user?.name) {
        const res: any = await api('/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ name: name.trim() }),
        });
        if (res.data && user) await updateUser({ ...user, name: res.data.name });
      }
      if (isProvider) {
        await api('/provider/profile', {
          method: 'PUT',
          body: JSON.stringify({
            bio: bio.trim() || null,
            whatsappNumber: whatsapp.trim() || null,
            instagramHandle: instagram.trim() || null,
            tiktokHandle: tiktok.trim() || null,
          }),
        });
      }
      showAlert('Enregistré', 'Votre profil a été mis à jour.');
      router.back();
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProvider) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.webWrapper}>
          {/* Curved header with avatar */}
          <ProfileHeader
            name={name}
            avatar={avatar}
            onAvatarPress={handleAvatarUpload}
            uploading={uploadingAvatar}
          />

          {/* Tab pills */}
          <TabPills active={tab} onChange={setTab} isProvider={isProvider} />

          {/* ── Tab: Cliente ── */}
          <TabCrossfade active={tab === 'client'}>
            <View style={styles.formArea}>
              <Field label="Nom" value={name} onChangeText={setName} placeholder="Votre nom" helper="Visible sur votre profil public" />
              <Field label="Téléphone" value={user?.phone || ''} editable={false} hint="Le numéro ne peut pas être modifié." />
            </View>
          </TabCrossfade>

          {/* ── Tab: Prestataire ── */}
          <TabCrossfade active={tab === 'provider' && isProvider}>
            <View style={styles.formArea}>
              <Field
                label="Nom professionnel"
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                helper="Affiché sur votre profil public"
              />
              <Field
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Décrivez votre activité en quelques lignes..."
                multiline
                maxLength={500}
                charCount
                helper="500 caractères max"
              />
              <Field
                label="WhatsApp"
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="+243 812 345 678"
                keyboardType="phone-pad"
                helper="Pour que les clientes vous contactent"
              />
              <Field
                label="Instagram"
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@votre_compte"
                autoCapitalize="none"
                helper="Votre identifiant Instagram"
              />
              <Field
                label="TikTok"
                value={tiktok}
                onChangeText={setTiktok}
                placeholder="@votre_compte"
                autoCapitalize="none"
                helper="Votre identifiant TikTok"
              />
              <Field label="Ville" value={city || 'Non définie'} editable={false} hint="Contactez le support pour changer de ville." />
            </View>
          </TabCrossfade>

          {/* Save button */}
          <View style={styles.formArea}>
            <Pressable
              style={[styles.saveButton, saving && styles.saveDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Reusable Field ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  hint,
  helper,
  multiline,
  maxLength,
  charCount,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  hint?: string;
  helper?: string;
  multiline?: boolean;
  maxLength?: number;
  charCount?: boolean;
  keyboardType?: 'phone-pad' | 'default';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      ) : (
        <View style={styles.input}>
          <Text style={styles.disabledText}>{value}</Text>
        </View>
      )}
      {charCount && maxLength && (
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      )}
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webWrapper: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },

  // Form
  formArea: {
    paddingHorizontal: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.terracotta,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  inputMulti: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    textAlignVertical: 'top',
  },
  disabledText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 6,
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },

  // Save
  saveButton: {
    backgroundColor: colors.headerDark,
    paddingVertical: 16,
    borderRadius: 27,
    alignItems: 'center',
    marginTop: 8,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 6,
  },
});
