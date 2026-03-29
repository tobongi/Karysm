import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { showAlert } from '../../src/lib/alert';

export default function EditProfileScreen() {
  const { user, isProvider, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(isProvider);

  useEffect(() => {
    if (isProvider) {
      loadProviderProfile();
    }
  }, [isProvider]);

  async function loadProviderProfile() {
    try {
      const res: any = await api('/provider/profile');
      if (res.data) {
        setBio(res.data.bio || '');
        setWhatsapp(res.data.whatsappNumber || '');
        setInstagram(res.data.instagramHandle || '');
        setCity(res.data.city || '');
      }
    } catch {}
    setLoadingProvider(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      showAlert('Erreur', 'Le nom est requis.');
      return;
    }

    setSaving(true);
    try {
      // Update user name
      if (name.trim() !== user?.name) {
        const res: any = await api('/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ name: name.trim() }),
        });
        if (res.data && user) {
          await updateUser({ ...user, name: res.data.name });
        }
      }

      // Update provider fields if provider
      if (isProvider) {
        await api('/provider/profile', {
          method: 'PUT',
          body: JSON.stringify({
            bio: bio.trim() || null,
            whatsappNumber: whatsapp.trim() || null,
            instagramHandle: instagram.trim() || null,
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Modifier le profil</Text>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>NOM</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Phone (read-only) */}
        <View style={styles.field}>
          <Text style={styles.label}>TELEPHONE</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.disabledText}>{user?.phone}</Text>
          </View>
          <Text style={styles.hint}>Le numéro ne peut pas être modifié.</Text>
        </View>

        {/* Provider-only fields */}
        {isProvider && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Profil prestataire</Text>

            <View style={styles.field}>
              <Text style={styles.label}>BIO</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={bio}
                onChangeText={setBio}
                placeholder="Décrivez-vous en quelques lignes..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>WHATSAPP</Text>
              <TextInput
                style={styles.input}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="+243 812 345 678"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>INSTAGRAM</Text>
              <TextInput
                style={styles.input}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@votre_compte"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>VILLE</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.disabledText}>{city || 'Non définie'}</Text>
              </View>
              <Text style={styles.hint}>Contactez le support pour changer de ville.</Text>
            </View>
          </>
        )}

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 16 },

  field: { marginBottom: 20 },
  label: {
    fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { minHeight: 100 },
  inputDisabled: { backgroundColor: colors.cardHover },
  disabledText: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  hint: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 4 },
  charCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'right', marginTop: 4 },

  divider: {
    height: 1, backgroundColor: colors.border, marginVertical: 24,
  },

  saveButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 22,
    alignItems: 'center', marginTop: 12,
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: colors.white, fontSize: 17, fontFamily: 'Poppins_700Bold' },
});
