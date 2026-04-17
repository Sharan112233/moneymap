import { Trash2, Pencil } from 'lucide-react'

const catColors = {
  Food:'#ffb545', Transport:'#4fa3ff', Entertainment:'#6c63ff',
  Health:'#22d3a0', Shopping:'#f06292', Utilities:'#26d9c9',
  Rent:'#ff5e7a', Income:'#22d3a0', Salary:'#22d3a0',
  Freelance:'#22d3a0', Business:'#22d3a0', Investment:'#22d3a0',
  'Other Income':'#22d3a0'
}
const catIcons = {
  Food:'🍔', Transport:'🚗', Entertainment:'🎬', Health:'💊',
  Shopping:'🛍️', Utilities:'💡', Rent:'🏠', Income:'💰',
  Salary:'💰', Freelance:'💼', Business:'🏢', Investment:'📈',
  'Other Income':'💵'
}

export default function TransactionItem({ txn, onDelete, onEdit }) {
  const isIncome = txn.txn_type === 'income'
  const color    = catColors[txn.category] || '#9198b0'

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'13px 0', borderBottom:'1px solid var(--border)',
      transition:'background .15s', borderRadius:6,
      cursor:'default'
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Icon */}
      <div style={{
        width:38, height:38, borderRadius:11,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:17, background: color+'20', flexShrink:0
      }}>
        {catIcons[txn.category] || '💳'}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {txn.description}
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{
            background: color+'20', color, padding:'1px 7px',
            borderRadius:20, fontSize:11, fontWeight:500
          }}>
            {txn.category}
          </span>
          <span>·</span>
          <span>{txn.date}</span>
          {txn.notes && <><span>·</span><span style={{ fontStyle:'italic' }}>{txn.notes}</span></>}
        </div>
      </div>

      {/* Amount */}
      <div style={{
        fontFamily:'DM Mono,monospace', fontSize:14, fontWeight:600,
        color: isIncome ? 'var(--green)' : 'var(--red)',
        flexShrink:0
      }}>
        {isIncome ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {onEdit && (
          <button onClick={() => onEdit(txn)} style={{
            background:'rgba(108,99,255,.12)', color:'var(--accent2)',
            border:'1px solid rgba(108,99,255,.2)', borderRadius:7,
            padding:'5px 9px', cursor:'pointer', display:'flex',
            alignItems:'center', transition:'all .2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(108,99,255,.12)'}
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(txn.id)} style={{
            background:'rgba(255,94,122,.1)', color:'var(--red)',
            border:'1px solid rgba(255,94,122,.2)', borderRadius:7,
            padding:'5px 9px', cursor:'pointer', display:'flex',
            alignItems:'center', transition:'all .2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,94,122,.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,94,122,.1)'}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
