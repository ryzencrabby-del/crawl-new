import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { signInAnon } from '../services/firebase'
import { Colors } from '../constants/colors'

const { width, height } = Dimensions.get('window')

export default function Index() {
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Sign in anonymously
    signInAnon().catch(() => {})

    // Animate logo
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(1200),
    ]).start(() => {
      router.replace('/(tabs)/discover')
    })
  }, [])

  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Text style={styles.logo}>🗺</Text>
        <Text style={styles.appName}>Crawl</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Plan your NYC night out
      </Animated.Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 72,
    marginBottom: 12,
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
})
