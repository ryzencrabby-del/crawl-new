import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'

interface StopItemProps {
  stop: {
    name: string
    address: string
    time?: string
    status: 'done' | 'current' | 'upcoming'
    emoji?: string
  }
  index: number
}

export default function StopItem({ stop, index }: StopItemProps) {
  const statusColor =
    stop.status === 'done' ? Colors.success :
    stop.status === 'current' ? Colors.primary :
    '#c7c7cc'

  const statusLabel =
    stop.status === 'done' ? 'Done' :
    stop.status === 'current' ? 'Now' :
    'Later'

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: statusColor }]}>
        <Text style={styles.circleText}>{index + 1}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{stop.name}</Text>
        <Text style={styles.address}>{stop.address}</Text>
        {stop.time && <Text style={styles.time}>{stop.time}</Text>}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#8e8e93',
  },
  time: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
