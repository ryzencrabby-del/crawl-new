import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'

interface VenueOption {
  id: string
  name: string
  meta: string
  emoji: string
  yesCount: number
  noCount: number
}

interface VoteCardProps {
  options: VenueOption[]
  onVote: (venueId: string, vote: 'yes' | 'no') => void
}

export default function VoteCard({ options, onVote }: VoteCardProps) {
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({})

  const handleVote = (venueId: string, vote: 'yes' | 'no') => {
    setVotes(prev => ({ ...prev, [venueId]: vote }))
    onVote(venueId, vote)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Where to next?</Text>
      {options.map(option => {
        const total = option.yesCount + option.noCount
        const yesPercent = total > 0 ? Math.round((option.yesCount / total) * 100) : 0
        const voted = votes[option.id]

        return (
          <View key={option.id} style={styles.option}>
            <View style={styles.optionHeader}>
              <View style={styles.emojiBox}>
                <Text style={styles.emoji}>{option.emoji}</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{option.name}</Text>
                <Text style={styles.optionMeta}>{option.meta}</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${yesPercent}%` }]} />
            </View>
            <Text style={styles.percentText}>{yesPercent}% want to go</Text>

            {/* Vote buttons or result */}
            {voted ? (
              <View style={[styles.votedChip, { backgroundColor: voted === 'yes' ? '#E8F8ED' : '#FFF0EB' }]}>
                <Text style={[styles.votedChipText, { color: voted === 'yes' ? Colors.success : Colors.primary }]}>
                  {voted === 'yes' ? 'You voted Yes ✓' : 'You voted No ✕'}
                </Text>
              </View>
            ) : (
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  style={styles.yesButton}
                  onPress={() => handleVote(option.id, 'yes')}
                >
                  <Text style={styles.yesButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.noButton}
                  onPress={() => handleVote(option.id, 'no')}
                >
                  <Text style={styles.noButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  option: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  optionMeta: {
    fontSize: 12,
    color: '#8e8e93',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f2f2f7',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  percentText: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 10,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#E8F8ED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  yesButtonText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  noButton: {
    flex: 1,
    backgroundColor: '#FFF0EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  noButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  votedChip: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  votedChipText: {
    fontWeight: '700',
    fontSize: 14,
  },
})
