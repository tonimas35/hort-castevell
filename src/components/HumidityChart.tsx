import { useState, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { useHistory } from '../hooks/useHistory'
import { ROWS } from '../lib/constants'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}

const PERIODS = [
  { label: '24h', value: 24 },
  { label: '3d', value: 72 },
  { label: '7d', value: 168 },
] as const

export default function HumidityChart() {
  const [hours, setHours] = useState<number>(24)
  const entries = useHistory(hours)

  const chartData = useMemo(() => {
    const labels = entries.map(e => fmtTime(e.timestamp))
    const datasets = ROWS.map(row => ({
      label: `${row.badge} · ${row.name}`,
      borderColor: row.accent,
      backgroundColor: row.accent + '1A',
      data: entries.map(e => {
        const node = e.nodes?.find(n => n.id === row.id)
        return node ? node.humidity_pct : null
      }),
      tension: 0.4,
      pointRadius: 0,
      pointHitRadius: 12,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: row.accent,
      borderWidth: 2,
      fill: false,
    }))
    return { labels, datasets }
  }, [entries])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'start' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle' as const,
          boxWidth: 6,
          padding: 16,
          font: { family: "'Outfit', sans-serif", size: 11, weight: 500 as const },
          color: '#7A6F5E',
        },
      },
      tooltip: {
        backgroundColor: '#3A3225',
        titleFont: { family: "'JetBrains Mono', monospace", size: 10, weight: 'normal' as const },
        titleColor: 'rgba(253, 250, 243, 0.6)',
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
        bodyColor: '#FDFAF3',
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        boxWidth: 7,
        boxHeight: 7,
        boxPadding: 5,
        callbacks: {
          label: (ctx: { dataset: { label: string }, parsed: { y: number } }) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v: number | string) => v + '%',
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          color: '#A69C89',
          maxTicksLimit: 6,
        },
        grid: { color: 'rgba(58, 50, 37, 0.06)' },
        border: { display: false },
      },
      x: {
        ticks: {
          maxTicksLimit: 8,
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          color: '#A69C89',
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return (
    <section className="kv-chart-panel" aria-label="Evolució d'humitat">
      <div className="kv-chart-head">
        <h2 className="kv-chart-title">Evolució humitat del sòl</h2>
        <div className="kv-chart-period">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              className={hours === p.value ? 'active' : ''}
              onClick={() => setHours(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="kv-chart-canvas">
        <Line data={chartData} options={options} />
      </div>
    </section>
  )
}
