// Все операции с базой данных Firestore
// Клиенты: users/{userId}/clients/{clientId}
// Тарифы: users/{userId}/tariffs/{tariffId}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Client, Tariff, PaymentInfo, PaymentHistoryEntry, FreezeInfo } from '../types'
import { getTodayString } from './dateHelpers'

// ========================================
// Вспомогательные функции
// ========================================

/**
 * Путь к коллекции клиентов текущего пользователя
 */
function clientsRef(userId: string) {
  return collection(db, 'users', userId, 'clients')
}

/**
 * Путь к конкретному документу клиента
 */
function clientDocRef(userId: string, clientId: string) {
  return doc(db, 'users', userId, 'clients', clientId)
}

/**
 * Путь к коллекции тарифов текущего пользователя
 */
function tariffsRef(userId: string) {
  return collection(db, 'users', userId, 'tariffs')
}

/**
 * Путь к конкретному документу тарифа
 */
function tariffDocRef(userId: string, tariffId: string) {
  return doc(db, 'users', userId, 'tariffs', tariffId)
}

/**
 * Преобразует документ Firestore в объект Client
 */
function docToClient(docData: DocumentData, docId: string): Client {
  return {
    id: docId,
    firstName: docData.firstName ?? '',
    lastName: docData.lastName ?? '',
    phone: docData.phone ?? '',
    notes: docData.notes ?? '',
    archived: docData.archived ?? false,
    archivedAt: docData.archivedAt ?? null,
    currentPayment: docData.currentPayment ?? { date: '', amount: 0, durationDays: 0 },
    expirationDate: docData.expirationDate ?? '',
    freeze: docData.freeze ?? null,
    paymentHistory: docData.paymentHistory ?? [],
    createdAt: docData.createdAt ?? '',
    tariffId: docData.tariffId ?? undefined,
  }
}

/**
 * Преобразует документ Firestore в объект Tariff
 */
function docToTariff(docData: DocumentData, docId: string): Tariff {
  return {
    id: docId,
    name: docData.name ?? '',
    amount: docData.amount ?? 0,
    durationDays: docData.durationDays ?? 0,
  }
}

// ========================================
// КЛИЕНТЫ — CRUD
// ========================================

/**
 * Загружает всех клиентов пользователя
 */
export async function fetchClients(userId: string): Promise<Client[]> {
  const snapshot = await getDocs(clientsRef(userId))
  return snapshot.docs.map((d) => docToClient(d.data(), d.id))
}

/**
 * Загружает одного клиента по ID
 */
export async function fetchClient(userId: string, clientId: string): Promise<Client | null> {
  const snapshot = await getDoc(clientDocRef(userId, clientId))
  if (!snapshot.exists()) return null
  return docToClient(snapshot.data(), snapshot.id)
}

/**
 * Создаёт нового клиента
 * Возвращает ID созданного документа
 */
export async function createClient(
  userId: string,
  data: {
    firstName: string
    lastName: string
    phone: string
    notes: string
    amount: number
    durationDays: number
    paymentDate: string
    expirationDate: string
    tariffId?: string
  }
): Promise<string> {
  const now = getTodayString()

  const currentPayment: PaymentInfo = {
    date: data.paymentDate,
    amount: data.amount,
    durationDays: data.durationDays,
  }

  const firstHistoryEntry: PaymentHistoryEntry = {
    date: data.paymentDate,
    amount: data.amount,
    durationDays: data.durationDays,
    expirationDate: data.expirationDate,
  }

  const clientData = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone.trim(),
    notes: data.notes.trim(),
    archived: false,
    archivedAt: null,
    currentPayment,
    expirationDate: data.expirationDate,
    freeze: null,
    paymentHistory: [firstHistoryEntry],
    createdAt: now,
    ...(data.tariffId ? { tariffId: data.tariffId } : {}),
  }

  const docRef = await addDoc(clientsRef(userId), clientData)
  return docRef.id
}

/**
 * Обновляет данные клиента (частичное обновление)
 */
export async function updateClient(
  userId: string,
  clientId: string,
  data: Partial<Omit<Client, 'id'>>
): Promise<void> {
  await updateDoc(clientDocRef(userId, clientId), data as DocumentData)
}

/**
 * Удаляет клиента
 */
export async function deleteClient(userId: string, clientId: string): Promise<void> {
  await deleteDoc(clientDocRef(userId, clientId))
}

// ========================================
// КЛИЕНТЫ — МАССОВЫЕ ОПЕРАЦИИ
// ========================================

/**
 * Удаляет несколько клиентов за один раз (batch)
 * Firestore batch поддерживает до 500 операций
 */
export async function deleteClientsBatch(userId: string, clientIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  for (const id of clientIds) {
    batch.delete(clientDocRef(userId, id))
  }
  await batch.commit()
}

