import axios from 'axios'
import Constants from 'expo-constants'

const NYC_OPEN_DATA_TOKEN = Constants.expoConfig?.extra?.NYC_OPEN_DATA_TOKEN || ''

export async function getHealthGrade(name: string) {
  try {
    const r = await axios.get('https://data.cityofnewyork.us/resource/43nn-pn8j.json', {
      params: { dba: name.toUpperCase(), '$limit': 1 },
      headers: { 'X-App-Token': NYC_OPEN_DATA_TOKEN }
    })
    return r.data[0]?.grade || null
  } catch { return null }
}
