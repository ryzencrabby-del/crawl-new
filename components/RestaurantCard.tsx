import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getPhotoUrl } from '../services/googlePlaces'
import { Colors } from '../constants/colors'

interface RestaurantCardProps {
  place: any
  healthGrade?: string | null
  onAdd: () => void
  onSave: () => void
}

export default function RestaurantCard({ place, healthGrade, onAdd, onSave }: RestaurantCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const photoRef = place?.photos?.[0]?.photo_reference
  const photoUri = photoRef
    ? getPhotoUrl(photoRef)
    : place?.image_url || null

  const rating = place?.rating ? `${place.rating} ★` : '4.2 ★'
  const priceLevel = place?.price_level ? '$'.repeat(place.price_level) : '$$'
  const isOpen = place?.opening_hours?.open_now
  const category = place?.types?.[0]?.replace(/_/g, ' ') || 'Restaurant'
  const description = place?.vicinity || place?.formatted_address || 'New York, NY'

  const gradeColor = healthGrade === 'A' ? Colors.success : healthGrade === 'B' ? Colors.warning : Colors.error

  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageContainer}>
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
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          style={styles.imageGradient}
        />

        {/* Address bottom left */}
        <Text style={styles.addressOverlay} numberOfLines={1}>
          {place?.vicinity || 'New York, NY'}
        </Text>

        {/* Distance pill bottom right */}
        <View style={styles.distancePill}>
          <Text style={styles.distancePillText}>0.3 mi</Text>
        </View>

        {/* Health grade top right */}
        {healthGrade && (
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
            <Text style={styles.gradeBadgeText}>{healthGrade}</Text>
          </View>
        )}

        {/* Open badge top left */}
        {isOpen !== undefined && (
          <View style={[styles.openBadge, { backgroundColor: isOpen ? 'rgba(52,199,89,0.88)' : 'rgba(255,59,48,0.88)' }]}>
            <Text style={styles.openBadgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{place?.name || 'Amazing Spot'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>{rating}</Text>
          <Text style={styles.price}>{priceLevel}</Text>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{category}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addButtonText}>+ Add to outing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>♥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 175,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,240,0.5)',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  addressOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '60%',
  },
  distancePill: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distancePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  gradeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  openBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rating: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
  },
  price: {
    fontSize: 13,
    color: '#8e8e93',
  },
  tagPill: {
    backgroundColor: '#FFF0EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 20,
    color: Colors.primary,
  },
})
