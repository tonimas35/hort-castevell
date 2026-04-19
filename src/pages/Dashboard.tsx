import { useLatestReading } from '../hooks/useLatestReading'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroMetric from '../components/HeroMetric'
import AmbientStrip from '../components/AmbientStrip'
import NodesGrid from '../components/NodesGrid'
import HumidityChart from '../components/HumidityChart'
import IrrigationLog from '../components/IrrigationLog'
import '../styles/dashboard.css'

export default function Dashboard() {
  useLatestReading()

  return (
    <>
      <Header />
      <main className="kv-main">
        <HeroMetric />
        <AmbientStrip />
        <NodesGrid />
        <div className="kv-bottom">
          <HumidityChart />
          <IrrigationLog />
        </div>
      </main>
      <Footer />
    </>
  )
}
