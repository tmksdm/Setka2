// Хелперы для работы с датами
// Все даты в приложении — строки формата "YYYY-MM-DD"

/**
 * Сегодняшняя дата в формате "YYYY-MM-DD"
 */
export function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Сколько дней осталось до даты окончания
 * Положительное число = ещё есть время
 * 0 = последний день
 * Отрицательное = просрочено
 */
export function getDaysRemaining(expirationDateString: string): number {
  const today = new Date(getTodayString())
  const expiration = new Date(expirationDateString)
  const diffMs = expiration.getTime() - today.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Форматирует "2026-03-15" → "15.03.2026" (русский формат)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}.${month}.${year}`
}

/**
 * Рассчитывает дату окончания абонемента
 * Принимает дату начала и количество дней
 * Возвращает строку "YYYY-MM-DD"
 */
export function calculateExpirationDate(
  startDateString: string,
  durationDays: number
): string {
  const date = new Date(startDateString)
  date.setDate(date.getDate() + durationDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Прибавляет N дней к дате
 * Используется для заморозки, продления и т.д.
 */
export function addDaysToDate(dateString: string, days: number): string {
  return calculateExpirationDate(dateString, days)
}

/**
 * Склонение слова "день" по числу
 * 1 день, 2 дня, 5 дней, 21 день...
 */
export function pluralizeDays(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  const lastOne = abs % 10

  if (lastTwo >= 11 && lastTwo <= 19) return `${n} дней`
  if (lastOne === 1) return `${n} день`
  if (lastOne >= 2 && lastOne <= 4) return `${n} дня`
  return `${n} дней`
}

/**
 * Склонение слова "клиент" по числу
 * 1 клиент, 2 клиента, 5 клиентов...
 */
export function pluralizeClients(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  const lastOne = abs % 10

  if (lastTwo >= 11 && lastTwo <= 19) return `${n} клиентов`
  if (lastOne === 1) return `${n} клиент`
  if (lastOne >= 2 && lastOne <= 4) return `${n} клиента`
  return `${n} клиентов`
}

/**
 * Проверяет, что строка — валидная дата формата "YYYY-MM-DD"
 */
export function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Возвращает сколько дней прошло с даты (для бэкапов)
 * Всегда >= 0
 */
export function daysSinceDate(dateString: string): number {
  const days = getDaysRemaining(dateString)
  return Math.max(0, -days)
}
