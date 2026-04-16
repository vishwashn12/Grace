import { useMemo } from 'react'
import {
  Activity,
  BarChart3,
  Clock,
  FileText,
  Gauge,
  Layers,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useTheme } from '../lib/ThemeContext'
import Panel from '../components/ui/Panel'
import Badge from '../components/ui/Badge'

/* ─── colour tokens ──────────────────────────── */
const COLORS = {
  brand:   '#3672ff',
  emerald: '#10b981',
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
  rose:    '#f43f5e',
  cyan:    '#06b6d4',
  slate:   '#64748b',
}
const PIE_PALETTE = [
  COLORS.brand, COLORS.emerald, COLORS.amber,
  COLORS.violet, COLORS.rose, COLORS.cyan, COLORS.slate,
]

/* ─── helpers ────────────────────────────────── */
const fmt = (v, d = 1) => (v == null || isNaN(v) ? '—' : Number(v).toFixed(d))
const fmtMs = (v) => (v == null || isNaN(v) ? '—' : `${Number(v).toFixed(0)} ms`)

/* ─── KPI Card ───────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color = COLORS.brand, isDark }) {
  return (
    <Panel className="group relative overflow-hidden p-5 hover:scale-[1.02] transition-transform duration-300">
      {/* Glow accent */}
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
            {label}
          </p>
          <p className={`mt-1 font-display text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>
            {value}
          </p>
          {sub && (
            <p className={`mt-0.5 text-[11px] ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}

/* ─── Custom Recharts Tooltip ────────────────── */
function GlassTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl text-[12px] ${
        isDark
          ? 'border-surface-700/60 bg-surface-800/90 text-surface-200'
          : 'border-surface-200/80 bg-white/95 text-surface-800'
      }`}
    >
      <p className={`mb-1.5 font-semibold ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-mono font-semibold">{fmtMs(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

