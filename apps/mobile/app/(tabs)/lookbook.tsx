import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale } from '../../src/components/animations';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { imgUrl } from '../../src/lib/image';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';

interface FeedProvider {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  avgRating: number;
  avatar: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

interface FeedItem {
  id: string;
  imageUrl: string | null;
  caption: string | null;
  serviceTag: string | null;
  savedCount: number;
  createdAt: string;
  provider: FeedProvider;
}

const CATEGORY_FILTERS = [
  { key: null, label: 'Tout' },
  { key: 'coiffure', label: 'Coiffure' },
  { key: 'ongles', label: 'Ongles' },
  { key: 'maquillage', label: 'Maquillage' },
  { key: 'soins', label: 'Soins' },
  { key: 'barber', label: 'Barber' },
  { key: 'spa', label: 'Spa' },
];

const MOCK_IMAGES: Record<string, any> = {
  // Coiffure
  m1:  require('../../assets/images/lookbook/look_coif_bantu_knots.webp'),
  m2:  require('../../assets/images/lookbook/look_coif_box_braids.webp'),
  m3:  require('../../assets/images/lookbook/look_coif_braids_beads.webp'),
  m4:  require('../../assets/images/lookbook/look_coif_cornrows_fulani.webp'),
  m5:  require('../../assets/images/lookbook/look_coif_faux_locs_short.webp'),
  m6:  require('../../assets/images/lookbook/look_coif_goddess_braids.webp'),
  m7:  require('../../assets/images/lookbook/look_coif_lace_wig_straight.webp'),
  m8:  require('../../assets/images/lookbook/look_coif_lace_wig_wavy.webp'),
  m9:  require('../../assets/images/lookbook/look_coif_locs_retwist.webp'),
  m10: require('../../assets/images/lookbook/look_coif_senegalese_twist.webp'),
  // Ongles
  m11: require('../../assets/images/lookbook/look_ongles_amande_nude.webp'),
  m12: require('../../assets/images/lookbook/look_ongles_chrome_silver.webp'),
  m13: require('../../assets/images/lookbook/look_ongles_coffin_violet.webp'),
  m14: require('../../assets/images/lookbook/look_ongles_floral_art.webp'),
  m15: require('../../assets/images/lookbook/look_ongles_french_classic.webp'),
  m16: require('../../assets/images/lookbook/look_ongles_gel_marble.webp'),
  m17: require('../../assets/images/lookbook/look_ongles_nail_art_gold.webp'),
  m18: require('../../assets/images/lookbook/look_ongles_pedi_corail.webp'),
  m19: require('../../assets/images/lookbook/look_ongles_short_natural.webp'),
  m20: require('../../assets/images/lookbook/look_ongles_stiletto_strass.webp'),
  // Maquillage
  m21: require('../../assets/images/lookbook/look_maq_contour_bronze.webp'),
  m22: require('../../assets/images/lookbook/look_maq_cut_crease_gold.webp'),
  m23: require('../../assets/images/lookbook/look_maq_evening_glam.webp'),
  m24: require('../../assets/images/lookbook/look_maq_glitter_eyes.webp'),
  m25: require('../../assets/images/lookbook/look_maq_graphic_liner.webp'),
  m26: require('../../assets/images/lookbook/look_maq_mariee_lumineux.webp'),
  m27: require('../../assets/images/lookbook/look_maq_natural_day.webp'),
  m28: require('../../assets/images/lookbook/look_maq_no_makeup.webp'),
  m29: require('../../assets/images/lookbook/look_maq_red_lip.webp'),
  m30: require('../../assets/images/lookbook/look_maq_smoky_violet.webp'),
  // Soins
  m31: require('../../assets/images/lookbook/look_soin_body_scrub.webp'),
  m32: require('../../assets/images/lookbook/look_soin_cuir_chevelu.webp'),
  m33: require('../../assets/images/lookbook/look_soin_deep_condition.webp'),
  m34: require('../../assets/images/lookbook/look_soin_exfoliation.webp'),
  m35: require('../../assets/images/lookbook/look_soin_hydratant_masque.webp'),
  m36: require('../../assets/images/lookbook/look_soin_karite_4c.webp'),
  m37: require('../../assets/images/lookbook/look_soin_loc_method.webp'),
  m38: require('../../assets/images/lookbook/look_soin_massage_huiles.webp'),
  m39: require('../../assets/images/lookbook/look_soin_routine_matin.webp'),
  m40: require('../../assets/images/lookbook/look_soin_vitamin_c.webp'),
  // Barber
  m41: require('../../assets/images/lookbook/look_barber_beard_trim.webp'),
  m42: require('../../assets/images/lookbook/look_barber_buzz.webp'),
  m43: require('../../assets/images/lookbook/look_barber_classic_afro.webp'),
  m44: require('../../assets/images/lookbook/look_barber_fade_beard.webp'),
  m45: require('../../assets/images/lookbook/look_barber_frohawk.webp'),
  m46: require('../../assets/images/lookbook/look_barber_hair_design.webp'),
  m47: require('../../assets/images/lookbook/look_barber_high_top.webp'),
  m48: require('../../assets/images/lookbook/look_barber_lineup.webp'),
  m49: require('../../assets/images/lookbook/look_barber_low_fade_full.webp'),
  m50: require('../../assets/images/lookbook/look_barber_tapered.webp'),
  // Spa
  m51: require('../../assets/images/lookbook/look_spa_body_wrap.webp'),
  m52: require('../../assets/images/lookbook/look_spa_chocolate_wrap.webp'),
  m53: require('../../assets/images/lookbook/look_spa_clay_face.webp'),
  m54: require('../../assets/images/lookbook/look_spa_floral_bath.webp'),
  m55: require('../../assets/images/lookbook/look_spa_hammam_miel.webp'),
  m56: require('../../assets/images/lookbook/look_spa_hot_stones.webp'),
  m57: require('../../assets/images/lookbook/look_spa_infrared.webp'),
  m58: require('../../assets/images/lookbook/look_spa_reflexologie.webp'),
  m59: require('../../assets/images/lookbook/look_spa_sauna_wood.webp'),
  m60: require('../../assets/images/lookbook/look_spa_swedish_massage.webp'),
};

const _p = (id: string, slug: string, name: string, city: string, rating: number): FeedProvider => ({
  id, slug, displayName: name, city, avgRating: rating, avatar: null, instagramHandle: null, tiktokHandle: null,
});

const MOCK_FEED: FeedItem[] = [
  // Coiffure
  { id: 'm1',  imageUrl: null, caption: 'Bantu knots sur cheveux naturels',        serviceTag: 'coiffure',   savedCount: 28, createdAt: '2026-04-01T10:00:00Z', provider: _p('p1', 'amina-beauty',      'Amina Beauty',      'Kinshasa',   4.8) },
  { id: 'm2',  imageUrl: null, caption: 'Box braids caramel mi-dos',               serviceTag: 'coiffure',   savedCount: 31, createdAt: '2026-04-02T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm3',  imageUrl: null, caption: 'Tresses avec perles dorées',              serviceTag: 'coiffure',   savedCount: 24, createdAt: '2026-04-03T10:00:00Z', provider: _p('p1', 'amina-beauty',      'Amina Beauty',      'Kinshasa',   4.8) },
  { id: 'm4',  imageUrl: null, caption: 'Cornrows Fulani avec pendentifs',         serviceTag: 'coiffure',   savedCount: 36, createdAt: '2026-04-04T10:00:00Z', provider: _p('p9', 'aissatou-njoya',    'Aissatou Njoya',    'Douala',     4.9) },
  { id: 'm5',  imageUrl: null, caption: 'Faux locs courts châtain',                serviceTag: 'coiffure',   savedCount: 19, createdAt: '2026-04-05T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm6',  imageUrl: null, caption: 'Goddess braids couronne',                 serviceTag: 'coiffure',   savedCount: 42, createdAt: '2026-04-06T10:00:00Z', provider: _p('p1', 'amina-beauty',      'Amina Beauty',      'Kinshasa',   4.8) },
  { id: 'm7',  imageUrl: null, caption: 'Lace wig lisse HD — pose invisible',      serviceTag: 'coiffure',   savedCount: 33, createdAt: '2026-04-07T10:00:00Z', provider: _p('p9', 'aissatou-njoya',    'Aissatou Njoya',    'Douala',     4.9) },
  { id: 'm8',  imageUrl: null, caption: 'Lace wig ondulée naturelle',              serviceTag: 'coiffure',   savedCount: 21, createdAt: '2026-04-08T10:00:00Z', provider: _p('p9', 'aissatou-njoya',    'Aissatou Njoya',    'Douala',     4.9) },
  { id: 'm9',  imageUrl: null, caption: 'Retwist locs — racines propres',          serviceTag: 'coiffure',   savedCount: 17, createdAt: '2026-04-09T10:00:00Z', provider: _p('p1', 'amina-beauty',      'Amina Beauty',      'Kinshasa',   4.8) },
  { id: 'm10', imageUrl: null, caption: 'Senegalese twist cuivré',                 serviceTag: 'coiffure',   savedCount: 26, createdAt: '2026-04-10T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  // Ongles
  { id: 'm11', imageUrl: null, caption: 'Ongles amande nude délicat',              serviceTag: 'ongles',     savedCount: 14, createdAt: '2026-04-11T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  { id: 'm12', imageUrl: null, caption: 'Chrome argent miroir',                    serviceTag: 'ongles',     savedCount: 22, createdAt: '2026-04-12T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm13', imageUrl: null, caption: 'Coffin violet mat & brillant',            serviceTag: 'ongles',     savedCount: 18, createdAt: '2026-04-13T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  { id: 'm14', imageUrl: null, caption: 'Nail art floral printemps',               serviceTag: 'ongles',     savedCount: 29, createdAt: '2026-04-14T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm15', imageUrl: null, caption: 'French manucure classique',               serviceTag: 'ongles',     savedCount: 11, createdAt: '2026-04-15T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  { id: 'm16', imageUrl: null, caption: 'Gel UV effet marbre rose',                serviceTag: 'ongles',     savedCount: 35, createdAt: '2026-04-16T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm17', imageUrl: null, caption: "Nail art feuille d'or",                   serviceTag: 'ongles',     savedCount: 27, createdAt: '2026-04-17T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  { id: 'm18', imageUrl: null, caption: 'Pédicure semi-permanent corail',          serviceTag: 'ongles',     savedCount: 15, createdAt: '2026-04-18T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  { id: 'm19', imageUrl: null, caption: 'Ongles courts gel naturel',               serviceTag: 'ongles',     savedCount: 9,  createdAt: '2026-04-19T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm20', imageUrl: null, caption: 'Stiletto strass Swarovski',               serviceTag: 'ongles',     savedCount: 40, createdAt: '2026-04-20T10:00:00Z', provider: _p('p2', 'nails-by-grace',    'Nails by Grace',    'Kinshasa',   4.9) },
  // Maquillage
  { id: 'm21', imageUrl: null, caption: 'Contour & bronze naturel',                serviceTag: 'maquillage', savedCount: 16, createdAt: '2026-04-21T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm22', imageUrl: null, caption: 'Cut crease violet & or',                  serviceTag: 'maquillage', savedCount: 33, createdAt: '2026-04-22T10:00:00Z', provider: _p('p12','fatou-diallo',      'Fatou Diallo',      'Dakar',      4.7) },
  { id: 'm23', imageUrl: null, caption: 'Glam du soir — smoky profond',            serviceTag: 'maquillage', savedCount: 38, createdAt: '2026-04-23T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm24', imageUrl: null, caption: 'Yeux à paillettes dorées',                serviceTag: 'maquillage', savedCount: 25, createdAt: '2026-04-24T10:00:00Z', provider: _p('p12','fatou-diallo',      'Fatou Diallo',      'Dakar',      4.7) },
  { id: 'm25', imageUrl: null, caption: 'Graphic liner géométrique',               serviceTag: 'maquillage', savedCount: 20, createdAt: '2026-04-25T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm26', imageUrl: null, caption: 'Mariée — teint lumineux satiné',          serviceTag: 'maquillage', savedCount: 45, createdAt: '2026-04-26T10:00:00Z', provider: _p('p12','fatou-diallo',      'Fatou Diallo',      'Dakar',      4.7) },
  { id: 'm27', imageUrl: null, caption: 'Natural everyday — bonne mine',           serviceTag: 'maquillage', savedCount: 12, createdAt: '2026-04-27T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm28', imageUrl: null, caption: 'No makeup makeup look',                   serviceTag: 'maquillage', savedCount: 19, createdAt: '2026-04-28T10:00:00Z', provider: _p('p12','fatou-diallo',      'Fatou Diallo',      'Dakar',      4.7) },
  { id: 'm29', imageUrl: null, caption: 'Lèvres rouge classique & éclat',          serviceTag: 'maquillage', savedCount: 31, createdAt: '2026-04-29T10:00:00Z', provider: _p('p6', 'nadia-obame',       'Nadia Obame',       'Libreville', 4.5) },
  { id: 'm30', imageUrl: null, caption: 'Smoky violet intense',                    serviceTag: 'maquillage', savedCount: 44, createdAt: '2026-04-30T10:00:00Z', provider: _p('p12','fatou-diallo',      'Fatou Diallo',      'Dakar',      4.7) },
  // Soins
  { id: 'm31', imageUrl: null, caption: 'Gommage corps karité & miel',             serviceTag: 'soins',      savedCount: 13, createdAt: '2026-05-01T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm32', imageUrl: null, caption: 'Soin cuir chevelu revitalisant',          serviceTag: 'soins',      savedCount: 17, createdAt: '2026-05-02T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm33', imageUrl: null, caption: 'Deep conditioning cheveux secs',          serviceTag: 'soins',      savedCount: 22, createdAt: '2026-05-03T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm34', imageUrl: null, caption: 'Exfoliation douce au sucre de canne',     serviceTag: 'soins',      savedCount: 8,  createdAt: '2026-05-04T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm35', imageUrl: null, caption: 'Masque hydratant aloe vera',              serviceTag: 'soins',      savedCount: 11, createdAt: '2026-05-05T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm36', imageUrl: null, caption: 'Soin karité sur cheveux 4C',              serviceTag: 'soins',      savedCount: 26, createdAt: '2026-05-06T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm37', imageUrl: null, caption: 'Méthode L.O.C sur naturels',              serviceTag: 'soins',      savedCount: 18, createdAt: '2026-05-07T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  { id: 'm38', imageUrl: null, caption: 'Massage aux huiles chaudes',              serviceTag: 'soins',      savedCount: 14, createdAt: '2026-05-08T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm39', imageUrl: null, caption: 'Routine beauté du matin',                 serviceTag: 'soins',      savedCount: 9,  createdAt: '2026-05-09T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm40', imageUrl: null, caption: 'Sérum vitamine C — teint unifié',         serviceTag: 'soins',      savedCount: 20, createdAt: '2026-05-10T10:00:00Z', provider: _p('p3', 'marie-kabila',      'Marie Kabila',      'Kinshasa',   4.6) },
  // Barber
  { id: 'm41', imageUrl: null, caption: 'Taille barbe précise au rasoir',          serviceTag: 'barber',     savedCount: 16, createdAt: '2026-05-11T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  { id: 'm42', imageUrl: null, caption: 'Buzz cut avec dégradé net',               serviceTag: 'barber',     savedCount: 10, createdAt: '2026-05-12T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  { id: 'm43', imageUrl: null, caption: 'Afro classique bien formé',               serviceTag: 'barber',     savedCount: 14, createdAt: '2026-05-13T10:00:00Z', provider: _p('p5', 'ibrahim-fall',      'Ibrahim Fall',      'Dakar',      4.6) },
  { id: 'm44', imageUrl: null, caption: 'Dégradé américain + barbe sculptée',      serviceTag: 'barber',     savedCount: 23, createdAt: '2026-05-14T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  { id: 'm45', imageUrl: null, caption: 'Frohawk avec lignes nettes',              serviceTag: 'barber',     savedCount: 19, createdAt: '2026-05-15T10:00:00Z', provider: _p('p5', 'ibrahim-fall',      'Ibrahim Fall',      'Dakar',      4.6) },
  { id: 'm46', imageUrl: null, caption: 'Hair design motif géométrique',           serviceTag: 'barber',     savedCount: 32, createdAt: '2026-05-16T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  { id: 'm47', imageUrl: null, caption: 'High top afro impeccable',                serviceTag: 'barber',     savedCount: 15, createdAt: '2026-05-17T10:00:00Z', provider: _p('p5', 'ibrahim-fall',      'Ibrahim Fall',      'Dakar',      4.6) },
  { id: 'm48', imageUrl: null, caption: 'Line-up net & précis',                    serviceTag: 'barber',     savedCount: 12, createdAt: '2026-05-18T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  { id: 'm49', imageUrl: null, caption: 'Low fade + volume full',                  serviceTag: 'barber',     savedCount: 21, createdAt: '2026-05-19T10:00:00Z', provider: _p('p5', 'ibrahim-fall',      'Ibrahim Fall',      'Dakar',      4.6) },
  { id: 'm50', imageUrl: null, caption: 'Tapered cut élégant',                     serviceTag: 'barber',     savedCount: 17, createdAt: '2026-05-20T10:00:00Z', provider: _p('p4', 'kofi-asante',       'Kofi Asante',       'Abidjan',    4.8) },
  // Spa
  { id: 'm51', imageUrl: null, caption: 'Enveloppement corps détoxifiant',         serviceTag: 'spa',        savedCount: 8,  createdAt: '2026-05-21T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm52', imageUrl: null, caption: 'Enveloppement chocolat & vanille',        serviceTag: 'spa',        savedCount: 11, createdAt: '2026-05-22T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm53', imageUrl: null, caption: 'Masque argile visage purifiant',          serviceTag: 'spa',        savedCount: 13, createdAt: '2026-05-23T10:00:00Z', provider: _p('p11','celestine-loba',    'Celestine Loba',    'Libreville', 4.4) },
  { id: 'm54', imageUrl: null, caption: 'Bain floral relaxant aux pétales',        serviceTag: 'spa',        savedCount: 20, createdAt: '2026-05-24T10:00:00Z', provider: _p('p11','celestine-loba',    'Celestine Loba',    'Libreville', 4.4) },
  { id: 'm55', imageUrl: null, caption: 'Hammam + gommage miel',                   serviceTag: 'spa',        savedCount: 16, createdAt: '2026-05-25T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm56', imageUrl: null, caption: 'Massage pierres chaudes dos complet',     serviceTag: 'spa',        savedCount: 24, createdAt: '2026-05-26T10:00:00Z', provider: _p('p11','celestine-loba',    'Celestine Loba',    'Libreville', 4.4) },
  { id: 'm57', imageUrl: null, caption: 'Sauna infrarouge — détente profonde',     serviceTag: 'spa',        savedCount: 7,  createdAt: '2026-05-27T10:00:00Z', provider: _p('p11','celestine-loba',    'Celestine Loba',    'Libreville', 4.4) },
  { id: 'm58', imageUrl: null, caption: 'Réflexologie plantaire',                  serviceTag: 'spa',        savedCount: 10, createdAt: '2026-05-28T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
  { id: 'm59', imageUrl: null, caption: 'Sauna bois aromatisé',                    serviceTag: 'spa',        savedCount: 6,  createdAt: '2026-05-29T10:00:00Z', provider: _p('p11','celestine-loba',    'Celestine Loba',    'Libreville', 4.4) },
  { id: 'm60', imageUrl: null, caption: 'Massage suédois aux huiles chaudes',      serviceTag: 'spa',        savedCount: 18, createdAt: '2026-05-30T10:00:00Z', provider: _p('p7', 'esther-tshisekedi', 'Esther Tshisekedi', 'Kinshasa',   4.2) },
];

function LookCardSkeleton({ index }: { index: number }) {
  const h = index % 3 === 0 ? 240 : 180;
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <Skeleton width="100%" height={h} borderRadius={0} style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />
        <View style={{ padding: 10 }}>
          <Skeleton width="80%" height={12} borderRadius={6} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Skeleton width={22} height={22} borderRadius={11} />
            <Skeleton width="50%" height={11} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LookbookTabScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'discover' | 'saved'>('discover');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(
    async (pageNum = 1, append = false) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams();
        if (category) params.set('category', category);
        params.set('page', String(pageNum));
        params.set('pageSize', '20');

        const res: any = await api(`/feed?${params}`);
        const newItems: FeedItem[] = res.data?.items || [];

        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        // No more pages if we got fewer than a full page
        setHasMore(newItems.length === 20);
        setPage(pageNum);
      } catch {
        // API failed/timed out — stop pagination, fall back to mock on initial load
        setHasMore(false);
        if (!append) setItems(category ? MOCK_FEED.filter(i => i.serviceTag === category) : MOCK_FEED);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      // Load mock saves from AsyncStorage
      const raw = await AsyncStorage.getItem('karysm_mock_saved');
      const localIds: string[] = raw ? JSON.parse(raw) : [];
      const mockSaved = MOCK_FEED.filter((i) => localIds.includes(i.id));

      // Load real saves from API
      let apiSaved: FeedItem[] = [];
      if (user) {
        try {
          const res: any = await api('/feed/saved');
          apiSaved = res.data || [];
        } catch {}
      }

      const combined = [...mockSaved, ...apiSaved];
      setSavedItems(combined);
      setSavedIds(new Set(combined.map((d) => d.id)));
    } catch {
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const MOCK_SAVED_KEY = 'karysm_mock_saved';

  // Pre-populate savedIds: merge API-persisted + locally-stored mock saves
  useEffect(() => {
    async function loadSaved() {
      // Always load mock saves from AsyncStorage (works without auth)
      try {
        const raw = await AsyncStorage.getItem(MOCK_SAVED_KEY);
        const localIds: string[] = raw ? JSON.parse(raw) : [];
        setSavedIds((prev) => new Set([...prev, ...localIds]));
      } catch {}

      // Load real saves from API if authenticated
      if (!user) return;
      try {
        const res: any = await api('/feed/saved');
        const data: FeedItem[] = res.data || [];
        setSavedIds((prev) => new Set([...prev, ...data.map((d) => d.id)]));
      } catch {}
    }
    loadSaved();
  }, [user]);

  const toggleSave = useCallback(async (itemId: string) => {
    if (!user && !itemId.startsWith('m')) {
      router.push('/auth/login' as any);
      return;
    }

    // Optimistic update — compute toggle direction before setState
    const willBeSaved = !savedIds.has(itemId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

    if (itemId.startsWith('m')) {
      // Mock item: persist to AsyncStorage only
      try {
        const raw = await AsyncStorage.getItem(MOCK_SAVED_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const updated = willBeSaved
          ? [...new Set([...ids, itemId])]
          : ids.filter((x) => x !== itemId);
        await AsyncStorage.setItem(MOCK_SAVED_KEY, JSON.stringify(updated));
      } catch {}
      return;
    }

    // Real DB item: call API, revert on failure
    try {
      await api(`/feed/${itemId}/save`, { method: 'POST' });
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    }
  }, [user, savedIds]);

  // Fetch feed when category changes or tab switches to discover
  useEffect(() => {
    if (tab === 'discover') {
      fetchFeed(1, false);
    }
  }, [tab, category, fetchFeed]);

  // Fetch saved when tab switches to saved
  useEffect(() => {
    if (tab === 'saved') {
      fetchSaved();
    }
  }, [tab, fetchSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === 'discover') {
      await fetchFeed(1, false);
    } else {
      await fetchSaved();
    }
    setRefreshing(false);
  }, [tab, fetchFeed, fetchSaved]);

  const onEndReached = useCallback(() => {
    if (tab === 'discover' && hasMore && !loadingMore && !loading) {
      fetchFeed(page + 1, true);
    }
  }, [tab, hasMore, loadingMore, loading, page, fetchFeed]);

  const onCategoryChange = useCallback((key: string | null) => {
    setCategory(key);
    setPage(1);
    setHasMore(true);
  }, []);

  const currentData = tab === 'discover' ? items : savedItems;

  const renderCard = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {
      const imageHeight = index % 3 === 0 ? 260 : 200;
      const isSaved = savedIds.has(item.id);

      return (
        <View style={styles.cardWrapper}>
          <PressableScale
            style={styles.card}
            onPress={() => router.push(`/provider/${item.provider.slug}` as any)}
          >
            {/* Full-card image */}
            <Image
              source={MOCK_IMAGES[item.id] ?? { uri: imgUrl(item.imageUrl, 400) || item.imageUrl || '' }}
              style={[styles.lookImage, { height: imageHeight }]}
              resizeMode="cover"
            />

            {/* TOP-LEFT: service tag badge */}
            {item.serviceTag && (
              <View style={styles.serviceTagBadge}>
                <Text style={styles.serviceTagText}>{item.serviceTag}</Text>
              </View>
            )}

            {/* TOP-RIGHT: heart save button */}
            <Pressable
              style={styles.saveButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleSave(item.id);
              }}
              hitSlop={8}
            >
              <IconHeart
                size={16}
                color={isSaved ? colors.error : colors.white}
                fill={isSaved ? colors.error : 'none'}
              />
            </Pressable>

            {/* BOTTOM: info overlay */}
            <View style={styles.lookInfo}>
              {/* Star rating */}
              <View style={styles.ratingRow}>
                <IconStar size={11} color={colors.star} fill={colors.star} />
                <Text style={styles.ratingText}>
                  {item.provider.avgRating.toFixed(1)}
                </Text>
                <Text style={styles.savedCount}>({item.savedCount})</Text>
              </View>

              {/* Caption / title */}
              {item.caption && (
                <Text style={styles.lookCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              )}

              {/* Provider row + "Je veux ça" */}
              <View style={styles.lookBottomRow}>
                <View style={styles.lookProviderAvatar}>
                  <Text style={styles.lookProviderInitial}>
                    {item.provider.displayName?.[0] || '?'}
                  </Text>
                </View>
                <Text style={styles.lookProviderName} numberOfLines={1}>
                  {item.provider.displayName}
                </Text>
              </View>

              <Pressable
                style={styles.wantButton}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/request/create?inspiration=${encodeURIComponent(item.caption || '')}&category=${item.serviceTag || ''}` as any
                  );
                }}
              >
                <Text style={styles.wantButtonText}>Je veux ça</Text>
              </Pressable>
            </View>
          </PressableScale>
        </View>
      );
    },
    [savedIds, toggleSave]
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <LookCardSkeleton key={i} index={i} />
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return renderSkeletons();

    if (tab === 'saved') {
      if (!user) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Connectez-vous pour sauvegarder</Text>
            <Text style={styles.emptySubtitle}>
              Créez un compte pour retrouver vos looks préférés à tout moment
            </Text>
            <Pressable style={styles.emptyCta} onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.emptyCtaText}>Se connecter</Text>
            </Pressable>
          </View>
        );
      }
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun look sauvegardé</Text>
          <Text style={styles.emptySubtitle}>
            Parcourez les réalisations et sauvegardez vos préférés
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => setTab('discover')}>
            <Text style={styles.emptyCtaText}>Découvrir</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Les réalisations arrivent bientôt</Text>
        <Text style={styles.emptySubtitle}>
          Nos prestataires ajoutent leurs meilleures créations. Revenez vite !
        </Text>
        <Pressable style={styles.emptyCta} onPress={() => router.push('/(tabs)' as any)}>
          <Text style={styles.emptyCtaText}>Explorer les prestataires</Text>
        </Pressable>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const listHeader = (
    <>
      {/* CurveHeader */}
      <CurveHeader
        title="Inspiration"
        subtitle="Les réalisations de la communauté"
        height={160}
      />

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabItem, tab === 'discover' && styles.tabItemActive]}
          onPress={() => setTab('discover')}
        >
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>
            Découvrir
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'saved' && styles.tabItemActive]}
          onPress={() => setTab('saved')}
        >
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            Sauvegardés
          </Text>
        </Pressable>
      </View>

      {/* Category filter chips — only on discover tab */}
      {tab === 'discover' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {CATEGORY_FILTERS.map((f) => {
            const isActive = category === f.key;
            return (
              <Pressable
                key={f.label}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => onCategoryChange(isActive ? null : f.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.webWrapper}>
        <FlatList
          data={loading ? [] : currentData}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={currentData.length > 0 && !loading ? styles.columnWrapper : undefined}
          ListHeaderComponent={listHeader}
          renderItem={renderCard}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },

  // Tab toggle
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    color: colors.accent,
  },

  // Filters
  filtersScroll: {
    marginBottom: spacing.md,
  },
  filtersRow: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    fontWeight: '600',
  },

  // List
  list: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },

  // Card wrapper
  cardWrapper: {
    flex: 1,
    maxWidth: '48%' as any,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadows.card as any),
  },

  // Image fills the full card
  lookImage: {
    width: '100%',
  },

  // TOP-LEFT: service tag badge
  serviceTagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serviceTagText: {
    fontSize: 9,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // TOP-RIGHT: heart save button
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // BOTTOM: info section on light card
  lookInfo: {
    padding: 10,
    paddingTop: 8,
    backgroundColor: colors.card,
  },

  // Star rating row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.text,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
  savedCount: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },

  lookCaption: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 17,
  },

  lookBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  lookProviderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookProviderInitial: {
    fontSize: 9,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
  },
  lookProviderName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    flex: 1,
  },

  // "Je veux ça" button — full width at bottom of card
  wantButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  wantButtonText: {
    fontSize: 11,
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Skeleton grid
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  // Footer loader
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
