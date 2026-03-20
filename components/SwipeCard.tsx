import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getPhotoUrl } from '../services/googlePlaces'
import { Colors } from '../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH - 32
const CARD_HEIGHT = 480
const SWIPE_THRESHOLD = 120

interface SwipeCardProps {
  place: any
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isTop: boolean
  stackIndex: number
}

export default function SwipeCard({ place, onSwipeLeft, onSwipeRight, isTop, stackIndex }: SwipeCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const position = useRef(new Animated.ValueXY()).current
  const swipeDirection = useRef<'left' | 'right' | null>(null)

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  const yesOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const noOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onSwipeRight())
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => onSwipeLeft())
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start()
        }
      },
    })
  ).current

  const scale = stackIndex === 0 ? 1.0 : stackIndex === 1 ? 0.95 : 0.90
  const translateY = stackIndex === 0 ? 0 : stackIndex === 1 ? 10 : 20
  const zIndex = 3 - stackIndex

  const photoRef = place?.photos?.[0]?.photo_reference
  const photoUri = photoRef
    ? getPhotoUrl(photoRef)
    : place?.image_url || null

  const rating = place?.rating ? `${place.rating} ★` : '4.2 ★'
  const priceLevel = place?.price_level ? '$'.repeat(place.price_level) : '$$'
  const isOpen = place?.opening_hours?.open_now

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        styles.card,
        {
          transform: [
            { scale },
            { translateY },
            ...(isTop ? [{ translateX: position.x }, { rotate }] : []),
          ],
          zIndex,
        },
      ]}
    >
      {/* Image */}
      {photoUri && !imageError ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => { setImageError(true); setImageLoading(false) }}
        />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>{place?.name || 'Restaurant'}</Text>
        </View>
      )}

      {imageLoading && !imageError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.name}>{place?.name || 'Amazing Spot'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{rating}  {priceLevel}</Text>
          {place?.vicinity && (
            <Text style={styles.meta} numberOfLines={1}>  {place.vicinity}</Text>
          )}
        </View>
        <View style={styles.badgeRow}>
          {isOpen !== undefined && (
            <View style={[styles.badge, { backgroundColor: isOpen ? 'rgba(52,199,89,0.88)' : 'rgba(255,59,48,0.88)' }]}>
              <Text style={styles.badgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* YES overlay */}
      <Animated.View style={[styles.overlayLabel, styles.yesLabel, { opacity: yesOpacity }]}>
        <Text style={styles.overlayLabelText}>ADD ✓</Text>
      </Animated.View>

      {/* NO overlay */}
      <Animated.View style={[styles.overlayLabel, styles.noLabel, { opacity: noOpacity }]}>
        <Text style={styles.overlayLabelText}>SKIP ✕</Text>
      </Animated.View>
    </Animated.View>
  )
}

export function triggerSwipeRight(position: Animated.ValueXY, callback: () => void) {
  Animated.spring(position, {
    toValue: { x: 500, y: 0 },
    useNativeDriver: false,
  }).start(callback)
}

export function triggerSwipeLeft(position: Animated.ValueXY, callback: () => void) {
  Animated.spring(position, {
    toValue: { x: -500, y: 0 },
    useNativeDriver: false,
  }).start(callback)
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  imageFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,240,0.5)',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  name: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meta: {
    color: '#ffffff',
    fontSize: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  overlayLabel: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 4,
  },
  yesLabel: {
    right: 20,
    borderColor: '#34C759',
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  noLabel: {
    left: 20,
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  overlayLabelText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
})
