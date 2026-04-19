const { useState: useDB } = React;
function Dashboard() {
  const [nodes] = useDB([
    { humidity_pct: 62, battery_v: 3.85, last_seen_s: 720 },
    { humidity_pct: 40, battery_v: 3.92, last_seen_s: 1200 },
    { humidity_pct: 21, battery_v: 3.71, last_seen_s: 600 },
    { humidity_pct: 85, battery_v: 4.01, last_seen_s: 45 },
  ]);
  return (
    <main className="dashboard-main">
      <AmbientStrip temperature={23.5} humidity={58} lux={45200} />
      <SectionDivider label="Estat dels nodes" />
      <NodesGrid nodes={nodes} />
      <HumidityChart />
      <IrrigationLog />
    </main>
  );
}
window.Dashboard = Dashboard;
