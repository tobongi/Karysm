import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors } from '../theme/colors';

interface PhotoGalleryProps {
  visible: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

export default function PhotoGallery({
  visible,
  photos,
  initialIndex = 0,
  onClose,
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  }

  function handleImageError(index: number) {
    setFailedImages((prev) => new Set(prev).add(index));
  }

  // Reset state when modal opens
  function handleShow() {
    setCurrentIndex(initialIndex);
    setFailedImages(new Set());
    // Scroll to initial index after layout
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: initialIndex * SCREEN_WIDTH,
        animated: false,
      });
    }, 50);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={16} style={styles.closeArea}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
          <Text style={styles.counter}>
            {currentIndex + 1}/{photos.length}
          </Text>
          <View style={styles.closeArea} />
        </View>

        {/* Photos */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.scrollView}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {photos.map((uri, index) => (
            <View key={index} style={styles.slide}>
              {failedImages.has(index) ? (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>
                    Image indisponible
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => handleImageError(index)}
                />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
  },
  counter: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  placeholder: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  dots: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
});
