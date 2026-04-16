import { useTheme } from '../../lib/ThemeContext'

const VARIANT_STYLES = {
  default: {
    dark: 'bg-surface-700/60 text-surface-300 ring-surface-600/50',
    light: 'bg-surface-100 text-surface-700 ring-surface-200',
  },
  success: {
    dark: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    light: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  warning: {
    dark: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    light: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  danger: {
    dark: 'bg-red-500/10 text-red-400 ring-red-500/20',
    light: 'bg-red-50 text-red-700 ring-red-200',
  },
  brand: {
    dark: 'bg-brand-500/10 text-brand-400 ring-brand-500/20',
    light: 'bg-brand-50 text-brand-700 ring-brand-200',
  },
  purple: {
    dark: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    light: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
}

/**
 * Compact badge with label + value.
 * @param {object} props
 * @param {string} [props.label]   - Tiny label prefix.
 * @param {string|number} props.value
 * @param {'default'|'success'|'warning'|'danger'|'brand'|'purple'} [props.variant]
 * @param {string} [props.className]
 */
export default function Badge({ label, value, variant = 'default', className = '' }) {
  const { isDark } = useTheme()
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        isDark ? style.dark : style.light
      } ${className}`}
    >
      {label && (
        <span
          className={`text-[9px] uppercase tracking-wider ${
            isDark ? 'text-surface-500' : 'text-surface-400'
          }`}
        >
          {label}
        </span>
      )}
      {value}
    </span>
  )
}
