import { useLatestReading } from '../hooks/useLatestReading'
import Header from '../components/Header'
import AmbientStrip from '../components/AmbientStrip'
import NodesGrid from '../components/NodesGrid'
import HumidityChart from '../components/HumidityChart'
import IrrigationLog from '../components/IrrigationLog'
import Footer from '../components/Footer'
import '../styles/dashboard.css'

export default function Dashboard() {
  // Start polling Supabase
  useLatestReading()

  return (
    <>
      <Header />
      <main className="dashboard-main">
        <AmbientStrip />
        <NodesGrid />
        <HumidityChart />
        <IrrigationLog />
      </main>
      <Footer />
    </>
  )
}
