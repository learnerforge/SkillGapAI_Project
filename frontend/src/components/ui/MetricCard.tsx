interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
}

export default function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e94560' }}>{value}</div>
      {sub && <div style={{ color: '#666', fontSize: '0.8rem', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
