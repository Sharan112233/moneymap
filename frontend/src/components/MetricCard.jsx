import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target || isNaN(parseFloat(String(target).replace(/[^0-9.]/g, '')))) {
      setValue(target)
      return
    }
    const num      = parseFloat(String(target).replace(/[^0-9.]/g, ''))
    const prefix   = String(target).match(/^[^0-9]*/)?.[0] || ''
    const suffix   = String(target).match(/[^0-9.]*$/)?.[0] || ''
    const start    = Date.now()
    const timer    = setInterval(() => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      const current  = Math.floor(eased * num)
      setValue(prefix + current.toLocaleString() + suffix)
      if (progress === 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return value
}

export default function MetricCard({ label, value, change, changeType, color, icon: Icon, delay = 0 }) {
  const animatedValue = useCountUp(value)

  return (
    <div className="fade-in" style={{
      background:'var(--bg3)', border:'1px solid var(--border)',
      borderRadius:'var(--r)', padding:20,
      transition:'transform .2s, box-shadow .2s',
      cursor:'default', animationDelay: delay + 'ms',
      position:'relative', overflow:'hidden'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      {/* Subtle gradient accent */}
      <div style={{
        position:'absolute', top:0, right:0,
        width:80, height:80, borderRadius:'50%',
        background: color || 'var(--accent)',
        opacity:.06, transform:'translate(20px,-20px)'
      }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.6, fontWeight:500 }}>
          {label}
        </div>
        {Icon && (
          <div style={{
            width:30, height:30, borderRadius:8,
            background: (color || 'var(--accent)') + '20',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <Icon size={15} color={color || 'var(--accent)'} />
          </div>
        )}
      </div>

      <div style={{
        fontSize:26, fontWeight:600, letterSpacing:-1,
        fontFamily:'DM Mono,monospace',
        color: color || 'var(--text)',
        marginBottom:6,
        animation:'countUp .5s ease both'
      }}>
        {animatedValue || value}
      </div>

      {change && (
        <div style={{
          display:'flex', alignItems:'center', gap:4,
          fontSize:12,
          color: changeType === 'up' ? 'var(--green)' : changeType === 'down' ? 'var(--red)' : 'var(--text3)'
        }}>
          {changeType === 'up' && <TrendingUp size={12} />}
          {changeType === 'down' && <TrendingDown size={12} />}
          {change}
        </div>
      )}
    </div>
  )
}