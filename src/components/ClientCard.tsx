// Карточка клиента — компактный блок со статусной полоской и основной информацией

import { Snowflake, FileText } from 'lucide-react'
import Card from './ui/Card'
import { getClientStatus } from '../lib/clientStatus'
import { formatDate, pluralizeDays } from '../lib/dateHelpers'
import type { Client } from '../types'

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  // Определяем статус клиента (цвет, текст, дни)
  const status = getClientStatus(client.expirationDate, client.freeze, client.archived)

  // Формируем строку «до какого числа»
  const expirationFormatted = formatDate(client.expirationDate)

  // Сумма в читаемом формате: 3000 → "3 000"
  const amountFormatted = client.currentPayment.amount.toLocaleString('ru-RU')

  // Длительность
  const durationText = pluralizeDays(client.currentPayment.durationDays)

  // Полное имя
  const fullName = `${client.firstName} ${client.lastName}`.trim()

  // Текст для дней до окончания (показываем только для активных, не замороженных)
  const isFrozen = status.status === 'frozen'
  const isArchived = status.status === 'archived'

  let daysText = ''
  if (!isFrozen && !isArchived) {
    if (status.daysRemaining < 0) {
      daysText = `${pluralizeDays(Math.abs(status.daysRemaining))} назад`
    } else if (status.daysRemaining === 0) {
      daysText = 'Сегодня'
    } else {
      daysText = `${pluralizeDays(status.daysRemaining)} ост.`
    }
  }

  return (
    <Card
      leftBorderColor={status.color}
      className="cursor-pointer active:scale-[0.99] transition-transform duration-100"
      onClick={onClick}
    >
      {/* Строка 1: Имя + бейдж статуса */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {fullName || 'Без имени'}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Текст дней */}
          {daysText && (
            <span
              className="text-xs font-medium"
              style={{ color: status.color }}
            >
              {daysText}
            </span>
          )}

          {/* Бейдж статуса */}
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: status.color,
              color: '#FFFFFF',
            }}
          >
            {isFrozen && <Snowflake size={10} />}
            {status.label}
          </span>
        </div>
      </div>

      {/* Строка 2: дата · сумма · до · длительность */}
      <div
        className="flex items-center gap-1 mt-1 text-xs flex-wrap"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>{formatDate(client.currentPayment.date)}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{amountFormatted} ₽</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>до {expirationFormatted}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{durationText}</span>
      </div>

      {/* Строка 3: заметки (если есть) */}
      {client.notes && (
        <div
          className="flex items-center gap-1 mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <FileText size={11} className="shrink-0 opacity-50" />
          <p className="text-xs italic truncate opacity-70">
            {client.notes}
          </p>
        </div>
      )}
    </Card>
  )
}
