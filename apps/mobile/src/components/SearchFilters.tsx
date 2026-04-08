import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import Button from './Button';

interface Filters {
  minRating: number | null;
  maxPrice: number | null;
  maxDistance: number | null;
  sortBy: string;
  isMobile: boolean;
}

interface SearchFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  initialFilters: Filters;
}

const PRICE_OPTIONS = [5000, 10000, 20000, 50000];
const DISTANCE_OPTIONS = [1, 3, 5, 10];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Note' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'distance', label: 'Distance' },
];

const defaultFilters: Filters = {
  minRating: null,
  maxPrice: null,
  maxDistance: null,
  sortBy: 'rating',
  isMobile: false,
};

function formatPrice(value: number): string {
  return value.toLocaleString('fr-FR') + ' FC';
}

export default function SearchFilters({
  visible,
  onClose,
  onApply,
  initialFilters,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible]);

  function handleReset() {
    setFilters(defaultFilters);
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}
          >
            {/* Se déplace */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Déplacement</Text>
              <Pressable
                onPress={() =>
                  setFilters((f) => ({ ...f, isMobile: !f.isMobile }))
                }
                style={[
                  styles.toggleRow,
                  filters.isMobile && styles.toggleRowActive,
                ]}
              >
                <Text style={styles.toggleIcon}>🚗</Text>
                <Text
                  style={[
                    styles.toggleText,
                    filters.isMobile && styles.toggleTextActive,
                  ]}
                >
                  Se déplace chez vous
                </Text>
                {filters.isMobile && (
                  <Text style={styles.toggleCheck}>✓</Text>
                )}
              </Pressable>
            </View>

            {/* Note minimum */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note minimum</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = filters.minRating === star;
                  return (
                    <Pressable
                      key={star}
                      onPress={() =>
                        setFilters((f) => ({
                          ...f,
                          minRating: f.minRating === star ? null : star,
                        }))
                      }
                      style={[
                        styles.starBtn,
                        active && styles.starBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.starText,
                          active && styles.starTextActive,
                        ]}
                      >
                        ★ {star}+
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Prix maximum */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prix maximum</Text>
              <View style={styles.chipRow}>
                {PRICE_OPTIONS.map((price) => {
                  const active = filters.maxPrice === price;
                  return (
                    <Pressable
                      key={price}
                      onPress={() =>
                        setFilters((f) => ({
                          ...f,
                          maxPrice: f.maxPrice === price ? null : price,
                        }))
                      }
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {formatPrice(price)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance</Text>
              <View style={styles.chipRow}>
                {DISTANCE_OPTIONS.map((dist) => {
                  const active = filters.maxDistance === dist;
                  return (
                    <Pressable
                      key={dist}
                      onPress={() =>
                        setFilters((f) => ({
                          ...f,
                          maxDistance: f.maxDistance === dist ? null : dist,
                        }))
                      }
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {dist} km
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Trier par */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier par</Text>
              {SORT_OPTIONS.map((opt) => {
                const active = filters.sortBy === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() =>
                      setFilters((f) => ({ ...f, sortBy: opt.value }))
                    }
                    style={styles.radioRow}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        active && styles.radioCircleActive,
                      ]}
                    >
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.footer}>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetText}>Reinitialiser</Text>
            </Pressable>
            <Button title="Appliquer" onPress={handleApply} size="md" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.accent,
  },
  closeBtn: {
    fontSize: 20,
    color: colors.textMuted,
    lineHeight: 24,
  },
  scrollContent: {
    flexGrow: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  starText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  starTextActive: {
    color: colors.white,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  toggleRowActive: {
    backgroundColor: 'rgba(139,105,82,0.08)',
    borderColor: colors.primary,
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  toggleTextActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  toggleCheck: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
});
