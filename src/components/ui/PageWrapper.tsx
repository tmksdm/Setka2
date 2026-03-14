// Обёртка страницы — задаёт фон и полную высоту экрана

import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div
      className={`min-h-screen flex flex-col ${className}`}
      style={{ backgroundColor: 'var(--color-screen-bg)' }}
    >
      {children}
    </div>
  )
}
