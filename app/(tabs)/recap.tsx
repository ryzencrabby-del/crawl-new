import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { generateRecap } from '../../services/claude'
import { saveRating } from '../../services/firebase'
import Toast from '../../components/Toast'
import { Colors } from '../../constants/colors'

const OUTING_DATA = {
  title: "Friday Night Crawl",
  date: "MARCH 14, 2025",
  route: "LES → East Village → Lower East Side",
  stops: ["Joe's Pizza", "Momofuku Noodle Bar", "Attaboy"],
  duration: 180,
  friends: ["Alex", "Jordan", "Sam"],
  distance: 2.4,
  costPerPerson: 65,
}

const SPOT_RATINGS = [
  { name: "Joe's Pizza", address: '7 Carmine St', emoji: '🍕' },
  { name: 'Momofuku Noodle Bar', address: '171 1st Ave', emoji: '🍜' },
  { name: 'Attaboy', address: '134 Eldridge St', emoji: '🍸' },
]

const FRIENDS_BILL = [
  { name: 'Alex', initials: 'A', color: '#E8572A', amount: 65, paid: true },
  { name: 'Jordan', initials: 'J', color: '#34C759', amount: 65, paid: false },
  { name: 'Sam', initials: 'S', color: '#007AFF', amount: 65, paid: false },
]

export default function RecapScreen() {
  const [aiRecap, setAiRecap] = useState('')
  const [aiLoading, setAiLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (msg: string) => setToast({ visible: true, message: msg })

  useEffect(() => {
    loadRecap()
  }, [])

  const loadRecap = async () => {
    setAiLoading(true)
    try {
      const recap = await generateRecap(
        OUTING_DATA.stops,
        OUTING_DATA.duration,
        OUTING_DATA.friends,
        OUTING_DATA.distance
      )
      setAiRecap(recap)
    } catch {
      setAiRecap(`What a night! You and your crew hit ${OUTING_DATA.stops.length} legendary spots across NYC. ${OUTING_DATA.stops.join(' → ')}. Memories made, miles walked, vibes immaculate. 🗽🔥`)
    }
    setAiLoading(false)
  }

  const handleRating = async (spotName: string, star: number) => {
    setRatings(prev => ({ ...prev, [spotName]: star }))
    await saveRating('demo-outing', spotName, star)
    showToast('Rating saved!')
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${OUTING_DATA.title} 🗺\n${OUTING_DATA.route}\n${OUTING_DATA.stops.join(' → ')}\n\n${aiRecap}`,
        title: OUTING_DATA.title,
      })
    } catch {}
  }

  const handleVenmo = (name: string, amount: number) => {
    const url = `venmo://paycharge?txn=pay&recipients=${name}&amount=${amount}&note=Crawl%20Night`
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://venmo.com/${name}?txn=pay&amount=${amount}&note=Crawl%20Night`).catch(() => {})
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Black hero */}
        <View style={styles.hero}>
          <Text style={styles.heroDate}>{OUTING_DATA.date}</Text>
          <Text style={styles.heroTitle}>{OUTING_DATA.title}</Text>
          <Text style={styles.heroRoute}>{OUTING_DATA.route}</Text>
          <View style={styles.friendAvatars}>
            {FRIENDS_BILL.map((f, i) => (
              <View
                key={i}
                style={[styles.friendAvatar, { backgroundColor: f.color, marginLeft: i === 0 ? 0 : -9 }]}
              >
                <Text style={styles.friendAvatarText}>{f.initials}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{OUTING_DATA.stops.length}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{OUTING_DATA.duration}m</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${OUTING_DATA.costPerPerson}</Text>
            <Text style={styles.statLabel}>Per person</Text>
          </View>
        </View>

        {/* AI Recap */}
        <View style={styles.card}>
          <LinearGradient colors={['#E8572A', '#FF8C42']} style={styles.aiBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.aiBadgeText}>✦ AI RECAP</Text>
          </LinearGradient>
          {aiLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : (
            <Text style={styles.aiRecapText}>{aiRecap}</Text>
          )}
        </View>

        {/* Star ratings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate your stops</Text>
          {SPOT_RATINGS.map((spot, i) => (
            <View key={i} style={styles.ratingRow}>
              <View style={styles.ratingEmoji}>
                <Text style={{ fontSize: 22 }}>{spot.emoji}</Text>
              </View>
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingName}>{spot.name}</Text>
                <Text style={styles.ratingAddress}>{spot.address}</Text>
              </View>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => handleRating(spot.name, star)}>
                    <Text style={[styles.star, { color: (ratings[spot.name] || 0) >= star ? '#FF9500' : '#e0e0e0' }]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Bill split */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Split</Text>
          {FRIENDS_BILL.map((f, i) => (
            <View key={i} style={styles.billRow}>
              <View style={[styles.billAvatar, { backgroundColor: f.color }]}>
                <Text style={styles.billAvatarText}>{f.initials}</Text>
              </View>
              <Text style={styles.billName}>{f.name}</Text>
              <Text style={styles.billAmount}>${f.amount}</Text>
              {f.paid ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              ) : (
                <View style={styles.owesBadge}>
                  <Text style={styles.owesText}>Owes</Text>
                </View>
              )}
              {!f.paid && (
                <TouchableOpacity style={styles.venmoButton} onPress={() => handleVenmo(f.name, f.amount)}>
                  <Text style={styles.venmoText}>Venmo</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📸 Share outing card</Text>
        </TouchableOpacity>

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
  hero: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroRoute: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 16,
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
    borderColor: '#000000',
  },
  friendAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
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
  aiBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  aiBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  aiRecapText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#000000',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  ratingEmoji: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingInfo: {
    flex: 1,
  },
  ratingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  ratingAddress: {
    fontSize: 12,
    color: '#8e8e93',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 22,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  billAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  billName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  billAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginRight: 8,
  },
  paidBadge: {
    backgroundColor: '#E8F8ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  owesBadge: {
    backgroundColor: '#FFF0EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  owesText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  venmoButton: {
    backgroundColor: '#3D95CE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  venmoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 18,
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
