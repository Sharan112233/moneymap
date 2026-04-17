const TIPS = {
  '📊': 'Add expense transactions to see how your spending is distributed across categories.',
  '📈': 'Add at least 2 months of transactions to see your savings trend over time.',
  '💳': 'Start by adding your first income or expense transaction using the + Add button.',
  '🥧': 'Add expense transactions to see how your money is split across categories.',
  '💰': 'Add transactions for at least 2 months to see your savings forecast.',
  '🎯': 'Set a savings goal by clicking + Add Goal to start tracking your progress.',
}

export default function EmptyState({ icon, title, subtitle, action, onAction }) {
  const tip = TIPS[icon]
  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'48px 24px', textAlign:'center'
    }}>
      <div style={{
        fontSize:48, marginBottom:16,
        filter:'grayscale(20%)',
        animation:'fadeInUp .4s ease both'
      }}>
        {icon || '📭'}
      </div>
      <div style={{
        fontSize:16, fontWeight:600,
        color:'var(--text)', marginBottom:8,
        animation:'fadeInUp .4s ease .1s both'
      }}>
        {title || 'Nothing here yet'}
      </div>
      <div style={{
        fontSize:13, color:'var(--text3)',
        maxWidth:280, lineHeight:1.6,
        marginBottom: tip || action ? 16 : 0,
        animation:'fadeInUp .4s ease .2s both'
      }}>
        {subtitle || 'Add some data to get started'}
      </div>
      {tip && (
        <div style={{
          fontSize:12, color:'var(--accent2)',
          background:'rgba(108,99,255,.08)', border:'1px solid rgba(108,99,255,.15)',
          borderRadius:'var(--r2)', padding:'8px 14px',
          maxWidth:320, lineHeight:1.6, marginBottom: action ? 16 : 0,
          animation:'fadeInUp .4s ease .25s both'
        }}>
          💡 {tip}
        </div>
      )}
      {action && (
        <button
          onClick={onAction}
          style={{
            background:'var(--accent)', color:'white',
            border:'none', borderRadius:'var(--r2)',
            padding:'10px 20px', fontSize:14,
            cursor:'pointer', fontWeight:500,
            animation:'fadeInUp .4s ease .3s both'
          }}>
          {action}
        </button>
      )}
    </div>
  )
}
