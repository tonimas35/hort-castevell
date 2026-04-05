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

export default function HumidityChart() {
  const [hours, setHours] = useState(24)
  const entries = useHistory(hours)

  const chartData = useMemo(() => {
    const labels = entries.map(e => fmtTime(e.timestamp))
    const datasets = ROWS.map((row, i) => ({
      label: `${row.badge} ${row.name}`,
      borderColor: row.accent,
      backgroundColor: i === 0 ? 'rgba(78, 122, 72, 0.1)' : row.accent + '14',
      data: entries.map(e => {
        const node = e.nodes?.find(n => n.id === row.id)
        return node ? node.humidity_pct : null
      }),
      tension: 0.4,
      pointRadius: 0,
      pointHitRadius: 12,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: row.accent,
      borderWidth: 2,
      fill: i === 0,
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
        labels: {
          usePointStyle: true, pointStyle: 'circle' as const, boxWidth: 6, padding: 16,
          font: { family: "'Outfit', sans-serif", size: 11, weight: '500' as const },
          color: '#7A6F5E',
        },
      },
      tooltip: {
        backgroundColor: '#3A3225',
        titleFont: { family: "'Outfit', sans-serif", size: 12 },
        bodyFont: { family: "'Outfit', sans-serif", size: 12 },
        cornerRadius: 8, padding: 10,
        callbacks: {
          label: (ctx: { dataset: { label: string }, parsed: { y: number } }) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: (v: number | string) => v + '%', font: { family: "'Outfit', sans-serif", size: 10 }, color: '#A69C89', maxTicksLimit: 6 },
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
      },
      x: {
        ticks: { maxTicksLimit: 8, font: { family: "'Outfit', sans-serif", size: 10 }, color: '#A69C89' },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  const periods = [
    { label: '24h', value: 24 },
    { label: '3d', value: 72 },
    { label: '7d', value: 168 },
  ]

  return (
    <section className="chart-panel" aria-label="Historial d'humitat">
      <div className="panel-header">
        <h2 className="panel-title">Historial d'humitat</h2>
        <div className="period-tabs">
          {periods.map(p => (
            <button
              key={p.value}
              className={`btn-period ${hours === p.value ? 'active' : ''}`}
              onClick={() => setHours(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </section>
  )
}
