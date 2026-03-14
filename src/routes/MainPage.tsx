// Главный экран — список клиентов с поиском, фильтром срочности и меню

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  EllipsisVertical,
  RefreshCw,
  ClipboardList,
  Frown,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/ui/PageWrapper'
import AppHeader from '../components/ui/AppHeader'
import Button from '../components/ui/Button'
import ClientCard from '../components/ClientCard'
import SearchBar from '../components/SearchBar'
import UrgencyBanner from '../components/UrgencyBanner'
import DropdownMenu from '../components/DropdownMenu'
import { fetchClients, autoUnfreezeIfExpired } from '../lib/firestoreHelpers'
import {
  sortClientsByUrgency,
  countUrgentClients,
  filterUrgentClients,
} from '../lib/clientStatus'
import { pluralizeClients } from '../lib/dateHelpers'
import type { Client } from '../types'

interface MainPageProps {
  onNavigateToAddClient: () => void
}

export default function MainPage({ onNavigateToAddClient }: MainPageProps) {
  const { user, logout } = useAuth()

  // Состояния
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Загрузка клиентов из Firestore
  const loadClients = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const allClients = await fetchClients(user.uid)

      // Авто-разморозка: проверяем каждого замороженного клиента
      let needsReload = false
      for (const client of allClients) {
        if (client.freeze) {
          const wasUnfrozen = await autoUnfreezeIfExpired(user.uid, client)
          if (wasUnfrozen) needsReload = true
        }
      }

      // Если кого-то разморозили — перезагружаем свежие данные
      if (needsReload) {
        const freshClients = await fetchClients(user.uid)
        setClients(freshClients)
      } else {
        setClients(allClients)
      }
    } catch (err) {
      console.error('Ошибка загрузки клиентов:', err)
      setError('Не удалось загрузить клиентов. Проверьте интернет.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Загрузка при монтировании
  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Фильтрация: только активные (не архивные)
  const activeClients = clients.filter((c) => !c.archived)

  // Количество «горящих» для баннера
  const urgentCount = countUrgentClients(activeClients)

  // Применяем фильтр срочности
  const filteredByUrgency = urgencyFilter
    ? filterUrgentClients(activeClients)
    : activeClients

  // Применяем поиск по имени
  const filteredBySearch = search.trim()
    ? filteredByUrgency.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
        return fullName.includes(search.trim().toLowerCase())
      })
    : filteredByUrgency

  // Сортируем по срочности
  const sortedClients = sortClientsByUrgency(filteredBySearch)

  // Подзаголовок в шапке: «12 клиентов»
  const subtitle = `${pluralizeClients(activeClients.length)}`

  // Навигация (пока заглушки — страницы ещё не созданы)
  const handleNavigate = (page: 'statistics' | 'tariffs' | 'archive' | 'backup') => {
    // TODO: навигация через React Router (добавим на следующих шагах)
    console.log('Навигация:', page)
  }

  // Нажатие на карточку клиента (пока заглушка)
  const handleClientClick = (client: Client) => {
    // TODO: навигация на EditClientPage (шаг 10)
    console.log('Открыть клиента:', client.id)
  }

  return (
    <PageWrapper>
      {/* Шапка */}
      <AppHeader
        title="Сетка"
        subtitle={loading ? 'Загрузка...' : subtitle}
        rightActions={
          <div className="flex items-center gap-1">
            {/* Кнопка «+» — добавить клиента */}
            <button
              type="button"
              onClick={onNavigateToAddClient}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-opacity"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'var(--color-header-text)',
              }}
            >
              <Plus size={20} />
            </button>

            {/* Кнопка меню «⋮» — обёртка relative для позиционирования меню */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-opacity"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'var(--color-header-text)',
                }}
              >
                <EllipsisVertical size={20} />
              </button>

              {/* Выпадающее меню — позиционируется от кнопки */}
              <DropdownMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                onNavigate={handleNavigate}
                onLogout={logout}
              />
            </div>
          </div>
        }
      >
        {/* Поиск + баннер срочности (внутри шапки) */}
        <div className="flex flex-col gap-2">
          <SearchBar value={search} onChange={setSearch} />
          <UrgencyBanner
            count={urgentCount}
            isFilterActive={urgencyFilter}
            onToggle={() => setUrgencyFilter(!urgencyFilter)}
          />
        </div>
      </AppHeader>

      {/* Контент — список клиентов */}
      <div className="flex-1 px-3 pt-2 pb-6">
        {/* Состояние загрузки */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw
              size={28}
              className="animate-spin mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Загрузка клиентов...
            </p>
          </div>
        )}

        {/* Состояние ошибки */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <Frown
              size={36}
              className="mb-3"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}
            />
            <p
              className="text-sm text-center mb-4 px-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={loadClients}>
              Попробовать снова
            </Button>
          </div>
        )}

        {/* Пустое состояние — нет клиентов вообще */}
        {!loading && !error && activeClients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList
              size={36}
              className="mb-3"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }}
            />
            <p
              className="text-sm text-center mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Клиентов пока нет
            </p>
            <p
              className="text-xs text-center mb-4"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
            >
              Нажмите «+» чтобы добавить первого
            </p>
          </div>
        )}

        {/* Пустое состояние — поиск не дал результатов */}
        {!loading && !error && activeClients.length > 0 && sortedClients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList
              size={36}
              className="mb-3"
              style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }}
            />
            <p
              className="text-sm text-center"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Ничего не найдено
            </p>
          </div>
        )}

        {/* Если фильтр срочности включён и горящих нет — «всё хорошо» */}
        {!loading && !error && urgencyFilter && urgentCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCircle
              size={36}
              className="mb-3"
              style={{ color: 'var(--color-status-good)', opacity: 0.6 }}
            />
            <p
              className="text-sm text-center"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Все абонементы в порядке!
            </p>
          </div>
        )}

        {/* Список карточек */}
        {!loading && !error && sortedClients.length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => handleClientClick(client)}
              />
            ))}
          </div>
        )}

        {/* Кнопка «Обновить» внизу списка */}
        {!loading && !error && activeClients.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={loadClients}
            >
              Обновить
            </Button>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
