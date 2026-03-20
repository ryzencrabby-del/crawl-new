import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface ProgressBarProps {
  progress: number // 0 to 1
  height?: number
}

export default function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [progress])

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#E8572A', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 4,
    overflow: 'hidden',
  },
})
