// Страница редактирования клиента — статусный баннер, форма, удаление, продление
// Загружает клиента из Firestore по ID, позволяет редактировать все поля

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CreditCard,
  Snowflake,
  Archive,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/ui/PageWrapper'
import AppHeader from '../components/ui/AppHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import DatePickerField from '../components/DatePickerField'
import TariffChips from '../components/TariffChips'
import {
  fetchClient,
  fetchTariffs,
  updateClient,
  deleteClient,
  archiveClient,
} from '../lib/firestoreHelpers'
import {
  calculateExpirationDate,
  formatDate,
  isValidDateString,
  pluralizeDays,
} from '../lib/dateHelpers'
import { getClientStatus } from '../lib/clientStatus'
import type { Client, Tariff } from '../types'

// === Типы ===

interface EditClientPageProps {
  clientId: string
  onBack: () => void
  onDeleted: () => void    // Клиент удалён — вернуться и обновить список
  onUpdated: () => void    // Клиент обновлён — вернуться и обновить список
  onRenew: (clientId: string) => void  // Переход к продлению (шаг 11)
  onHistory: (clientId: string) => void // Переход к истории (шаг 12)
  onFreeze: (clientId: string) => void  // Переход к заморозке (шаг 14)
}

interface FormData {
  firstName: string
  lastName: string
  phone: string
  notes: string
  amount: string
  durationDays: string
  paymentDate: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  amount?: string
  durationDays?: string
  paymentDate?: string
}

// Пресеты длительности
const DURATION_PRESETS = [7, 14, 30, 90]

