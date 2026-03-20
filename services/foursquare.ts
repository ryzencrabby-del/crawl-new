import axios from 'axios'
import Constants from 'expo-constants'

const FOURSQUARE_KEY = Constants.expoConfig?.extra?.FOURSQUARE_KEY || ''

export async function getTrending() {
  try {
    const r = await axios.get('https://api.foursquare.com/v3/places/search', {
      params: { ll: '40.7128,-74.0060', sort: 'POPULARITY', limit: 10, categories: '13000' },
      headers: { Authorization: FOURSQUARE_KEY }
    })
    return r.data.results || []
  } catch { return [] }
}
