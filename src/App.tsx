// Главный компонент приложения — проверка авторизации и показ нужного экрана

import { useAuth } from './context/AuthContext'
import LoginPage from './routes/LoginPage'
import MainPage from './routes/MainPage'
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

  // Вошёл — показываем главный экран
  return <MainPage />
}

export default App
