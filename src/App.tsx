// Главный компонент приложения — авторизация + простая навигация между экранами
// Временная навигация через useState (будет заменена на React Router на шаге 20)

import { useState, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage from './routes/LoginPage'
import MainPage from './routes/MainPage'
import AddClientPage from './routes/AddClientPage'
import { Loader2 } from 'lucide-react'

// Типы экранов приложения
type Screen =
  | { name: 'main' }
  | { name: 'addClient' }

function App() {
  const { user, loading } = useAuth()

  // Текущий экран
  const [screen, setScreen] = useState<Screen>({ name: 'main' })

  // Счётчик для принудительного обновления MainPage после изменений
  const [refreshKey, setRefreshKey] = useState(0)

  // Навигация
  const goToMain = useCallback(() => {
    setScreen({ name: 'main' })
  }, [])

  const goToAddClient = useCallback(() => {
    setScreen({ name: 'addClient' })
  }, [])

  // Клиент создан — вернуться на главную и обновить список
  const handleClientCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
    setScreen({ name: 'main' })
  }, [])

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

  // Роутинг по экранам
  switch (screen.name) {
    case 'addClient':
      return (
        <AddClientPage
          onBack={goToMain}
          onCreated={handleClientCreated}
        />
      )

    case 'main':
    default:
      return (
        <MainPage
          key={refreshKey}
          onNavigateToAddClient={goToAddClient}
        />
      )
  }
}

export default App
