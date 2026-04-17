export default function SkeletonCard({ height = 80 }) {
  return (
    <div style={{
      background:'var(--bg3)', border:'1px solid var(--border)',
      borderRadius:'var(--r)', padding:18, overflow:'hidden'
    }}>
      <div className="skeleton" style={{ height:12, width:'40%', marginBottom:12 }} />
      <div className="skeleton" style={{ height:height === 80 ? 28 : height, width:'60%', marginBottom:8 }} />
      <div className="skeleton" style={{ height:10, width:'30%' }} />
    </div>
  )
}

export function SkeletonChart({ height = 240 }) {
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--border)',
      borderRadius:'var(--r)', padding:20
    }}>
      <div className="skeleton" style={{ height:14, width:'30%', marginBottom:20 }} />
      <div className="skeleton" style={{ height, width:'100%', borderRadius:'var(--r)' }} />
    </div>
  )
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--border)',
      borderRadius:'var(--r)', padding:20
    }}>
      <div className="skeleton" style={{ height:14, width:'25%', marginBottom:20 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="skeleton" style={{ width:36, height:36, borderRadius:10, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div className="skeleton" style={{ height:12, width:'40%', marginBottom:8 }} />
            <div className="skeleton" style={{ height:10, width:'25%' }} />
          </div>
          <div className="skeleton" style={{ height:12, width:60 }} />
        </div>
      ))}
    </div>
  )
}