/**
 * Архивирует несколько клиентов за один раз
 */
export async function archiveClientsBatch(userId: string, clientIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  const now = getTodayString()
  for (const id of clientIds) {
    batch.update(clientDocRef(userId, id), {
      archived: true,
      archivedAt: now,
    })
  }
  await batch.commit()
}

/**
 * Восстанавливает несколько клиентов из архива за один раз
 */
export async function restoreClientsBatch(userId: string, clientIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  for (const id of clientIds) {
    batch.update(clientDocRef(userId, id), {
      archived: false,
      archivedAt: null,
    })
  }
  await batch.commit()
}

// ========================================
// КЛИЕНТЫ — АРХИВАЦИЯ
// ========================================

/**
 * Архивирует одного клиента
 */
export async function archiveClient(userId: string, clientId: string): Promise<void> {
  await updateDoc(clientDocRef(userId, clientId), {
    archived: true,
    archivedAt: getTodayString(),
  })
}

/**
 * Восстанавливает одного клиента из архива
 */
export async function restoreClient(userId: string, clientId: string): Promise<void> {
  await updateDoc(clientDocRef(userId, clientId), {
    archived: false,
    archivedAt: null,
  })
}

// ========================================
// КЛИЕНТЫ — ПРОДЛЕНИЕ ОПЛАТЫ
// ========================================

/**
 * Продлевает абонемент клиента
 *
 * Умная логика:
 * - Если абонемент ещё активен → новый период начинается ПОСЛЕ текущего
 * - Если абонемент просрочен → новый период начинается с СЕГОДНЯ
 *
 * Обновляет: currentPayment, expirationDate, paymentHistory
 */
export async function renewClient(
  userId: string,
  clientId: string,
  data: {
    amount: number
    durationDays: number
    newExpirationDate: string
    tariffId?: string
  }
): Promise<void> {
  // Сначала загружаем текущие данные клиента
  const client = await fetchClient(userId, clientId)
  if (!client) throw new Error('Клиент не найден')

  const now = getTodayString()

  const newPayment: PaymentInfo = {
    date: now,
    amount: data.amount,
    durationDays: data.durationDays,
  }

  const historyEntry: PaymentHistoryEntry = {
    date: now,
    amount: data.amount,
    durationDays: data.durationDays,
    expirationDate: data.newExpirationDate,
  }

  // Текущий платёж уходит в «предыдущие» — он уже в истории с момента создания/прошлого продления
  const updatedHistory = [...client.paymentHistory, historyEntry]

  await updateDoc(clientDocRef(userId, clientId), {
    currentPayment: newPayment,
    expirationDate: data.newExpirationDate,
    paymentHistory: updatedHistory,
    ...(data.tariffId !== undefined ? { tariffId: data.tariffId } : {}),
  })
}

// ========================================
// КЛИЕНТЫ — ЗАМОРОЗКА
// ========================================

/**
 * Замораживает абонемент клиента
 *
 * Заморозка сдвигает дату окончания на N дней вперёд
 * Сохраняет оригинальную дату окончания на случай досрочной разморозки
 */
export async function freezeClient(
  userId: string,
  clientId: string,
  data: {
    days: number
    newExpirationDate: string
    freezeEndDate: string
  }
): Promise<void> {
  const client = await fetchClient(userId, clientId)
  if (!client) throw new Error('Клиент не найден')

  const now = getTodayString()

  const freeze: FreezeInfo = {
    startDate: now,
    days: data.days,
    endDate: data.freezeEndDate,
    originalExpiration: client.expirationDate,
  }

  const historyEntry: PaymentHistoryEntry = {
    type: 'freeze',
    date: now,
    days: data.days,
    freezeEnd: data.freezeEndDate,
  }

  const updatedHistory = [...client.paymentHistory, historyEntry]

  await updateDoc(clientDocRef(userId, clientId), {
    freeze,
    expirationDate: data.newExpirationDate,
    paymentHistory: updatedHistory,
  })
}

/**
 * Размораживает клиента досрочно
 *
 * Пересчитывает дату окончания: вычитает неиспользованные дни заморозки
 */
export async function unfreezeClient(
  userId: string,
  clientId: string,
  data: {
    actualDays: number
    unusedDays: number
    correctedExpirationDate: string
  }
): Promise<void> {
  const client = await fetchClient(userId, clientId)
  if (!client) throw new Error('Клиент не найден')

  const now = getTodayString()

  const historyEntry: PaymentHistoryEntry = {
    type: 'unfreeze',
    date: now,
    actualDays: data.actualDays,
    unusedDays: data.unusedDays,
  }

  const updatedHistory = [...client.paymentHistory, historyEntry]

  await updateDoc(clientDocRef(userId, clientId), {
    freeze: null,
    expirationDate: data.correctedExpirationDate,
    paymentHistory: updatedHistory,
  })
}

