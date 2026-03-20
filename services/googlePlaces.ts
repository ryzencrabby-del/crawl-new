import axios from 'axios'
import Constants from 'expo-constants'

const KEY = Constants.expoConfig?.extra?.GOOGLE_PLACES_KEY || ''

export function getPhotoUrl(photoReference: string) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${KEY}`
}

export async function searchPlaces(query: string) {
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: { query, location: '40.7128,-74.0060', radius: 5000, key: KEY }
    })
    return r.data.results || []
  } catch { return [] }
}

export async function getNearbyPlaces(type = 'restaurant') {
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: { location: '40.7128,-74.0060', radius: 2000, type, key: KEY }
    })
    return r.data.results || []
  } catch { return [] }
}

export async function getAutocomplete(input: string) {
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: { input, location: '40.7128,-74.0060', radius: 5000, components: 'country:us', key: KEY }
    })
    return r.data.predictions || []
  } catch { return [] }
}

export async function getWalkingTime(oLat: number, oLng: number, dLat: number, dLng: number) {
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: { origin: `${oLat},${oLng}`, destination: `${dLat},${dLng}`, mode: 'walking', key: KEY }
    })
    return r.data.routes[0]?.legs[0]?.duration?.text || '~10 min'
  } catch { return '~10 min' }
}
