import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Share,
  StyleSheet,
  Dimensions,
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import Svg, { Line } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProgressBar from '../../components/ProgressBar'
import StopItem from '../../components/StopItem'
import VoteCard from '../../components/VoteCard'
import Toast from '../../components/Toast'
import { saveVote, markStopDone } from '../../services/firebase'
import { Colors } from '../../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const STOPS = [
  { name: "Joe's Pizza", address: '7 Carmine St, New York, NY', lat: 40.7282, lng: -74.0776, time: '8:00 PM', status: 'done' as const, emoji: '🍕' },
  { name: 'Momofuku Noodle Bar', address: '171 1st Ave, New York, NY', lat: 40.7265, lng: -73.9862, time: '9:30 PM', status: 'current' as const, emoji: '🍜' },
  { name: 'Attaboy', address: '134 Eldridge St, New York, NY', lat: 40.7180, lng: -73.9897, time: '11:00 PM', status: 'upcoming' as const, emoji: '🍸' },
]

const FRIENDS = [
  { name: 'Alex', color: '#E8572A', initials: 'A' },
  { name: 'Jordan', color: '#34C759', initials: 'J' },
  { name: 'Sam', color: '#007AFF', initials: 'S' },
]

const VOTE_OPTIONS = [
  { id: 'v1', name: 'Attaboy', meta: 'Cocktail Bar · $$', emoji: '🍸', yesCount: 2, noCount: 1 },
  { id: 'v2', name: 'Death & Co', meta: 'Speakeasy · $$$', emoji: '🥃', yesCount: 1, noCount: 0 },
]

export default function OutingScreen() {
  const [stops, setStops] = useState(STOPS)
  const [progress, setProgress] = useState(1 / 3)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const livePulse = useRef(new Animated.Value(1)).current

  const showToast = (msg: string) => setToast({ visible: true, message: msg })

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  const handleMarkDone = async () => {
    const currentIdx = stops.findIndex(s => s.status === 'current')
    if (currentIdx === -1) return
    const updated = stops.map((s, i) => {
      if (i === currentIdx) return { ...s, status: 'done' as const }
      if (i === currentIdx + 1) return { ...s, status: 'current' as const }
      return s
    })
    setStops(updated)
    const doneCount = updated.filter(s => s.status === 'done').length
    setProgress(doneCount / updated.length)
    showToast('Stop marked as done!')
    await markStopDone('demo-outing', currentIdx)
  }

  const handleNavigate = () => {
    const current = stops.find(s => s.status === 'current')
    if (current) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(current.address)}`
      Linking.openURL(url).catch(() => {})
    }
  }

  const handleInvite = async () => {
    try {
      await Share.share({
        message: "Join our crawl tonight! We're hitting Joe's Pizza → Momofuku → Attaboy 🗺🍕🍸",
        title: 'Join our Crawl',
      })
    } catch {}
  }

  const handleVote = async (venueId: string, vote: 'yes' | 'no') => {
    await saveVote('demo-session', 'demo-user', venueId, vote)
    showToast(`Vote saved!`)
  }

  const currentStop = stops.find(s => s.status === 'current')
  const doneStops = stops.filter(s => s.status === 'done').length

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 40.7230,
            longitude: -74.0000,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {stops.map((stop, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              title={stop.name}
              pinColor={stop.status === 'done' ? '#34C759' : stop.status === 'current' ? '#E8572A' : '#8e8e93'}
            />
          ))}
          <Polyline
            coordinates={stops.map(s => ({ latitude: s.lat, longitude: s.lng }))}
            strokeColor="#E8572A"
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        </MapView>

        {/* Floating info card */}
        <View style={styles.floatingCard}>
          <View style={styles.floatingCardHeader}>
            <View style={styles.floatingCardLeft}>
              <Text style={styles.floatingTitle}>Tonight's Crawl</Text>
              <Text style={styles.floatingSubtitle}>LES → East Village → Lower East Side</Text>
            </View>
            <Animated.View style={[styles.liveBadge, { opacity: livePulse }]}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </Animated.View>
          </View>

          {/* Friend avatars */}
          <View style={styles.friendAvatars}>
            {FRIENDS.map((f, i) => (
              <View
                key={i}
                style={[styles.friendAvatar, { backgroundColor: f.color, marginLeft: i === 0 ? 0 : -9 }]}
              >
                <Text style={styles.friendAvatarText}>{f.initials}</Text>
              </View>
            ))}
            <Text style={styles.friendCount}>+{FRIENDS.length} friends</Text>
          </View>
        </View>

        {/* Progress card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardLabel}>Progress</Text>
            <Text style={styles.stopCount}>{doneStops}/{stops.length} stops</Text>
          </View>
          <ProgressBar progress={progress} height={10} />
          <View style={styles.stopEmojis}>
            {stops.map((stop, i) => (
              <Text
                key={i}
                style={[
                  styles.stopEmoji,
                  { opacity: stop.status === 'upcoming' ? 0.4 : 1 }
                ]}
              >
                {stop.emoji}
              </Text>
            ))}
          </View>
        </View>

        {/* Voting card */}
        <VoteCard options={VOTE_OPTIONS} onVote={handleVote} />

        {/* Stop list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tonight's Stops</Text>
          {stops.map((stop, i) => (
            <StopItem key={i} stop={stop} index={i} />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <LinearGradient colors={['#E8572A', '#FF8C42']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.navigateButtonText}>🧭 Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.markDoneButton} onPress={handleMarkDone}>
            <Text style={styles.markDoneText}>✓ Mark Done</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Text style={styles.inviteText}>👥 Invite</Text>
          </TouchableOpacity>
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
  map: {
    height: 210,
    width: '100%',
  },
  floatingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -22,
    zIndex: 10,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  floatingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  floatingCardLeft: {
    flex: 1,
  },
  floatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  floatingSubtitle: {
    fontSize: 13,
    color: '#8e8e93',
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  friendAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  friendAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  friendCount: {
    marginLeft: 10,
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
  },
  stopCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  stopEmojis: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  stopEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  navigateButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  navigateButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  markDoneButton: {
    flex: 1,
    backgroundColor: '#E8F8ED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  markDoneText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  inviteText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
})
