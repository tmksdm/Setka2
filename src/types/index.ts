// Все TypeScript-типы приложения

// === Статусы клиента ===

export type ClientStatusName =
  | 'overdue'   // просрочен
  | 'urgent'    // 0–3 дня
  | 'soon'      // 4–7 дней
  | 'normal'    // 8–14 дней
  | 'good'      // 15+ дней
  | 'frozen'    // заморожен
  | 'archived'  // в архиве

export interface ClientStatus {
  status: ClientStatusName
  label: string        // Русское название, например «Просрочен»
  color: string        // CSS-переменная, например 'var(--color-status-overdue)'
  sortOrder: number    // Для сортировки: 0 = сверху, 6 = снизу
  daysRemaining: number // Дней до истечения (отрицательное = просрочено)
}

// === Информация о заморозке ===

export interface FreezeInfo {
  startDate: string          // "2026-03-04"
  days: number               // Сколько дней заморозка
  endDate: string            // "2026-03-14"
  originalExpiration: string // Исходная дата окончания абонемента
}

// === Текущий платёж ===

export interface PaymentInfo {
  date: string        // Дата платежа "2026-02-15"
  amount: number      // Сумма, например 3000
  durationDays: number // Длительность в днях, например 30
}

// === Запись в истории платежей ===

export interface PaymentHistoryEntry {
  date: string
  amount?: number         // Есть только у обычных платежей
  durationDays?: number   // Есть только у обычных платежей
  expirationDate?: string // Есть только у обычных платежей
  type?: 'freeze' | 'unfreeze' // Только для записей заморозки/разморозки
  days?: number           // Только для freeze
  freezeEnd?: string      // Только для freeze
  actualDays?: number     // Только для unfreeze
  unusedDays?: number     // Только для unfreeze
}

// === Клиент ===

export interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  notes: string
  archived: boolean
  archivedAt: string | null
  currentPayment: PaymentInfo
  expirationDate: string
  freeze: FreezeInfo | null
  paymentHistory: PaymentHistoryEntry[]
  createdAt: string
  tariffId?: string  // ID выбранного тарифа (опционально)
}

// === Тариф ===

export interface Tariff {
  id: string
  name: string         // Название, например «Месяц»
  amount: number       // Стоимость, например 3000
  durationDays: number // Длительность в днях, например 30
}

// === Метаданные резервной копии ===

export interface BackupMeta {
  lastExportDate: string | null
  lastImportDate: string | null
  lastExportClients: number
  lastExportTariffs: number
}

// === Формат JSON-файла резервной копии ===

export interface BackupFile {
  version: string
  createdAt: string
  app: 'setka'
  data: {
    clients: Client[]
    tariffs: Tariff[]
  }
  stats: {
    totalClients: number
    totalTariffs: number
    activeClients: number
    archivedClients: number
  }
}
