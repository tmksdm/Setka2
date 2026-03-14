export const APP_VERSION = '260315.3'

export const changelog = [
  {
    version: '260315.3',
    date: '15.03.2026',
    changes: [
      'ThemeContext: переключение светлой/тёмной темы с сохранением в localStorage',
      'TypeScript-типы: Client, Tariff, Payment, Freeze, Backup и все связанные',
      'UI-компоненты: PageWrapper, AppHeader, Card, Button',
    ],
  },
  {
    version: '260315.2',
    date: '15.03.2026',
    changes: [
      'Перенос Firebase-конфига в .env (секреты больше не в коде)',
    ],
  },
  {
    version: '260315',
    date: '15.03.2026',
    changes: [
      'Firebase Auth: вход через Google',
      'AuthContext: проверка белого списка (allowedUsers)',
      'Страница входа с логотипом и кнопкой',
      'Защита от неразрешённых пользователей с сообщением об ошибке',
      'Fallback на signInWithRedirect для мобильных браузеров',
      'Исправлен конфликт CSS-сброса с Tailwind v4 preflight',
    ],
  },
  {
    version: '260314',
    date: '14.03.2026',
    changes: [
      'Инициализация проекта: Vite 8, React 19, TypeScript, Tailwind CSS v4',
      'Настройка PWA (иконки, манифест, сервис-воркер)',
      'Система тем: светлая и тёмная (CSS-переменные)',
      'Защита от вспышки белого экрана при тёмной теме',
    ],
  },
]
