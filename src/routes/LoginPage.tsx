// Страница входа — показывается, если пользователь не авторизован

import { useAuth } from '../context/AuthContext'
import { LogIn, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login, error, loading } = useAuth()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-screen-bg)' }}
    >
      {/* Логотип / название */}
      <div className="mb-8 text-center">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--color-header-bg)' }}
        >
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--color-header-text)' }}
          >
            С
          </span>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Сетка
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Управление абонементами
        </p>
      </div>

      {/* Ошибка */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-md text-sm text-center max-w-xs w-full"
          style={{
            backgroundColor: 'rgba(176, 90, 90, 0.1)',
            color: 'var(--color-status-overdue)',
            border: '1px solid rgba(176, 90, 90, 0.2)'
          }}
        >
          {error}
        </div>
      )}

      {/* Кнопка входа */}
      <button
        onClick={login}
        disabled={loading}
        className="flex items-center gap-3 px-6 py-3 rounded-md text-sm font-medium transition-opacity active:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-header-bg)',
          color: 'var(--color-header-text)',
        }}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <LogIn size={20} />
        )}
        {loading ? 'Входим...' : 'Войти через Google'}
      </button>
    </div>
  )
}
