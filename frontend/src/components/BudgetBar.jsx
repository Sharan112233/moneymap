export default function BudgetBar({ category, budget, spent }) {
  const pct   = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0
  const color = pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)'

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:14, fontWeight:500 }}>{category}</span>
        <span style={{ color:'var(--text2)', fontFamily:'DM Mono,monospace', fontSize:12 }}>
          ₹{spent.toLocaleString()} / ₹{budget.toLocaleString()}
          <span style={{ marginLeft:8, color, fontWeight:600 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height:8, background:'var(--bg4)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ width:pct+'%', height:'100%', background:color, borderRadius:4, transition:'width .5s ease' }} />
      </div>
      {pct > 80 && (
        <div style={{ fontSize:11, marginTop:4, color }}>
          {pct >= 100 ? '🚨 Over budget by ₹'+(spent-budget).toLocaleString() : '⚠️ '+pct+'% used — ₹'+(budget-spent).toLocaleString()+' remaining'}
        </div>
      )}
    </div>
  )
}