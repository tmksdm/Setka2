// Универсальная кнопка — варианты, размеры, иконка, загрузка

import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

// Стили для каждого варианта кнопки
const variantStyles: Record<ButtonVariant, {
  bg: string
  text: string
  border: string
  hoverOpacity: string
}> = {
  primary: {
    bg: 'var(--color-primary)',
    text: '#FFFFFF',
    border: 'transparent',
    hoverOpacity: '0.9',
  },
  success: {
    bg: 'var(--color-status-good)',
    text: '#FFFFFF',
    border: 'transparent',
    hoverOpacity: '0.9',
  },
  danger: {
    bg: 'var(--color-status-overdue)',
    text: '#FFFFFF',
    border: 'transparent',
    hoverOpacity: '0.9',
  },
  outline: {
    bg: 'transparent',
    text: 'var(--color-text-primary)',
    border: 'var(--color-input-border)',
    hoverOpacity: '1',
  },
  ghost: {
    bg: 'transparent',
    text: 'var(--color-text-secondary)',
    border: 'transparent',
    hoverOpacity: '1',
  },
}

// Размеры кнопки
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        rounded-md transition-opacity duration-150
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
        ${className}
      `}
      style={{
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  )
}
