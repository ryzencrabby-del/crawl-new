import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { auth } from '../../services/firebase'
import { getUserProfile, getUserOutings } from '../../services/firebase'
import Toast from '../../components/Toast'
import { Colors } from '../../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ACHIEVEMENTS = [
  { emoji: '🍕', title: 'Pizza Lord', desc: '10+ pizza spots', unlocked: true },
  { emoji: '🌆', title: 'Night Owl', desc: '20+ night outings', unlocked: true },
  { emoji: '🗺', title: 'Explorer', desc: '8+ neighborhoods', unlocked: false },
  { emoji: '👥', title: 'Crew Leader', desc: 'Planned 10+ outings', unlocked: false },
  { emoji: '💎', title: 'Hidden Gem Hunter', desc: '15+ gems saved', unlocked: true },
  { emoji: '🔥', title: 'Streak Master', desc: '5 week streak', unlocked: false },
]

const PAST_OUTINGS = [
  {
    title: 'Friday Night Crawl',
    date: 'Mar 14, 2025',
    meta: '3 stops · 3h · $65/person',
    stops: ["Joe's Pizza", 'Momofuku', 'Attaboy'],
    rating: 5,
  },
  {
    title: 'Saturday Brunch Run',
    date: 'Mar 8, 2025',
    meta: '2 stops · 2h · $45/person',
    stops: ['Balthazar', 'Jack\'s Wife Freda'],
    rating: 4,
  },
  {
    title: 'East Village Hop',
    date: 'Feb 28, 2025',
    meta: '4 stops · 4h · $80/person',
    stops: ['Veselka', 'Death & Co', 'Prune', 'Elsa'],
    rating: 5,
  },
]

const MAP_PINS = [
  { top: '20%', left: '30%' },
  { top: '35%', left: '60%' },
  { top: '55%', left: '25%' },
  { top: '40%', left: '45%' },
  { top: '65%', left: '70%' },
  { top: '25%', left: '75%' },
  { top: '70%', left: '40%' },
] as const

export default function ProfileScreen() {
  const [stats, setStats] = useState({ outings: 12, spots: 67, friends: 8 })
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (msg: string) => setToast({ visible: true, message: msg })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const user = auth.currentUser
      if (user) {
        const outings = await getUserOutings(user.uid)
        if (outings.length > 0) {
          setStats(prev => ({ ...prev, outings: outings.length }))
        }
      }
    } catch {}
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <LinearGradient colors={['#E8572A', '#FF8C42']} style={styles.avatar}>
            <Text style={styles.avatarText}>AJ</Text>
          </LinearGradient>

          <Text style={styles.name}>Alex Johnson</Text>
          <Text style={styles.handle}>@alexj_nyc</Text>
          <Text style={styles.bio}>NYC food explorer 🗽 Always on the crawl</Text>

          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{stats.outings}</Text>
              <Text style={styles.statLabel}>Outings</Text>
            </View>
            <View style={[styles.statColumn, styles.statColumnBorder]}>
              <Text style={styles.statNumber}>{stats.spots}</Text>
              <Text style={styles.statLabel}>Spots</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{stats.friends}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsScroll}
        >
          {ACHIEVEMENTS.map((a, i) => (
            <View key={i} style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}>
              <Text style={styles.achievementEmoji}>{a.emoji}</Text>
              <Text style={styles.achievementTitle}>{a.title}</Text>
              <Text style={styles.achievementDesc}>{a.desc}</Text>
              {!a.unlocked && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* NYC Map card */}
        <View style={styles.mapCard}>
          <View style={styles.nycMap}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <View key={`h${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${i * 25}%` }]} />
            ))}
            {[0, 1, 2, 3, 4].map(i => (
              <View key={`v${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${i * 25}%` }]} />
            ))}

            {/* Pins */}
            {MAP_PINS.map((pin, i) => (
              <Text key={i} style={[styles.mapPin, { top: pin.top, left: pin.left }]}>📍</Text>
            ))}

            {/* Overlay pill */}
            <View style={styles.mapOverlayPill}>
              <Text style={styles.mapOverlayText}>67 spots visited across NYC</Text>
            </View>
          </View>
        </View>

        {/* Past outings */}
        <Text style={styles.sectionTitle}>Past Outings</Text>
        <View style={styles.card}>
          {PAST_OUTINGS.map((outing, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.outingRow, i < PAST_OUTINGS.length - 1 && styles.outingRowBorder]}
              onPress={() => showToast('Loading recap...')}
            >
              <View style={styles.outingInfo}>
                <Text style={styles.outingTitle}>{outing.title}</Text>
                <Text style={styles.outingDate}>{outing.date}</Text>
                <Text style={styles.outingMeta}>{outing.meta}</Text>
                <View style={styles.stopPills}>
                  {outing.stops.map((stop, j) => (
                    <View key={j} style={styles.stopPill}>
                      <Text style={styles.stopPillText} numberOfLines={1}>{stop}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.outingStars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Text key={s} style={[styles.outingStar, { color: s <= outing.rating ? '#FF9500' : '#e0e0e0' }]}>★</Text>
                  ))}
                </View>
              </View>
              <Text style={styles.outingArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast({ visible: false, message: '' })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 0,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  handle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 14,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statColumnBorder: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  achievementsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
    marginBottom: 16,
  },
  achievementCard: {
    width: 105,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.45,
  },
  achievementEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 9,
    color: '#8e8e93',
    textAlign: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  lockIcon: {
    fontSize: 12,
  },
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nycMap: {
    height: 165,
    backgroundColor: '#deeede',
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapPin: {
    position: 'absolute',
    fontSize: 18,
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  outingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  outingRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  outingInfo: {
    flex: 1,
  },
  outingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  outingDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 2,
  },
  outingMeta: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 8,
  },
  stopPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  stopPill: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stopPillText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '500',
    maxWidth: 80,
  },
  outingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  outingStar: {
    fontSize: 14,
  },
  outingArrow: {
    fontSize: 20,
    color: '#c7c7cc',
    marginLeft: 8,
  },
})