/* ─── Empty State ────────────────────────────── */
function EmptyState({ isDark }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center animate-rise">
        <div
          className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${
            isDark ? 'bg-brand-500/10' : 'bg-brand-50'
          }`}
        >
          <Activity size={36} className={isDark ? 'text-brand-400' : 'text-brand-600'} />
        </div>
        <h2 className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-surface-800'}`}>
          No session data yet
        </h2>
        <p className={`mx-auto mt-2 max-w-sm text-sm leading-relaxed ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
          Start chatting with the AI assistant to generate query metrics.
          Session insights will appear here automatically.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   InsightsPage — session analytics
   ═══════════════════════════════════════════════ */
export default function InsightsPage({ queryLog = [] }) {
  const { isDark } = useTheme()

  /* ── derived data ─────────────────────────── */
  const stats = useMemo(() => {
    if (!queryLog.length) return null

    const totals = queryLog.map((q) => q.latency_total_ms ?? 0)
    const avgLatency = totals.reduce((a, b) => a + b, 0) / totals.length
    const maxLatency = Math.max(...totals)

    const ragCount = queryLog.filter((q) =>
      (q.mode || '').toLowerCase().includes('rag')
    ).length
    const agentCount = queryLog.filter((q) =>
      (q.mode || '').toLowerCase().includes('agent')
    ).length
    const total = ragCount + agentCount || 1
    const ragPct = ((ragCount / total) * 100).toFixed(0)
    const agentPct = ((agentCount / total) * 100).toFixed(0)

    const avgDocs =
      queryLog.reduce((a, q) => a + (q.docs_retrieved ?? 0), 0) / queryLog.length

    return { avgLatency, maxLatency, ragPct, agentPct, ragCount, agentCount, avgDocs }
  }, [queryLog])

  /* Latency trend data (chronological order) */
  const latencyTrend = useMemo(
    () =>
      queryLog.map((q, i) => ({
        name: `Q${i + 1}`,
        total: q.latency_total_ms ?? 0,
        retrieval: q.latency_retrieval_ms ?? 0,
        llm: q.latency_llm_ms ?? 0,
      })),
    [queryLog],
  )

  /* Intent distribution */
  const intentDist = useMemo(() => {
    const map = {}
    queryLog.forEach((q) => {
      const key = q.intent || 'unknown'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [queryLog])

  /* Latest 50 rows, newest first */
  const tableRows = useMemo(
    () => [...queryLog].reverse().slice(0, 50),
    [queryLog],
  )

  /* ── render ───────────────────────────────── */
  if (!queryLog.length) return <EmptyState isDark={isDark} />

  const axis = { fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }

  return (
    <section className="mx-auto max-w-7xl animate-rise">
      {/* Header */}
      <header className="mb-6">
        <h1 className={`font-display text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>
          System Insights
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
          Session-level analytics for the current chat session · {queryLog.length} queries recorded
        </p>
      </header>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Clock}
          label="Avg Latency"
          value={fmtMs(stats.avgLatency)}
          sub="Across all queries"
          color={COLORS.brand}
          isDark={isDark}
        />
        <KpiCard
          icon={TrendingUp}
          label="Max Latency"
          value={fmtMs(stats.maxLatency)}
          sub="Peak response time"
          color={COLORS.rose}
          isDark={isDark}
        />
        <KpiCard
          icon={Layers}
          label="RAG vs Agent"
          value={`${stats.ragPct}% / ${stats.agentPct}%`}
          sub={`${stats.ragCount} RAG · ${stats.agentCount} Agent`}
          color={COLORS.violet}
          isDark={isDark}
        />
        <KpiCard
          icon={FileText}
          label="Avg Docs Retrieved"
          value={fmt(stats.avgDocs)}
          sub="Per query average"
          color={COLORS.emerald}
          isDark={isDark}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Latency Trend */}
        <Panel className="lg:col-span-2 p-5">
          <p className={`mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
            <Gauge size={14} /> Latency Trend
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={latencyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} unit=" ms" width={60} />
              <ReTooltip content={<GlassTooltip isDark={isDark} />} />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke={COLORS.brand}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: COLORS.brand }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="retrieval"
                name="Retrieval"
                stroke={COLORS.emerald}
                strokeWidth={1.8}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="llm"
                name="LLM"
                stroke={COLORS.amber}
                strokeWidth={1.8}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Intent Distribution */}
        <Panel className="p-5">
          <p className={`mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
            <BarChart3 size={14} /> Intent Distribution
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={intentDist}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {intentDist.map((_, i) => (
                  <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(val) => (
                  <span className={`text-[11px] ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                    {val}
                  </span>
                )}
              />
              <ReTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div
                      className={`rounded-xl border px-3 py-2 text-[12px] shadow-lg backdrop-blur-xl ${
                        isDark
                          ? 'border-surface-700/60 bg-surface-800/90 text-surface-200'
                          : 'border-surface-200/80 bg-white/95 text-surface-800'
                      }`}
                    >
                      <span className="font-semibold capitalize">{d.name}</span>: {d.value} queries
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Query Log Table */}
      <Panel className="overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
            <Zap size={14} /> Query Log
            <Badge value={`${tableRows.length} rows`} variant="brand" className="ml-2" />
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr
                className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? 'border-surface-700/50 text-surface-500'
                    : 'border-surface-200 text-surface-400'
                }`}
              >
                {['Time', 'Query', 'Intent', 'Mode', 'Total', 'Retrieval', 'LLM', 'Docs', 'Tools'].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => {
                const ts = row.timestamp
                  ? new Date(row.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '—'
                const tools = Array.isArray(row.tools_used)
                  ? row.tools_used.join(', ')
                  : row.tools_used || '—'

                return (
                  <tr
                    key={i}
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-surface-800 hover:bg-surface-800/60'
                        : 'border-surface-100 hover:bg-surface-50'
                    }`}
                  >
                    <td className={`whitespace-nowrap px-4 py-2.5 font-mono ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                      {ts}
                    </td>
                    <td
                      className={`max-w-[220px] truncate px-4 py-2.5 ${isDark ? 'text-surface-200' : 'text-surface-800'}`}
                      title={row.query}
                    >
                      {row.query || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge value={row.intent || 'unknown'} variant="brand" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        value={(row.mode || '—').toUpperCase()}
                        variant={
                          (row.mode || '').includes('agent')
                            ? 'warning'
                            : (row.mode || '').includes('error')
                              ? 'danger'
                              : 'success'
                        }
                      />
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2.5 font-mono ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                      {fmtMs(row.latency_total_ms)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2.5 font-mono ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                      {fmtMs(row.latency_retrieval_ms)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2.5 font-mono ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                      {fmtMs(row.latency_llm_ms)}
                    </td>
                    <td className={`px-4 py-2.5 text-center font-mono ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                      {row.docs_retrieved ?? '—'}
                    </td>
                    <td
                      className={`max-w-[140px] truncate px-4 py-2.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}
                      title={tools}
                    >
                      {tools || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  )
}
