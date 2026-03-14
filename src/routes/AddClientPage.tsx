// Страница добавления клиента — компактная форма с валидацией и тарифными чипами

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageWrapper from '../components/ui/PageWrapper'
import AppHeader from '../components/ui/AppHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import DatePickerField from '../components/DatePickerField'
import TariffChips from '../components/TariffChips'
import { fetchTariffs, createClient } from '../lib/firestoreHelpers'
import {
  getTodayString,
  calculateExpirationDate,
  formatDate,
  isValidDateString,
  pluralizeDays,
} from '../lib/dateHelpers'
import type { Tariff } from '../types'

// === Типы ===

interface AddClientPageProps {
  onBack: () => void      // Вернуться на главный экран
  onCreated: () => void   // Клиент создан — обновить список и вернуться
}

interface FormData {
  firstName: string
  lastName: string
  phone: string
  notes: string
  amount: string       // Строка — чтобы пользователь мог вводить свободно
  durationDays: string // Строка — аналогично
  paymentDate: string  // "YYYY-MM-DD"
}

interface FormErrors {
  firstName?: string
  lastName?: string
  amount?: string
  durationDays?: string
  paymentDate?: string
}

// Пресеты длительности (быстрый выбор)
const DURATION_PRESETS = [7, 14, 30, 90]

export default function AddClientPage({ onBack, onCreated }: AddClientPageProps) {
  const { user } = useAuth()

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
    paymentDate: getTodayString(),
  })

  // Ошибки валидации
  const [errors, setErrors] = useState<FormErrors>({})

  // Состояние сохранения
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Загрузка тарифов при монтировании
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadTariffs = async () => {
      try {
        const data = await fetchTariffs(user.uid)
        if (!cancelled) setTariffs(data)
      } catch (err) {
        console.error('Ошибка загрузки тарифов:', err)
      } finally {
        if (!cancelled) setTariffsLoading(false)
      }
    }

    loadTariffs()
    return () => { cancelled = true }
  }, [user])

  // Обновление поля формы
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Убираем ошибку при вводе
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaveError(null)
  }, [])

  // Выбор тарифа — автозаполнение суммы и длительности
  const handleTariffSelect = useCallback((tariff: Tariff) => {
    // Если кликнули на уже выбранный — снимаем выбор
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
  }, [selectedTariffId])

  // Ручной ввод суммы или длительности → сбрасываем выбранный тариф
  const handleManualAmountChange = (value: string) => {
    // Разрешаем только цифры
    const cleaned = value.replace(/[^0-9]/g, '')
    updateField('amount', cleaned)
    setSelectedTariffId(null)
  }

  const handleManualDurationChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    updateField('durationDays', cleaned)
    setSelectedTariffId(null)
  }

  // Выбор пресета длительности
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

  // Валидация формы
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

  // Сохранение клиента
  const handleSave = async () => {
    if (!validate()) return
    if (!user) return
    if (!expirationDate) return

    setSaving(true)
    setSaveError(null)

    try {
      await createClient(user.uid, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        amount: parseInt(form.amount, 10),
        durationDays: parseInt(form.durationDays, 10),
        paymentDate: form.paymentDate,
        expirationDate,
        tariffId: selectedTariffId ?? undefined,
      })

      // Успех — возвращаемся на главный экран
      onCreated()
    } catch (err) {
      console.error('Ошибка создания клиента:', err)
      setSaveError('Не удалось сохранить. Проверьте интернет.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageWrapper>
      {/* Шапка */}
      <AppHeader
        title="Новый клиент"
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

      {/* Форма */}
      <div className="flex-1 px-3 pt-2 pb-6">
        <div className="flex flex-col gap-3">

          {/* === Имя и Фамилия (в одну строку) === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              {/* Имя */}
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

              {/* Фамилия */}
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

          {/* === Телефон и Заметки (в одну строку) === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              {/* Телефон */}
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

              {/* Заметки */}
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

          {/* === Тарифы (чипы) === */}
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

          {/* === Сумма и Длительность (в одну строку) === */}
          <Card>
            <div className="flex gap-3 min-w-0">
              {/* Сумма */}
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

              {/* Длительность */}
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

            {/* Пресеты длительности */}
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
              {/* Дата оплаты */}
              <DatePickerField
                label="Дата оплаты *"
                value={form.paymentDate}
                onChange={(val) => updateField('paymentDate', val)}
                error={errors.paymentDate}
              />

              {/* Расчёт даты окончания — показываем если все данные заполнены */}
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

          {/* === Кнопка сохранения === */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<UserPlus size={18} />}
            loading={saving}
            onClick={handleSave}
          >
            Добавить клиента
          </Button>

        </div>
      </div>
    </PageWrapper>
  )
}
