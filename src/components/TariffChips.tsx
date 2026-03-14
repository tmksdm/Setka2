// Горизонтальные чипы тарифов — выбор тарифа автозаполняет сумму и длительность
// Прокручиваемая полоска, скрытый скроллбар

import { Lightbulb } from 'lucide-react'
import type { Tariff } from '../types'

interface TariffChipsProps {
  tariffs: Tariff[]
  selectedId: string | null  // ID выбранного тарифа (null = не выбран)
  onSelect: (tariff: Tariff) => void
  loading?: boolean
}

export default function TariffChips({
  tariffs,
  selectedId,
  onSelect,
  loading = false,
}: TariffChipsProps) {
  // Загрузка
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div
          className="h-8 w-20 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-input-bg)' }}
        />
        <div
          className="h-8 w-24 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-input-bg)' }}
        />
        <div
          className="h-8 w-16 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-input-bg)' }}
        />
      </div>
    )
  }

  // Тарифов нет
  if (tariffs.length === 0) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <Lightbulb
          size={14}
          style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}
        />
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
        >
          Тарифы не настроены — введите сумму и дни вручную
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
      {tariffs.map((tariff) => {
        const isSelected = selectedId === tariff.id

        return (
          <button
            key={tariff.id}
            type="button"
            onClick={() => onSelect(tariff)}
            className={`
              shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-150 cursor-pointer
              active:scale-95
            `}
            style={{
              backgroundColor: isSelected
                ? 'var(--color-primary)'
                : 'var(--color-input-bg)',
              color: isSelected
                ? '#FFFFFF'
                : 'var(--color-text-primary)',
              border: isSelected
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-input-border)',
            }}
          >
            {tariff.name} · {tariff.amount}₽
          </button>
        )
      })}
    </div>
  )
}
