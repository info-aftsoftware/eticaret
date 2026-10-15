/**
 * Firestore helpers: users, addresses, orders, favorites
 * Collections: users/{uid}, users/{uid}/addresses/{addressId}, users/{uid}/orders/{orderId}, users/{uid}/favorites/{productId}
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { getDb } from './config'

export interface FirebaseUserProfile {
  email: string
  name: string
  phone?: string
  role: 'customer' | 'admin'
  customerNo?: string
  createdAt: ReturnType<typeof serverTimestamp> | { seconds: number; nanoseconds: number }
}

export interface FirebaseAddress {
  id?: string
  title: string
  name: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface FirebaseOrder {
  id?: string
  orderId: string
  customer: Record<string, unknown>
  items: Array<{ id: string; name: string; price: number; quantity: number }>
  pricing: { subtotal: number; tax: number; shipping: number; total: number }
  status: string
  paymentStatus: string
  createdAt: ReturnType<typeof serverTimestamp> | { seconds: number; nanoseconds: number }
  trackingNumber?: string
}

export async function getUserProfile(uid: string): Promise<FirebaseUserProfile | null> {
  try {
    const db = getDb()
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as FirebaseUserProfile
  } catch (error) {
    console.error('getUserProfile error:', error)
    return null
  }
}

export async function setUserProfile(
  uid: string,
  data: {
    name?: string
    phone?: string
    email?: string
    role?: 'customer' | 'admin'
    customerNo?: string
    /** Üyelik onayları: kullanım koşulları, KVKK bilgilendirmesi, ticari elektronik ileti izni (zaman damgalı) */
    consents?: Record<string, unknown>
  }
): Promise<void> {
  try {
    const db = getDb()
    const ref = doc(db, 'users', uid)
    const existing = await getDoc(ref)
    if (existing.exists()) {
      await updateDoc(ref, {
        ...(data.name != null && { name: data.name }),
        ...(data.phone != null && { phone: data.phone }),
        ...(data.email != null && { email: data.email }),
        ...(data.role != null && { role: data.role }),
        ...(data.customerNo != null && { customerNo: data.customerNo }),
        ...(data.consents != null && { consents: data.consents }),
      } as DocumentData)
    } else {
      await setDoc(ref, {
        email: data.email ?? '',
        name: data.name ?? '',
        phone: data.phone ?? '',
        role: data.role ?? 'customer',
        ...(data.customerNo != null && { customerNo: data.customerNo }),
        ...(data.consents != null && { consents: data.consents }),
        createdAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('setUserProfile error:', error)
    throw error
  }
}

export async function getAddresses(uid: string): Promise<(FirebaseAddress & { id: string })[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, 'users', uid, 'addresses'))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseAddress & { id: string }))
    list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    return list
  } catch (error) {
    console.error('getAddresses error:', error)
    return []
  }
}

export async function addAddress(uid: string, data: FirebaseAddress): Promise<string> {
  try {
    const db = getDb()
    const col = collection(db, 'users', uid, 'addresses')
    if (data.isDefault) {
      const batch = writeBatch(db)
      const addrs = await getDocs(col)
      addrs.docs.forEach((d) => batch.update(d.ref, { isDefault: false }))
      const newRef = doc(col)
      batch.set(newRef, { ...data, isDefault: true })
      await batch.commit()
      return newRef.id
    }
    const ref = await addDoc(col, data)
    return ref.id
  } catch (error) {
    console.error('addAddress error:', error)
    throw error
  }
}

export async function updateAddress(
  uid: string,
  addressId: string,
  data: Partial<FirebaseAddress>
): Promise<void> {
  try {
    const db = getDb()
    const ref = doc(db, 'users', uid, 'addresses', addressId)
    if (data.isDefault === true) {
      const batch = writeBatch(db)
      const addrs = await getDocs(collection(db, 'users', uid, 'addresses'))
      addrs.docs.forEach((d) => batch.update(d.ref, { isDefault: false }))
      batch.update(ref, data)
      await batch.commit()
    } else {
      await updateDoc(ref, data as DocumentData)
    }
  } catch (error) {
    console.error('updateAddress error:', error)
    throw error
  }
}

export async function deleteAddress(uid: string, addressId: string): Promise<void> {
  try {
    const db = getDb()
    await deleteDoc(doc(db, 'users', uid, 'addresses', addressId))
  } catch (error) {
    console.error('deleteAddress error:', error)
    throw error
  }
}

export async function getOrders(uid: string): Promise<(FirebaseOrder & { id: string; createdAt: Date })[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, 'users', uid, 'orders'))
    const list = snap.docs.map((d) => {
      const data = d.data()
      const createdAt = data.createdAt as { seconds: number; nanoseconds: number } | null
      return {
        id: d.id,
        ...data,
        createdAt: createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(),
      } as FirebaseOrder & { id: string; createdAt: Date }
    })
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return list
  } catch (error) {
    console.error('getOrders error:', error)
    return []
  }
}

export async function createOrder(uid: string, order: Omit<FirebaseOrder, 'id' | 'createdAt'>): Promise<string> {
  try {
    const db = getDb()
    const ref = await addDoc(collection(db, 'users', uid, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
    })
    return ref.id
  } catch (error) {
    console.error('createOrder error:', error)
    throw error
  }
}

// --- Favorites: users/{uid}/favorites (doc id = productId)

export interface FirebaseFavorite {
  productId: string
  createdAt: ReturnType<typeof serverTimestamp> | { seconds: number; nanoseconds: number }
}

export async function getFavorites(uid: string): Promise<(FirebaseFavorite & { id: string })[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
    return snap.docs.map((d) => {
      const data = d.data()
      return { id: d.id, productId: d.id, ...data } as FirebaseFavorite & { id: string }
    })
  } catch (error) {
    console.error('getFavorites error:', error)
    return []
  }
}

export async function addFavorite(uid: string, productId: string): Promise<void> {
  try {
    const db = getDb()
    const ref = doc(db, 'users', uid, 'favorites', productId)
    const existing = await getDoc(ref)
    if (existing.exists()) return
    await setDoc(ref, { productId, createdAt: serverTimestamp() })
  } catch (error) {
    console.error('addFavorite error:', error)
    throw error
  }
}

export async function removeFavorite(uid: string, productId: string): Promise<void> {
  try {
    const db = getDb()
    await deleteDoc(doc(db, 'users', uid, 'favorites', productId))
  } catch (error) {
    console.error('removeFavorite error:', error)
    throw error
  }
}
