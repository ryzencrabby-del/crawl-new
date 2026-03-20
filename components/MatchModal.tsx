import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { getPhotoUrl } from '../services/googlePlaces'
import { Colors } from '../constants/colors'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface MatchModalProps {
  visible: boolean
  place: any
  onAddToPlan: () => void
  onClose: () => void
}

function ConfettiDot({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(-20)).current
  const opacity = useRef(new Animated.Value(1)).current
  const x = useRef(Math.random() * SCREEN_WIDTH).current
  const color = ['#E8572A', '#FF8C42', '#34C759', '#FF9500', '#ffffff'][Math.floor(Math.random() * 5)]
  const size = 6 + Math.random() * 8

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT + 50,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 500, delay: 1800, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -20, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY }],
        opacity,
      }}
    />
  )
}

export default function MatchModal({ visible, place, onAddToPlan, onClose }: MatchModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
    } else {
      scaleAnim.setValue(0.5)
      opacityAnim.setValue(0)
    }
  }, [visible])

  if (!place) return null

  const photoRef = place?.photos?.[0]?.photo_reference
  const photoUri = photoRef
    ? getPhotoUrl(photoRef)
    : place?.image_url || null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {Array.from({ length: 20 }).map((_, i) => (
          <ConfettiDot key={i} delay={i * 100} />
        ))}
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Text style={styles.title}>It's a Match! 🎉</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Text style={styles.photoFallbackText}>{place?.name?.[0] || '?'}</Text>
            </View>
          )}
          <Text style={styles.name}>{place?.name || 'Amazing Spot'}</Text>
          <Text style={styles.subtitle}>You all want to go here!</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddToPlan}>
            <Text style={styles.addButtonText}>Add to Tonight's Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
  },
  photoFallback: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
})
