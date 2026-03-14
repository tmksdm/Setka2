// Строка поиска — используется в шапке главного экрана и архива

import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Поиск по имени...',
}: SearchBarProps) {
  return (
    <div className="relative">
      {/* Иконка лупы слева */}
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-header-text)', opacity: 0.5 }}
      />

      {/* Поле ввода */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg outline-none placeholder:opacity-50"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: 'var(--color-header-text)',
        }}
      />

      {/* Кнопка очистки (крестик) — видна только когда есть текст */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer"
          style={{ color: 'var(--color-header-text)', opacity: 0.6 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
