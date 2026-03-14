// Бизнес-логика: определение статуса клиента и сортировка по срочности

import type { Client, ClientStatus, ClientStatusName, FreezeInfo } from '../types'
import { getDaysRemaining } from './dateHelpers'

// Конфигурация статусов: порог дней, цвет, порядок сортировки, название
interface StatusConfig {
  status: ClientStatusName
  label: string
  color: string
  sortOrder: number
}

const STATUS_MAP: Record<ClientStatusName, StatusConfig> = {
  overdue: {
    status: 'overdue',
    label: 'Просрочен',
    color: 'var(--color-status-overdue)',
    sortOrder: 0,
  },
  urgent: {
    status: 'urgent',
    label: 'Срочно',
    color: 'var(--color-status-urgent)',
    sortOrder: 1,
  },
  soon: {
    status: 'soon',
    label: 'Скоро',
    color: 'var(--color-status-soon)',
    sortOrder: 2,
  },
  normal: {
    status: 'normal',
    label: 'Норма',
    color: 'var(--color-status-normal)',
    sortOrder: 3,
  },
  good: {
    status: 'good',
    label: 'Хорошо',
    color: 'var(--color-status-good)',
    sortOrder: 4,
  },
  frozen: {
    status: 'frozen',
    label: 'Заморожен',
    color: 'var(--color-status-frozen)',
    sortOrder: 5,
  },
  archived: {
    status: 'archived',
    label: 'Архив',
    color: 'var(--color-status-archived)',
    sortOrder: 6,
  },
}

/**
 * Определяет статус клиента по дате окончания, заморозке и архиву
 *
 * Логика приоритетов:
 * 1. Если архивирован → "archived"
 * 2. Если заморожен (freeze !== null) → "frozen"
 * 3. Иначе считаем по дням:
 *    - < 0 дней → "overdue" (просрочен)
 *    - 0–3 дня → "urgent" (срочно)
 *    - 4–7 дней → "soon" (скоро)
 *    - 8–14 дней → "normal" (норма)
 *    - 15+ дней → "good" (хорошо)
 */
export function getClientStatus(
  expirationDateString: string,
  freeze: FreezeInfo | null,
  archived: boolean
): ClientStatus {
  // Архивный клиент
  if (archived) {
    return {
      ...STATUS_MAP.archived,
      daysRemaining: getDaysRemaining(expirationDateString),
    }
  }

  // Замороженный клиент
  if (freeze) {
    return {
      ...STATUS_MAP.frozen,
      daysRemaining: getDaysRemaining(expirationDateString),
    }
  }

  // Определяем по дням до окончания
  const days = getDaysRemaining(expirationDateString)

  if (days < 0) {
    return { ...STATUS_MAP.overdue, daysRemaining: days }
  }
  if (days <= 3) {
    return { ...STATUS_MAP.urgent, daysRemaining: days }
  }
  if (days <= 7) {
    return { ...STATUS_MAP.soon, daysRemaining: days }
  }
  if (days <= 14) {
    return { ...STATUS_MAP.normal, daysRemaining: days }
  }
  return { ...STATUS_MAP.good, daysRemaining: days }
}

/**
 * Сортирует клиентов по срочности:
 * 1. Сначала по sortOrder (просроченные наверху, хорошие внизу)
 * 2. Внутри группы — по daysRemaining (у кого меньше дней — выше)
 * 3. При равных днях — по фамилии
 *
 * Возвращает новый массив (не мутирует оригинал)
 */
export function sortClientsByUrgency(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    const statusA = getClientStatus(a.expirationDate, a.freeze, a.archived)
    const statusB = getClientStatus(b.expirationDate, b.freeze, b.archived)

    // Сначала по группе срочности
    if (statusA.sortOrder !== statusB.sortOrder) {
      return statusA.sortOrder - statusB.sortOrder
    }

    // Внутри группы — кто истекает раньше, тот выше
    if (statusA.daysRemaining !== statusB.daysRemaining) {
      return statusA.daysRemaining - statusB.daysRemaining
    }

    // При равенстве — по фамилии
    return a.lastName.localeCompare(b.lastName, 'ru')
  })
}

/**
 * Подсчитывает количество «горящих» клиентов (overdue + urgent)
 * Исключает замороженных и архивных
 * Используется для баннера срочности на главном экране
 */
export function countUrgentClients(clients: Client[]): number {
  return clients.filter((client) => {
    if (client.archived || client.freeze) return false
    const status = getClientStatus(client.expirationDate, client.freeze, client.archived)
    return status.status === 'overdue' || status.status === 'urgent'
  }).length
}

/**
 * Фильтрует только «горящих» клиентов (overdue + urgent)
 * Исключает замороженных и архивных
 * Используется при нажатии на баннер срочности
 */
export function filterUrgentClients(clients: Client[]): Client[] {
  return clients.filter((client) => {
    if (client.archived || client.freeze) return false
    const status = getClientStatus(client.expirationDate, client.freeze, client.archived)
    return status.status === 'overdue' || status.status === 'urgent'
  })
}
