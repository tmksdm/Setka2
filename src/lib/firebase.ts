// Инициализация Firebase — подключение к проекту Setka2

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Конфигурация Firebase-проекта
const firebaseConfig = {
  apiKey: "AIzaSyBU9_Bbpfo_Kgqz_9osal7oS2aU4JOUEUo",
  authDomain: "setka2.firebaseapp.com",
  projectId: "setka2",
  storageBucket: "setka2.firebasestorage.app",
  messagingSenderId: "173266560928",
  appId: "1:173266560928:web:1971e4c8bdd2dca18426c5"
}

// Инициализация
const app = initializeApp(firebaseConfig)

// Аутентификация
export const auth = getAuth(app)

// Провайдер Google
export const googleProvider = new GoogleAuthProvider()

// База данных Firestore
export const db = getFirestore(app)
