// Универсальная карточка — белый блок с тенью (или рамкой в тёмной теме)
// Опциональная цветная полоска слева для статуса клиента

import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  leftBorderColor?: string  // CSS-значение цвета, например 'var(--color-status-overdue)'
  noPadding?: boolean       // Убрать внутренние отступы
  className?: string
}

export default function Card({
  children,
  leftBorderColor,
  noPadding = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${noPadding ? '' : 'p-3'} ${className}`}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        boxShadow: '0 1px 4px var(--color-shadow)',
        borderLeft: leftBorderColor
          ? `3px solid ${leftBorderColor}`
          : '1px solid var(--color-card-border)',
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
