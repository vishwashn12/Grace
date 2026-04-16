import { useTheme } from '../../lib/ThemeContext'

/**
 * Reusable glassmorphism panel with dark/light theme support.
 * @param {object}  props
 * @param {string}  [props.className]  - Additional classes to merge.
 * @param {boolean} [props.glow]       - Enable brand glow shadow.
 * @param {React.ReactNode} props.children
 */
export default function Panel({ children, className = '', glow = false }) {
  const { isDark } = useTheme()

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        isDark
          ? 'border-surface-700/50 bg-surface-800/60 shadow-panel-dark'
          : 'border-surface-200/80 bg-white/80 shadow-panel'
      } ${glow ? (isDark ? 'shadow-glow-dark' : 'shadow-glow') : ''} ${className}`}
    >
      {children}
    </div>
  )
}
