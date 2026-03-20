import axios from 'axios'
import Constants from 'expo-constants'

const YELP_API_KEY = Constants.expoConfig?.extra?.YELP_API_KEY || ''

export async function searchYelp(term: string, lat = 40.7128, lng = -74.0060) {
  try {
    const r = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: { term, latitude: lat, longitude: lng, limit: 20 },
      headers: { Authorization: `Bearer ${YELP_API_KEY}` }
    })
    return r.data.businesses || []
  } catch { return [] }
}
