// Шапка приложения — цветной блок с заголовком, кнопками и плавным переходом к контенту

import type { ReactNode } from 'react'

interface AppHeaderProps {
  title: string
  subtitle?: string
  leftAction?: ReactNode   // Кнопка слева (например «Назад»)
  rightActions?: ReactNode  // Кнопки справа (например «+» и меню)
  children?: ReactNode      // Доп. контент под заголовком (поиск, баннер)
}

export default function AppHeader({
  title,
  subtitle,
  leftAction,
  rightActions,
  children,
}: AppHeaderProps) {
  return (
    <div className="relative shrink-0">
      {/* Цветной блок шапки */}
      <div
        className="px-4 pt-3 pb-5"
        style={{ backgroundColor: 'var(--color-header-bg)' }}
      >
        {/* Верхняя строка: кнопка слева, заголовок по центру, кнопки справа */}
        <div className="flex items-center justify-between min-h-10">
          {/* Левая кнопка */}
          <div className="w-10 flex justify-start">
            {leftAction ?? <span />}
          </div>

          {/* Заголовок */}
          <div className="flex-1 text-center">
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: 'var(--color-header-text)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-xs mt-0.5 opacity-70"
                style={{ color: 'var(--color-header-text)' }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Правые кнопки */}
          <div className="flex items-center gap-1 justify-end">
            {rightActions ?? <span className="w-10" />}
          </div>
        </div>

        {/* Дополнительный контент (поиск, баннер) */}
        {children && <div className="mt-3">{children}</div>}
      </div>

      {/* Плавный переход (кривая) от шапки к фону страницы */}
      <div
        className="h-4 -mt-px"
        style={{
          background: 'var(--color-header-bg)',
          borderRadius: '0 0 16px 16px',
        }}
      />
    </div>
  )
}