/**
 * Автоматическая разморозка: убирает заморозку, если её срок истёк
 * Вызывается при загрузке главного экрана
 * Дата окончания уже была сдвинута при заморозке, поэтому просто очищаем freeze
 */
export async function autoUnfreezeIfExpired(userId: string, client: Client): Promise<boolean> {
  if (!client.freeze) return false

  const today = getTodayString()
  if (client.freeze.endDate > today) return false

  // Заморозка истекла — убираем freeze, дата окончания уже корректная
  const historyEntry: PaymentHistoryEntry = {
    type: 'unfreeze',
    date: client.freeze.endDate,
    actualDays: client.freeze.days,
    unusedDays: 0,
  }

  const updatedHistory = [...client.paymentHistory, historyEntry]

  await updateDoc(clientDocRef(userId, client.id), {
    freeze: null,
    paymentHistory: updatedHistory,
  })

  return true
}

// ========================================
// ТАРИФЫ — CRUD
// ========================================

/**
 * Загружает все тарифы пользователя
 */
export async function fetchTariffs(userId: string): Promise<Tariff[]> {
  const snapshot = await getDocs(tariffsRef(userId))
  return snapshot.docs.map((d) => docToTariff(d.data(), d.id))
}

/**
 * Создаёт новый тариф
 * Возвращает ID созданного документа
 */
export async function createTariff(
  userId: string,
  data: { name: string; amount: number; durationDays: number }
): Promise<string> {
  const docRef = await addDoc(tariffsRef(userId), {
    name: data.name.trim(),
    amount: data.amount,
    durationDays: data.durationDays,
  })
  return docRef.id
}

/**
 * Обновляет тариф
 */
export async function updateTariff(
  userId: string,
  tariffId: string,
  data: { name: string; amount: number; durationDays: number }
): Promise<void> {
  await updateDoc(tariffDocRef(userId, tariffId), {
    name: data.name.trim(),
    amount: data.amount,
    durationDays: data.durationDays,
  })
}

/**
 * Удаляет тариф
 */
export async function deleteTariff(userId: string, tariffId: string): Promise<void> {
  await deleteDoc(tariffDocRef(userId, tariffId))
}

// ========================================
// БЭКАП — ИМПОРТ
// ========================================

/**
 * Импорт клиентов и тарифов из бэкапа
 * Режим "replace" — удаляет все существующие данные и заменяет на данные из бэкапа
 * Режим "merge" — добавляет данные из бэкапа к существующим
 */
export async function importBackup(
  userId: string,
  clients: Client[],
  tariffs: Tariff[],
  mode: 'replace' | 'merge'
): Promise<{ importedClients: number; importedTariffs: number }> {
  if (mode === 'replace') {
    // Удаляем все существующие данные
    const existingClients = await fetchClients(userId)
    const existingTariffs = await fetchTariffs(userId)

    // Удаляем пачками по 500 (лимит Firestore batch)
    const deleteIds = [
      ...existingClients.map((c) => ({ type: 'client' as const, id: c.id })),
      ...existingTariffs.map((t) => ({ type: 'tariff' as const, id: t.id })),
    ]

    // Разбиваем на чанки по 500
    for (let i = 0; i < deleteIds.length; i += 500) {
      const chunk = deleteIds.slice(i, i + 500)
      const batch = writeBatch(db)
      for (const item of chunk) {
        if (item.type === 'client') {
          batch.delete(clientDocRef(userId, item.id))
        } else {
          batch.delete(tariffDocRef(userId, item.id))
        }
      }
      await batch.commit()
    }
  }

  // Добавляем данные из бэкапа (пачками по 500)
  const allItems = [
    ...clients.map((c) => ({ type: 'client' as const, data: c })),
    ...tariffs.map((t) => ({ type: 'tariff' as const, data: t })),
  ]

  for (let i = 0; i < allItems.length; i += 500) {
    const chunk = allItems.slice(i, i + 500)
    const batch = writeBatch(db)
    for (const item of chunk) {
      if (item.type === 'client') {
        const client = item.data as Client
        // Создаём новый документ (не используем старый ID — он может конфликтовать)
        const newDocRef = doc(clientsRef(userId))
        const { id, ...clientData } = client
        batch.set(newDocRef, clientData)
      } else {
        const tariff = item.data as Tariff
        const newDocRef = doc(tariffsRef(userId))
        const { id, ...tariffData } = tariff
        batch.set(newDocRef, tariffData)
      }
    }
    await batch.commit()
  }

  return {
    importedClients: clients.length,
    importedTariffs: tariffs.length,
  }
}
