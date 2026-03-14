// Баннер срочности — показывает количество «горящих» клиентов
// Кликабельный: нажатие включает/выключает фильтр по срочным

import { AlertTriangle, X } from 'lucide-react'
import { pluralizeClients } from '../lib/dateHelpers'

interface UrgencyBannerProps {
  count: number         // Количество горящих клиентов (overdue + urgent)
  isFilterActive: boolean  // Включён ли фильтр сейчас
  onToggle: () => void     // Нажатие — включить/выключить фильтр
}

export default function UrgencyBanner({
  count,
  isFilterActive,
  onToggle,
}: UrgencyBannerProps) {
  // Если горящих нет — не показываем баннер
  if (count === 0) return null

  // Текст: «3 клиента требуют внимания»
  const requireWord = count === 1 ? 'требует' : 'требуют'
  const text = `${pluralizeClients(count)} ${requireWord} внимания`

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-opacity duration-150 active:opacity-80"
      style={{
        backgroundColor: isFilterActive
          ? 'rgba(255, 255, 255, 0.25)'
          : 'rgba(255, 255, 255, 0.12)',
      }}
    >
      <AlertTriangle
        size={15}
        className="shrink-0"
        style={{ color: 'var(--color-status-urgent)' }}
      />

      <span
        className="text-xs font-medium flex-1 text-left"
        style={{ color: 'var(--color-header-text)' }}
      >
        {text}
      </span>

      {/* Если фильтр активен — показываем крестик (снять фильтр) */}
      {isFilterActive && (
        <X
          size={14}
          className="shrink-0 opacity-60"
          style={{ color: 'var(--color-header-text)' }}
        />
      )}
    </button>
  )
}
