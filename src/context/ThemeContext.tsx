// Контекст темы — переключение светлой/тёмной, сохранение в localStorage

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'setka_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Начальное значение берём из <html> класса (его ставит скрипт в index.html)
  const [theme, setTheme] = useState<Theme>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  // При смене темы — обновляем класс на <html> и сохраняем в localStorage
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Хук для использования темы в любом компоненте
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider')
  }
  return ctx
}
