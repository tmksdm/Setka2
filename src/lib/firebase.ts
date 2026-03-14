// Инициализация Firebase — подключение к проекту Setka2

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Конфигурация из переменных окружения (.env файл)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Инициализация
const app = initializeApp(firebaseConfig)

// Аутентификация
export const auth = getAuth(app)

// Провайдер Google
export const googleProvider = new GoogleAuthProvider()

// База данных Firestore
export const db = getFirestore(app)