export default function EditClientPage({
  clientId,
  onBack,
  onDeleted,
  onUpdated,
  onRenew,
  onHistory,
  onFreeze,
}: EditClientPageProps) {
  const { user } = useAuth()

  // Клиент из базы
  const [client, setClient] = useState<Client | null>(null)
  const [loadingClient, setLoadingClient] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Тарифы
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [tariffsLoading, setTariffsLoading] = useState(true)
  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null)

  // Данные формы
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    notes: '',
    amount: '',
    durationDays: '',
    paymentDate: '',
  })

  // Ошибки валидации
  const [errors, setErrors] = useState<FormErrors>({})

  // Состояния кнопок
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  // Отслеживаем, менял ли пользователь что-то в форме
  const [hasChanges, setHasChanges] = useState(false)

  // Загрузка клиента и тарифов
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      setLoadingClient(true)
      setLoadError(null)

      try {
        const [clientData, tariffsData] = await Promise.all([
          fetchClient(user.uid, clientId),
          fetchTariffs(user.uid),
        ])

        if (cancelled) return

        if (!clientData) {
          setLoadError('Клиент не найден')
          setLoadingClient(false)
          return
        }

        setClient(clientData)
        setTariffs(tariffsData)
        setTariffsLoading(false)

        // Заполняем форму данными клиента
        setForm({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          phone: clientData.phone,
          notes: clientData.notes,
          amount: String(clientData.currentPayment.amount),
          durationDays: String(clientData.currentPayment.durationDays),
          paymentDate: clientData.currentPayment.date,
        })
        setSelectedTariffId(clientData.tariffId ?? null)
      } catch (err) {
        console.error('Ошибка загрузки клиента:', err)
        if (!cancelled) {
          setLoadError('Не удалось загрузить данные. Проверьте интернет.')
        }
      } finally {
        if (!cancelled) setLoadingClient(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user, clientId])

  // Обновление поля формы
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaveError(null)
    setHasChanges(true)
  }, [])

  // Выбор тарифа
  const handleTariffSelect = useCallback((tariff: Tariff) => {
    if (selectedTariffId === tariff.id) {
      setSelectedTariffId(null)
      return
    }
    setSelectedTariffId(tariff.id)
    setForm((prev) => ({
      ...prev,
      amount: String(tariff.amount),
      durationDays: String(tariff.durationDays),
    }))
    setErrors((prev) => ({
      ...prev,
      amount: undefined,
      durationDays: undefined,
    }))
    setSaveError(null)
    setHasChanges(true)
  }, [selectedTariffId])

  // Ручной ввод суммы → сбрасываем тариф
  const handleManualAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    updateField('amount', cleaned)
    setSelectedTariffId(null)
  }

  const handleManualDurationChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    updateField('durationDays', cleaned)
    setSelectedTariffId(null)
  }

  // Пресет длительности
  const handleDurationPreset = (days: number) => {
    updateField('durationDays', String(days))
    setSelectedTariffId(null)
  }

  // Рассчитанная дата окончания
  const expirationDate =
    form.paymentDate &&
    form.durationDays &&
    isValidDateString(form.paymentDate) &&
    parseInt(form.durationDays, 10) > 0
      ? calculateExpirationDate(form.paymentDate, parseInt(form.durationDays, 10))
      : null

  // Валидация
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.firstName.trim()) {
      newErrors.firstName = 'Введите имя'
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию'
    }
    const amount = parseInt(form.amount, 10)
    if (!form.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Введите сумму'
    }
    const duration = parseInt(form.durationDays, 10)
    if (!form.durationDays || isNaN(duration) || duration <= 0) {
      newErrors.durationDays = 'Введите дни'
    } else if (duration > 365) {
      newErrors.durationDays = 'Максимум 365 дней'
    }
    if (!form.paymentDate || !isValidDateString(form.paymentDate)) {
      newErrors.paymentDate = 'Выберите дату'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Сохранение изменений
  const handleSave = async () => {
    if (!validate()) return
    if (!user || !client) return
    if (!expirationDate) return

    setSaving(true)
    setSaveError(null)

    try {
      await updateClient(user.uid, client.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        currentPayment: {
          date: form.paymentDate,
          amount: parseInt(form.amount, 10),
          durationDays: parseInt(form.durationDays, 10),
        },
        expirationDate,
        ...(selectedTariffId !== undefined ? { tariffId: selectedTariffId ?? undefined } : {}),
      })

      onUpdated()
    } catch (err) {
      console.error('Ошибка сохранения:', err)
      setSaveError('Не удалось сохранить. Проверьте интернет.')
    } finally {
      setSaving(false)
    }
  }

  // Удаление клиента
  const handleDelete = async () => {
    if (!user || !client) return

    setDeleting(true)
    try {
      await deleteClient(user.uid, client.id)
      onDeleted()
    } catch (err) {
      console.error('Ошибка удаления:', err)
      setSaveError('Не удалось удалить клиента.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  // Архивирование клиента
  const handleArchive = async () => {
    if (!user || !client) return

    setArchiving(true)
    try {
      await archiveClient(user.uid, client.id)
      onDeleted() // Используем тот же callback — клиент пропадёт из списка
    } catch (err) {
      console.error('Ошибка архивации:', err)
      setSaveError('Не удалось архивировать клиента.')
      setShowArchiveConfirm(false)
    } finally {
      setArchiving(false)
    }
  }

  // Статус клиента (для баннера)
  const status = client
    ? getClientStatus(client.expirationDate, client.freeze, client.archived)
    : null

  // Заморожен?
  const isFrozen = status?.status === 'frozen'

  // === Экран загрузки ===
  if (loadingClient) {
    return (
      <PageWrapper>
        <AppHeader
          title="Загрузка..."
          leftAction={
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-opacity"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'var(--color-header-text)',
              }}
            >
              <ArrowLeft size={20} />
            </button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor: 'var(--color-input-border)',
              borderTopColor: 'var(--color-primary)',
            }}
          />
        </div>
      </PageWrapper>
    )
  }

  // === Ошибка загрузки ===
  if (loadError || !client) {
    return (
      <PageWrapper>
        <AppHeader
          title="Ошибка"
          leftAction={
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-opacity"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'var(--color-header-text)',
              }}
            >
              <ArrowLeft size={20} />
            </button>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <AlertCircle
            size={36}
            className="mb-3"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}
          />
          <p
            className="text-sm text-center mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {loadError || 'Клиент не найден'}
          </p>
          <Button variant="outline" size="sm" onClick={onBack}>
            Назад
          </Button>
        </div>
      </PageWrapper>
    )
  }

  // Полное имя для заголовка
  const fullName = `${client.firstName} ${client.lastName}`.trim() || 'Без имени'

  return (
    <PageWrapper>
      {/* Шапка */}
      <AppHeader
        title={fullName}
        subtitle={status ? status.label : undefined}
        leftAction={
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'var(--color-header-text)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
        }
      />

      {/* Контент */}
      <div className="flex-1 px-3 pt-2 pb-6">
        <div className="flex flex-col gap-3">

          {/* === Статусный баннер === */}
          {status && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{
                backgroundColor: status.color,
                opacity: 0.92,
              }}
            >
              {/* Иконка статуса */}
              <div className="shrink-0">
                {isFrozen ? (
                  <Snowflake size={20} style={{ color: '#FFFFFF' }} />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#FFFFFF', opacity: 0.8 }}
                  />
                )}
              </div>

              {/* Текст */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  {status.label}
                  {!isFrozen && status.daysRemaining !== undefined && (
                    <span className="font-normal ml-1.5 opacity-80">
                      {status.daysRemaining < 0
                        ? `(${pluralizeDays(Math.abs(status.daysRemaining))} назад)`
                        : status.daysRemaining === 0
                          ? '(истекает сегодня)'
                          : `(${pluralizeDays(status.daysRemaining)} ост.)`
                      }
                    </span>
                  )}
                </p>

                {/* Дата окончания */}
                <p className="text-xs mt-0.5 opacity-80" style={{ color: '#FFFFFF' }}>
                  Абонемент до {formatDate(client.expirationDate)}
                </p>

                {/* Информация о заморозке */}
                {isFrozen && client.freeze && (
                  <p className="text-xs mt-0.5 opacity-80" style={{ color: '#FFFFFF' }}>
                    Заморозка до {formatDate(client.freeze.endDate)} ({pluralizeDays(client.freeze.days)})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === Кнопки действий === */}
          <div className="flex gap-2">
            {/* Продлить */}
            <Button
              variant="success"
              size="sm"
              icon={<CreditCard size={14} />}
              className="flex-1"
              onClick={() => onRenew(client.id)}
              disabled={isFrozen}
            >
              Продлить
            </Button>

            {/* Заморозить / Разморозить */}
            <Button
              variant="outline"
              size="sm"
              icon={<Snowflake size={14} />}
              className="flex-1"
              onClick={() => onFreeze(client.id)}
            >
              {isFrozen ? 'Разморозить' : 'Заморозить'}
            </Button>

            {/* История */}
            <Button
              variant="ghost"
              size="sm"
              icon={<CreditCard size={14} />}
              onClick={() => onHistory(client.id)}
              style={{ minWidth: 'auto', paddingLeft: 8, paddingRight: 8 }}
            >
              История
            </Button>
          </div>

          {/* Предупреждение: продление заблокировано при заморозке */}
          {isFrozen && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-status-frozen)',
                opacity: 0.15,
              }}
            >
              <AlertCircle size={14} className="shrink-0" style={{ color: 'var(--color-status-frozen)', opacity: 1 }} />
              <p className="text-xs" style={{ color: 'var(--color-status-frozen)', opacity: 1 }}>
                Продление заблокировано на время заморозки
              </p>
            </div>
          )}

          {/* === Имя и Фамилия === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Имя *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Иван"
                  autoCapitalize="words"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: errors.firstName
                      ? '1px solid var(--color-status-overdue)'
                      : '1px solid var(--color-input-border)',
                  }}
                />
                {errors.firstName && (
                  <p className="text-xs" style={{ color: 'var(--color-status-overdue)' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Фамилия *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Петров"
                  autoCapitalize="words"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: errors.lastName
                      ? '1px solid var(--color-status-overdue)'
                      : '1px solid var(--color-input-border)',
                  }}
                />
                {errors.lastName && (
                  <p className="text-xs" style={{ color: 'var(--color-status-overdue)' }}>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* === Телефон и Заметки === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Телефон
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-input-border)',
                  }}
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Заметка
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Шкафчик №12"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-input-border)',
                  }}
                />
              </div>
            </div>
          </Card>

          {/* === Тарифы === */}
          <Card>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Тариф
              </label>
              <TariffChips
                tariffs={tariffs}
                selectedId={selectedTariffId}
                onSelect={handleTariffSelect}
                loading={tariffsLoading}
              />
            </div>
          </Card>

          {/* === Сумма и Длительность === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Сумма (₽) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(e) => handleManualAmountChange(e.target.value)}
                  placeholder="3000"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: errors.amount
                      ? '1px solid var(--color-status-overdue)'
                      : '1px solid var(--color-input-border)',
                  }}
                />
                {errors.amount && (
                  <p className="text-xs" style={{ color: 'var(--color-status-overdue)' }}>
                    {errors.amount}
                  </p>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Дни *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.durationDays}
                  onChange={(e) => handleManualDurationChange(e.target.value)}
                  placeholder="30"
                  className="text-sm rounded-md px-3 py-2 outline-none min-w-0 w-full"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text-primary)',
                    border: errors.durationDays
                      ? '1px solid var(--color-status-overdue)'
                      : '1px solid var(--color-input-border)',
                  }}
                />
                {errors.durationDays && (
                  <p className="text-xs" style={{ color: 'var(--color-status-overdue)' }}>
                    {errors.durationDays}
                  </p>
                )}
              </div>
            </div>

            {/* Пресеты */}
            <div className="flex gap-2 mt-2">
              {DURATION_PRESETS.map((days) => {
                const isActive = form.durationDays === String(days)
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleDurationPreset(days)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer active:scale-95 transition-all"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-primary)'
                        : 'var(--color-input-bg)',
                      color: isActive
                        ? '#FFFFFF'
                        : 'var(--color-text-secondary)',
                      border: isActive
                        ? '1px solid var(--color-primary)'
                        : '1px solid var(--color-input-border)',
                    }}
                  >
                    {days} дн.
                  </button>
                )
              })}
            </div>
          </Card>

          {/* === Дата оплаты + расчёт === */}
          <Card>
            <div className="flex flex-col gap-3">
              <DatePickerField
                label="Дата оплаты *"
                value={form.paymentDate}
                onChange={(val) => updateField('paymentDate', val)}
                error={errors.paymentDate}
              />

              {expirationDate && (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    border: '1px solid var(--color-input-border)',
                  }}
                >
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Абонемент до
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {formatDate(expirationDate)}
                    <span
                      className="ml-1.5 text-xs font-normal"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      ({pluralizeDays(parseInt(form.durationDays, 10))})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* === Ошибка сохранения === */}
          {saveError && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-status-overdue)',
                opacity: 0.9,
              }}
            >
              <AlertCircle size={16} className="shrink-0" style={{ color: '#FFFFFF' }} />
              <p className="text-xs" style={{ color: '#FFFFFF' }}>
                {saveError}
              </p>
            </div>
          )}

          {/* === Кнопка «Сохранить» === */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<Save size={18} />}
            loading={saving}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Сохранить изменения
          </Button>

          {/* === Архивировать и Удалить === */}
          <div className="flex gap-2 mt-1">
            {/* Архивировать */}
            {!showArchiveConfirm ? (
              <Button
                variant="outline"
                size="sm"
                icon={<Archive size={14} />}
                className="flex-1"
                onClick={() => setShowArchiveConfirm(true)}
              >
                В архив
              </Button>
            ) : (
              <div
                className="flex-1 flex flex-col gap-2 p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-input-bg)',
                  border: '1px solid var(--color-input-border)',
                }}
              >
                <p
                  className="text-xs text-center"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Архивировать клиента?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowArchiveConfirm(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    loading={archiving}
                    onClick={handleArchive}
                  >
                    Да
                  </Button>
                </div>
              </div>
            )}

            {/* Удалить */}
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Удалить
              </Button>
            ) : (
              <div
                className="flex-1 flex flex-col gap-2 p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-input-bg)',
                  border: '1px solid var(--color-status-overdue)',
                }}
              >
                <p
                  className="text-xs text-center"
                  style={{ color: 'var(--color-status-overdue)' }}
                >
                  Удалить навсегда?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    loading={deleting}
                    onClick={handleDelete}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}
