// Главный компонент приложения — роутинг и проверка авторизации

import { useAuth } from './context/AuthContext'
import LoginPage from './routes/LoginPage'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()

  // Экран загрузки (пока Firebase проверяет, вошёл ли пользователь)
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--color-screen-bg)' }}
      >
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: 'var(--color-text-secondary)' }}
        />
      </div>
    )
  }

  // Не вошёл — показываем страницу входа
  if (!user) {
    return <LoginPage />
  }

  // Вошёл — показываем приложение (пока заглушка)
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-screen-bg)' }}
    >
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Сетка
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Привет, {user.displayName || user.email}!
      </p>
      <p
        className="text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Главный экран будет здесь
      </p>
    </div>
  )
}

export default App
