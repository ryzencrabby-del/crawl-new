import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra || {}

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY || '',
  authDomain: 'crawl-4798d.firebaseapp.com',
  projectId: 'crawl-4798d',
  storageBucket: 'crawl-4798d.firebasestorage.app',
  messagingSenderId: '143973213470',
  appId: '1:143973213470:web:aaa7ef1c418afa04a2150f',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export async function signInAnon() {
  try { return await signInAnonymously(auth) } catch { return null }
}

export async function createSwipeSession(spots: any[]) {
  try {
    const ref = await addDoc(collection(db, 'sessions'), {
      spots, swipes: {}, createdAt: Timestamp.now(), active: true
    })
    return ref.id
  } catch { return null }
}

export async function recordSwipe(sessionId: string, userId: string, spotId: string, direction: 'yes' | 'no') {
  try {
    const ref = doc(db, 'sessions', sessionId)
    await updateDoc(ref, { [`swipes.${userId}.${spotId}`]: direction })
  } catch {}
}

export function subscribeToSession(sessionId: string, callback: (data: any) => void) {
  const ref = doc(db, 'sessions', sessionId)
  return onSnapshot(ref, (snap) => { if (snap.exists()) callback(snap.data()) })
}

export async function saveToWishlist(userId: string, place: any) {
  try {
    await addDoc(collection(db, 'wishlist'), { userId, ...place, savedAt: Timestamp.now() })
  } catch {}
}

export async function getWishlist(userId: string) {
  try {
    const q = query(collection(db, 'wishlist'), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch { return [] }
}

export async function saveRating(outingId: string, spotName: string, rating: number) {
  try {
    await updateDoc(doc(db, 'outings', outingId), { [`ratings.${spotName}`]: rating })
  } catch {}
}

export async function getUserProfile(userId: string) {
  try {
    const snap = await getDoc(doc(db, 'users', userId))
    if (snap.exists()) return snap.data()
    return null
  } catch { return null }
}

export async function updateUserProfile(userId: string, data: any) {
  try {
    await setDoc(doc(db, 'users', userId), data, { merge: true })
  } catch {}
}

export async function getUserOutings(userId: string) {
  try {
    const q = query(collection(db, 'outings'), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch { return [] }
}

export async function saveVote(sessionId: string, userId: string, venueId: string, vote: 'yes' | 'no') {
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      [`votes.${venueId}.${userId}`]: vote
    })
  } catch {}
}

export async function markStopDone(outingId: string, stopIndex: number) {
  try {
    await updateDoc(doc(db, 'outings', outingId), {
      [`stops.${stopIndex}.done`]: true
    })
  } catch {}
}
