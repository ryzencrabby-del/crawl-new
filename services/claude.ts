import axios from 'axios'
import Constants from 'expo-constants'

const CLAUDE_API_KEY = Constants.expoConfig?.extra?.CLAUDE_API_KEY || ''

export async function generateRecap(stops: string[], duration: number, friends: string[], distance: number) {
  try {
    if (!CLAUDE_API_KEY) throw new Error('No API key')
    const r = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a fun enthusiastic 3 sentence recap of this NYC night out. Stops: ${stops.join(', ')}. Duration: ${duration} minutes. Friends: ${friends.join(', ')}. Distance: ${distance} miles. Include emojis. Under 100 words.`
      }]
    }, {
      headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    })
    return r.data.content[0].text
  } catch {
    return `What a night! You and your crew hit ${stops.length} legendary spots across NYC. ${stops.join(' → ')}. Memories made, miles walked, vibes immaculate. 🗽🔥`
  }
}

export async function generateOutingPlan(vibe: string, budget: string, groupSize: string) {
  try {
    if (!CLAUDE_API_KEY) throw new Error('No API key')
    const r = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Generate a fun NYC outing plan tonight. Vibe: ${vibe}. Budget: ${budget}. Group size: ${groupSize}. Return exactly 3 stop suggestions as a JSON array with fields: name, type, description, priceLevel (1-3), emoji. Return only valid JSON no other text.`
      }]
    }, {
      headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    })
    return JSON.parse(r.data.content[0].text)
  } catch {
    return [
      { name: "Joe's Pizza", type: 'restaurant', description: 'Classic NYC slice', priceLevel: 1, emoji: '🍕' },
      { name: 'Death & Co', type: 'bar', description: 'Award-winning cocktail bar', priceLevel: 3, emoji: '🥃' },
      { name: 'Attaboy', type: 'bar', description: 'Speakeasy vibes, no menu', priceLevel: 2, emoji: '🍸' },
    ]
  }
}
