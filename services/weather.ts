import axios from 'axios'
import Constants from 'expo-constants'

const OPENWEATHER_KEY = Constants.expoConfig?.extra?.OPENWEATHER_KEY || ''

export async function getNYCWeather() {
  try {
    if (!OPENWEATHER_KEY) throw new Error('No key')
    const r = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat: 40.7128, lon: -74.0060, appid: OPENWEATHER_KEY, units: 'imperial' }
    })
    return { temp: Math.round(r.data.main.temp), condition: r.data.weather[0].main }
  } catch { return { temp: 72, condition: 'Clear' } }
}
