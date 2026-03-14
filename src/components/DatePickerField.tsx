// Поле выбора даты — нативный input type="date" с русским отображением
// Показывает дату в формате "15.03.2026", но хранит "2026-03-15"

import { Calendar } from 'lucide-react'
import { formatDate } from '../lib/dateHelpers'
import { useRef } from 'react'

interface DatePickerFieldProps {
  label: string
  value: string        // "YYYY-MM-DD"
  onChange: (value: string) => void
  error?: string
  min?: string         // Минимальная дата "YYYY-MM-DD"
  max?: string         // Максимальная дата "YYYY-MM-DD"
}

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
  min,
  max,
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Открываем нативный пикер при клике на любую часть поля
  const handleWrapperClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker?.()
      inputRef.current.focus()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Метка */}
      <label
        className="text-xs font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>

      {/* Обёртка поля — кликабельная */}
      <div
        onClick={handleWrapperClick}
        className="relative flex items-center rounded-md px-3 py-2 cursor-pointer"
        style={{
          backgroundColor: 'var(--color-input-bg)',
          border: error
            ? '1px solid var(--color-status-overdue)'
            : '1px solid var(--color-input-border)',
        }}
      >
        {/* Иконка календаря */}
        <Calendar
          size={16}
          className="shrink-0 mr-2"
          style={{ color: 'var(--color-text-secondary)' }}
        />

        {/* Отображаемая дата (русский формат) */}
        <span
          className="text-sm flex-1"
          style={{
            color: value
              ? 'var(--color-text-primary)'
              : 'var(--color-text-secondary)',
          }}
        >
          {value ? formatDate(value) : 'Выберите дату'}
        </span>

        {/* Скрытый нативный input для пикера */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Ошибка */}
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-status-overdue)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
