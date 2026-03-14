// Выпадающее меню — тема, навигация, выход

import { useEffect, useRef } from 'react'
import {
  Moon,
  Sun,
  BarChart3,
  Settings,
  Archive,
  Save,
  LogOut,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface MenuItem {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}

interface DropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: 'statistics' | 'tariffs' | 'archive' | 'backup') => void
  onLogout: () => void
}

export default function DropdownMenu({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}: DropdownMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрытие при клике за пределами меню
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Небольшая задержка, чтобы клик по кнопке открытия не закрыл сразу
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Пункты меню
  const items: MenuItem[] = [
    {
      icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />,
      label: theme === 'dark' ? 'Светлая тема' : 'Тёмная тема',
      onClick: () => {
        toggleTheme()
        onClose()
      },
    },
    {
      icon: <BarChart3 size={18} />,
      label: 'Статистика',
      onClick: () => {
        onNavigate('statistics')
        onClose()
      },
    },
    {
      icon: <Settings size={18} />,
      label: 'Тарифы',
      onClick: () => {
        onNavigate('tariffs')
        onClose()
      },
    },
    {
      icon: <Archive size={18} />,
      label: 'Архив клиентов',
      onClick: () => {
        onNavigate('archive')
        onClose()
      },
    },
    {
      icon: <Save size={18} />,
      label: 'Резервная копия',
      onClick: () => {
        onNavigate('backup')
        onClose()
      },
    },
    {
      icon: <LogOut size={18} />,
      label: 'Выйти',
      onClick: () => {
        onLogout()
        onClose()
      },
      danger: true,
    },
  ]

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 z-50 min-w-48 py-1 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {/* Разделитель перед «Выйти» */}
          {item.danger && (
            <div
              className="mx-3 my-1"
              style={{
                height: '1px',
                backgroundColor: 'var(--color-divider)',
              }}
            />
          )}

          <button
            type="button"
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-opacity duration-100 active:opacity-70"
            style={{
              color: item.danger
                ? 'var(--color-status-overdue)'
                : 'var(--color-text-primary)',
            }}
          >
            <span
              className="shrink-0"
              style={{
                color: item.danger
                  ? 'var(--color-status-overdue)'
                  : 'var(--color-text-secondary)',
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
