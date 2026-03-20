import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getNearbyPlaces, searchPlaces, getAutocomplete, getPhotoUrl } from '../../services/googlePlaces'
import { getTrending } from '../../services/foursquare'
import { getNYCWeather } from '../../services/weather'
import { generateOutingPlan } from '../../services/claude'
import { signInAnon, createSwipeSession, recordSwipe, subscribeToSession, saveToWishlist } from '../../services/firebase'
import { getHealthGrade } from '../../services/nycOpenData'
import { auth } from '../../services/firebase'
import SwipeCard from '../../components/SwipeCard'
import RestaurantCard from '../../components/RestaurantCard'
import MatchModal from '../../components/MatchModal'
import Toast from '../../components/Toast'
import { Colors } from '../../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const FILTERS = ['All', '🍽 Food', '🍸 Bars', '☕ Coffee', '🎯 Activities', '🎟 Events', '🏙 Rooftop']
const FILTER_TYPES: Record<string, string> = {
  'All': 'restaurant',
  '🍽 Food': 'restaurant',
  '🍸 Bars': 'bar',
  '☕ Coffee': 'cafe',
  '🎯 Activities': 'amusement_park',
  '🎟 Events': 'night_club',
  '🏙 Rooftop': 'bar',
}

export default function DiscoverScreen() {
  const [mode, setMode] = useState<'swipe' | 'browse'>('swipe')
  const [places, setPlaces] = useState<any[]>([])
  const [browseResults, setBrowseResults] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [weather, setWeather] = useState({ temp: 72, condition: 'Clear' })
  const [searchText, setSearchText] = useState('')
  const [autocomplete, setAutocomplete] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [cardIndex, setCardIndex] = useState(0)
  const [outingSpots, setOutingSpots] = useState<any[]>([])
  const [matchPlace, setMatchPlace] = useState<any>(null)
  const [matchVisible, setMatchVisible] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [aiPlannerVisible, setAiPlannerVisible] = useState(false)
  const [aiVibe, setAiVibe] = useState('Turn up')
  const [aiGroupSize, setAiGroupSize] = useState('Small crew')
  const [aiBudget, setAiBudget] = useState('$$')
  const [aiPlan, setAiPlan] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [healthGrades, setHealthGrades] = useState<Record<string, string | null>>({})

  const loadingBarAnim = useRef(new Animated.Value(0)).current
  const loadingBarOpacity = useRef(new Animated.Value(0)).current

  const showToast = (message: string) => {
    setToast({ visible: true, message })
  }

  const startLoadingBar = () => {
    loadingBarOpacity.setValue(1)
    loadingBarAnim.setValue(0)
    Animated.timing(loadingBarAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(loadingBarOpacity, { toValue: 0, duration: 300, useNativeDriver: false }).start()
    })
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [weatherData, nearbyData, trendingData] = await Promise.all([
        getNYCWeather(),
        getNearbyPlaces('restaurant'),
        getTrending(),
      ])
      setWeather(weatherData)
      setPlaces(nearbyData)
      setBrowseResults(nearbyData)
      setTrending(trendingData)

      // Create Firebase session
      const user = auth.currentUser
      if (user && nearbyData.length > 0) {
        const sid = await createSwipeSession(nearbyData.slice(0, 10))
        if (sid) {
          setSessionId(sid)
          subscribeToSession(sid, (data) => {
            checkForMatch(data, nearbyData)
          })
        }
      }
    } catch (e) {
      setWeather({ temp: 72, condition: 'Clear' })
    }
  }

  const checkForMatch = (sessionData: any, spots: any[]) => {
    try {
      const swipes = sessionData?.swipes || {}
      const users = Object.keys(swipes)
      if (users.length < 2) return

      spots.forEach(spot => {
        const spotId = spot.place_id
        const allYes = users.every(uid => swipes[uid]?.[spotId] === 'yes')
        if (allYes && !matchVisible) {
          setMatchPlace(spot)
          setMatchVisible(true)
        }
      })
    } catch {}
  }

  const doSearch = async (query?: string) => {
    const q = query || searchText
    if (!q.trim()) return
    setLoading(true)
    startLoadingBar()
    setAutocomplete([])
    try {
      const results = await searchPlaces(q)
      setBrowseResults(results)
    } catch {
      setBrowseResults([])
    }
    setLoading(false)
  }

  const handleAutocomplete = async (text: string) => {
    setSearchText(text)
    if (text.length > 1) {
      try {
        const predictions = await getAutocomplete(text)
        setAutocomplete(predictions)
      } catch {
        setAutocomplete([])
      }
    } else {
      setAutocomplete([])
    }
  }

  const handleFilterChange = async (filter: string) => {
    setActiveFilter(filter)
    setLoading(true)
    startLoadingBar()
    try {
      const type = FILTER_TYPES[filter] || 'restaurant'
      const results = await getNearbyPlaces(type)
      setBrowseResults(results)
    } catch {
      setBrowseResults([])
    }
    setLoading(false)
  }

  const handleSwipeRight = async (place: any) => {
    setOutingSpots(prev => [...prev, place])
    showToast(`${place.name} added to outing!`)
    const user = auth.currentUser
    if (user && sessionId) {
      await recordSwipe(sessionId, user.uid, place.place_id, 'yes')
    }
    setCardIndex(prev => prev + 1)
  }

  const handleSwipeLeft = () => {
    setCardIndex(prev => prev + 1)
  }

  const handleAddToOuting = (place: any) => {
    setOutingSpots(prev => [...prev, place])
    showToast(`${place.name} added to outing!`)
  }

  const handleSaveToWishlist = async (place: any) => {
    const user = auth.currentUser
    if (user) {
      await saveToWishlist(user.uid, place)
      showToast('Saved to wishlist!')
    }
  }

  const handleGenerateAIPlan = async () => {
    setAiLoading(true)
    try {
      const plan = await generateOutingPlan(aiVibe, aiBudget, aiGroupSize)
      setAiPlan(plan)
    } catch {
      setAiPlan([])
    }
    setAiLoading(false)
  }

  const handleStartCrawl = () => {
    aiPlan.forEach(stop => {
      setOutingSpots(prev => [...prev, { name: stop.name, types: [stop.type], vicinity: 'New York, NY' }])
    })
    setAiPlannerVisible(false)
    showToast('Crawl plan added to outing!')
  }

  const visibleCards = places.slice(cardIndex, cardIndex + 3)
  const hasMoreCards = cardIndex < places.length

  const weatherIcon = weather.condition === 'Clear' ? '☀️' :
    weather.condition === 'Clouds' ? '☁️' :
    weather.condition === 'Rain' ? '🌧' :
    weather.condition === 'Snow' ? '❄️' : '🌤'

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <LinearGradient colors={['#E8572A', '#b83d18']} style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>Good evening 👋</Text>
                <Text style={styles.heroTitle}>What's the move?</Text>
                <Text style={styles.heroSubtitle}>Lower East Side, NYC</Text>
              </View>
              <TouchableOpacity style={styles.notifBell}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
              </TouchableOpacity>
            </View>

            {/* Weather pill */}
            <View style={styles.weatherPill}>
              <Text style={styles.weatherText}>{weatherIcon} {weather.temp}°F · {weather.condition}</Text>
            </View>
          </LinearGradient>

          {/* Loading bar */}
          <Animated.View style={[styles.loadingBar, {
            opacity: loadingBarOpacity,
            width: loadingBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />

          {/* Mode switcher */}
          <View style={styles.modeSwitcherContainer}>
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                style={[styles.modeOption, mode === 'swipe' && styles.modeOptionActive]}
                onPress={() => setMode('swipe')}
              >
                <Text style={[styles.modeText, mode === 'swipe' && styles.modeTextActive]}>⚡ Swipe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeOption, mode === 'browse' && styles.modeOptionActive]}
                onPress={() => setMode('browse')}
              >
                <Text style={[styles.modeText, mode === 'browse' && styles.modeTextActive]}>☰ Browse</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SWIPE MODE */}
          {mode === 'swipe' && (
            <View style={styles.swipeSection}>
              {hasMoreCards ? (
                <>
                  <View style={styles.cardStack}>
                    {visibleCards.map((place, i) => (
                      <SwipeCard
                        key={place.place_id || i}
                        place={place}
                        isTop={i === 0}
                        stackIndex={i}
                        onSwipeRight={() => handleSwipeRight(place)}
                        onSwipeLeft={handleSwipeLeft}
                      />
                    )).reverse()}
                  </View>

                  {/* Yes/No buttons */}
                  <View style={styles.swipeButtons}>
                    <TouchableOpacity
                      style={styles.noButton}
                      onPress={handleSwipeLeft}
                    >
                      <Text style={styles.noButtonText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.yesButton}
                      onPress={() => handleSwipeRight(visibleCards[0])}
                    >
                      <Text style={styles.yesButtonText}>♥</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.noMoreCards}>
                  <Text style={styles.noMoreText}>No more spots nearby 🎉</Text>
                  <TouchableOpacity style={styles.reloadButton} onPress={loadInitialData}>
                    <Text style={styles.reloadButtonText}>Reload</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* BROWSE MODE */}
          {mode === 'browse' && (
            <View style={styles.browseSection}>
              {/* Search card */}
              <View style={styles.searchCard}>
                <View style={styles.searchRow}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="pizza, rooftop bars, coffee..."
                    placeholderTextColor="#8e8e93"
                    value={searchText}
                    onChangeText={handleAutocomplete}
                    onSubmitEditing={() => doSearch()}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchText(''); setAutocomplete([]) }}>
                      <Text style={styles.clearButton}>✕</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.searchButton} onPress={() => doSearch()}>
                    <Text style={styles.searchButtonText}>Search</Text>
                  </TouchableOpacity>
                </View>

                {/* Autocomplete */}
                {autocomplete.length > 0 && (
                  <View style={styles.autocompleteDropdown}>
                    {autocomplete.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.autocompleteRow}
                        onPress={() => {
                          setSearchText(item.structured_formatting?.main_text || item.description)
                          setAutocomplete([])
                          doSearch(item.structured_formatting?.main_text || item.description)
                        }}
                      >
                        <Text style={styles.autocompleteEmoji}>📍</Text>
                        <View style={styles.autocompleteInfo}>
                          <Text style={styles.autocompleteName} numberOfLines={1}>
                            {item.structured_formatting?.main_text || item.description}
                          </Text>
                          <Text style={styles.autocompleteAddress} numberOfLines={1}>
                            {item.structured_formatting?.secondary_text || ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {FILTERS.map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => handleFilterChange(filter)}
                  >
                    <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Restaurant cards */}
              {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
              ) : (
                browseResults.map((place, i) => (
                  <RestaurantCard
                    key={place.place_id || i}
                    place={place}
                    healthGrade={healthGrades[place.place_id]}
                    onAdd={() => handleAddToOuting(place)}
                    onSave={() => handleSaveToWishlist(place)}
                  />
                ))
              )}

              {/* Trending section */}
              <View style={styles.trendingSection}>
                <View style={styles.trendingHeader}>
                  <Text style={styles.trendingTitle}>Trending tonight 🔥</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
                  {trending.map((item, i) => {
                    const photoRef = item?.photos?.[0]?.photo_reference
                    const photoUri = photoRef ? getPhotoUrl(photoRef) : null
                    return (
                      <View key={i} style={styles.trendingCard}>
                        {photoUri ? (
                          <Image source={{ uri: photoUri }} style={styles.trendingImage} />
                        ) : (
                          <View style={[styles.trendingImage, styles.trendingImageFallback]}>
                            <Text style={{ fontSize: 28 }}>🍽</Text>
                          </View>
                        )}
                        <Text style={styles.trendingName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.trendingMeta} numberOfLines={1}>{item.categories?.[0]?.name || 'Restaurant'}</Text>
                      </View>
                    )
                  })}
                </ScrollView>
              </View>

              <View style={{ height: 120 }} />
            </View>
          )}
        </ScrollView>

        {/* AI Vibe Planner button */}
        <TouchableOpacity style={styles.aiButton} onPress={() => setAiPlannerVisible(true)}>
          <LinearGradient colors={['#E8572A', '#FF8C42']} style={styles.aiButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.aiButtonText}>✦ Plan my night with AI</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* AI Planner Modal */}
        <Modal visible={aiPlannerVisible} animationType="slide" transparent onRequestClose={() => setAiPlannerVisible(false)}>
          <View style={styles.aiModalBackdrop}>
            <View style={styles.aiModalSheet}>
              <View style={styles.aiModalHandle} />
              <Text style={styles.aiModalTitle}>✦ AI Night Planner</Text>

              <Text style={styles.aiQuestion}>What's the vibe?</Text>
              <View style={styles.aiOptions}>
                {['🔥 Turn up', '😌 Chill', '🍕 Just eat', '💕 Date night'].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.aiOption, aiVibe === v.replace(/^[^\s]+\s/, '') && styles.aiOptionActive]}
                    onPress={() => setAiVibe(v.replace(/^[^\s]+\s/, ''))}
                  >
                    <Text style={[styles.aiOptionText, aiVibe === v.replace(/^[^\s]+\s/, '') && styles.aiOptionTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.aiQuestion}>Group size?</Text>
              <View style={styles.aiOptions}>
                {['Just me', 'Us 2', 'Small crew', 'Big group'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.aiOption, aiGroupSize === g && styles.aiOptionActive]}
                    onPress={() => setAiGroupSize(g)}
                  >
                    <Text style={[styles.aiOptionText, aiGroupSize === g && styles.aiOptionTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.aiQuestion}>Budget?</Text>
              <View style={styles.aiOptions}>
                {['$', '$$', '$$$'].map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.aiOption, aiBudget === b && styles.aiOptionActive]}
                    onPress={() => setAiBudget(b)}
                  >
                    <Text style={[styles.aiOptionText, aiBudget === b && styles.aiOptionTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {aiPlan.length === 0 ? (
                <TouchableOpacity style={styles.generateButton} onPress={handleGenerateAIPlan} disabled={aiLoading}>
                  {aiLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>Generate Plan</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.aiPlanList}>
                    {aiPlan.map((stop, i) => (
                      <View key={i} style={styles.aiPlanStop}>
                        <Text style={styles.aiPlanEmoji}>{stop.emoji}</Text>
                        <View style={styles.aiPlanInfo}>
                          <Text style={styles.aiPlanName}>{stop.name}</Text>
                          <Text style={styles.aiPlanDesc} numberOfLines={2}>{stop.description}</Text>
                        </View>
                        <Text style={styles.aiPlanPrice}>{'$'.repeat(stop.priceLevel || 2)}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.startCrawlButton} onPress={handleStartCrawl}>
                    <Text style={styles.startCrawlText}>Start this crawl</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={() => { setAiPlannerVisible(false); setAiPlan([]) }} style={styles.aiCloseButton}>
                <Text style={styles.aiCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Match Modal */}
        <MatchModal
          visible={matchVisible}
          place={matchPlace}
          onAddToPlan={() => {
            if (matchPlace) handleAddToOuting(matchPlace)
            setMatchVisible(false)
          }}
          onClose={() => setMatchVisible(false)}
        />

        {/* Toast */}
        <Toast
          message={toast.message}
          visible={toast.visible}
          onHide={() => setToast({ visible: false, message: '' })}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  notifBell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  weatherText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingBar: {
    height: 3,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  modeSwitcherContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  modeSwitcher: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 4,
    flexDirection: 'row',
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  modeOptionActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
  },
  modeTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Swipe mode
  swipeSection: {
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  cardStack: {
    height: 500,
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeButtons: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 20,
    justifyContent: 'center',
  },
  noButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  noButtonText: {
    fontSize: 26,
    color: Colors.error,
    fontWeight: '700',
  },
  yesButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  yesButtonText: {
    fontSize: 26,
    color: Colors.success,
    fontWeight: '700',
  },
  noMoreCards: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noMoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Browse mode
  browseSection: {
    paddingTop: 0,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -20,
    zIndex: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    padding: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
    color: '#8e8e93',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 4,
  },
  clearButton: {
    fontSize: 16,
    color: '#8e8e93',
    paddingHorizontal: 4,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  autocompleteDropdown: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  autocompleteEmoji: {
    fontSize: 16,
  },
  autocompleteInfo: {
    flex: 1,
  },
  autocompleteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  autocompleteAddress: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  filterScroll: {
    marginTop: 16,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  trendingSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trendingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  trendingScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trendingCard: {
    width: 145,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  trendingImage: {
    width: '100%',
    height: 100,
  },
  trendingImageFallback: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    padding: 8,
    paddingBottom: 4,
  },
  trendingMeta: {
    fontSize: 11,
    color: '#8e8e93',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  // AI button
  aiButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  aiButtonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  // AI Modal
  aiModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  aiModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  aiModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  aiModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
  },
  aiQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    marginTop: 4,
  },
  aiOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  aiOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  aiOptionActive: {
    backgroundColor: Colors.primary,
  },
  aiOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  aiOptionTextActive: {
    color: '#ffffff',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  aiPlanList: {
    marginTop: 8,
    marginBottom: 16,
  },
  aiPlanStop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  aiPlanEmoji: {
    fontSize: 28,
  },
  aiPlanInfo: {
    flex: 1,
  },
  aiPlanName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  aiPlanDesc: {
    fontSize: 12,
    color: '#8e8e93',
  },
  aiPlanPrice: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600',
  },
  startCrawlButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startCrawlText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  aiCloseButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  aiCloseText: {
    color: '#8e8e93',
    fontSize: 15,
  },
})
