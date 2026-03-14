// Контекст авторизации — следит за состоянием входа пользователя

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

// Типы
interface AuthContextType {
  /** Текущий пользователь Firebase (null = не вошёл) */
  user: User | null
  /** Идёт загрузка (проверка авторизации) */
  loading: boolean
  /** Ошибка (например, «Доступ запрещён») */
  error: string | null
  /** Функция входа через Google */
  login: () => Promise<void>
  /** Функция выхода */
  logout: () => Promise<void>
}

// Создаём контекст
const AuthContext = createContext<AuthContextType | null>(null)

// Хук для удобного доступа к контексту
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

// Проверка email в белом списке Firestore
async function checkAllowedUser(email: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'allowedUsers', email)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch (err) {
    console.error('Ошибка проверки allowedUsers:', err)
    return false
  }
}

// Провайдер — оборачивает всё приложение
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Флаг: мы сами вызвали signOut из-за запрещённого email
  const deniedSignOutRef = useRef(false)

  // Слушаем изменения состояния авторизации
  useEffect(() => {
    // Проверяем результат redirect-входа (для мобильных браузеров)
    getRedirectResult(auth).catch((err) => {
      console.error('Ошибка redirect:', err)
    })

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Пользователь вошёл — проверяем, есть ли он в белом списке
        const isAllowed = await checkAllowedUser(firebaseUser.email)
        if (isAllowed) {
          setUser(firebaseUser)
          setError(null)
          deniedSignOutRef.current = false
        } else {
          // Email не в белом списке — выходим
          setUser(null)
          setError('Доступ запрещён. Ваш email не в списке разрешённых.')
          deniedSignOutRef.current = true
          await signOut(auth)
        }
      } else {
        // Пользователь не вошёл
        setUser(null)
        // Сбрасываем ошибку только если это НЕ наш принудительный выход
        if (!deniedSignOutRef.current) {
          setError(null)
        }
        deniedSignOutRef.current = false
      }
      setLoading(false)
    })

    // Отписываемся при размонтировании
    return unsubscribe
  }, [])

  // Вход через Google
  const login = async () => {
    setError(null)
    setLoading(true)
    try {
      // Сначала пробуем popup (работает на десктопе)
      await signInWithPopup(auth, googleProvider)
    } catch (popupError: unknown) {
      // Если popup заблокирован (мобильный браузер) — пробуем redirect
      const err = popupError as { code?: string }
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (redirectError) {
          console.error('Ошибка redirect-входа:', redirectError)
          setError('Не удалось войти. Попробуйте ещё раз.')
          setLoading(false)
        }
      } else {
        console.error('Ошибка входа:', popupError)
        setError('Не удалось войти. Попробуйте ещё раз.')
        setLoading(false)
      }
    }
  }

  // Выход
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Ошибка выхода:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
