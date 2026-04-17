import { useEffect, useState } from 'react'
import { getMonthlyTrend, getByCategoryForMonth } from '../api/client'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts'
import { SkeletonChart } from '../components/SkeletonCard'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background:'#1e2230', border:'1px solid rgba(255,255,255,.1)',
        borderRadius:10, padding:'10px 14px', fontSize:13
      }}>
        <div style={{ color:'var(--text2)', marginBottom:4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color:p.color, fontFamily:'DM Mono,monospace' }}>
            {p.name}: ₹{p.value?.toLocaleString()}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [trend, setTrend]           = useState([])
  const [cumulative, setCumulative] = useState([])
  const [heatmap, setHeatmap]       = useState({ months: [], cats: [], data: {} })
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const trendRes = await getMonthlyTrend()
      setTrend(trendRes.data)

      // Build cumulative savings
      let running = 0
      const cumulativeData = trendRes.data.map(d => {
        running += (d.income - d.expense)
        return { month: d.month.slice(5), cumulative: Math.round(running) }
      })
      setCumulative(cumulativeData)

      // Build heatmap: fetch category breakdown for each month using api client
      const months = trendRes.data.map(d => d.month)
      const catResults = await Promise.all(
        months.map(m => getByCategoryForMonth(m))
      )

      const allCats = new Set()
      const data    = {}
      months.forEach((m, i) => {
        data[m] = {}
        catResults[i].data.forEach(({ category, total }) => {
          data[m][category] = total
          allCats.add(category)
        })
      })
      setHeatmap({ months, cats: [...allCats].sort(), data })
    } catch(e) {
      console.error('Analytics load error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const tt = {
    content: <CustomTooltip />,
    cursor: { fill:'rgba(255,255,255,0.03)' }
  }
  const ax = { fill:'#9198b0', fontSize:11 }

  if (loading) return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div className="skeleton" style={{ height:28, width:'30%', marginBottom:8 }} />
        <div className="skeleton" style={{ height:14, width:'40%' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <SkeletonChart height={240} />
        <SkeletonChart height={240} />
      </div>
      <SkeletonChart height={200} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600 }}>Analytics</h1>
          <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>
            Patterns and trends in your finances
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'var(--bg3)', color:'var(--text2)',
            border:'1px solid var(--border)', borderRadius:'var(--r2)',
            padding:'8px 14px', fontSize:13, cursor:'pointer',
            transition:'all .2s'
          }}>
          {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Monthly Income vs Expense */}
        <div className="fade-in" style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:'var(--r)', padding:20
        }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Monthly Income vs Expenses</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Month by month comparison</div>
          {trend.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--text3)', fontSize:13 }}>
              No data found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+(v/1000)+'k'} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize:12, color:'#9198b0' }} />
                <Bar dataKey="income"  fill="#22d3a0" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#ff5e7a" radius={[4,4,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Income vs Expense Line Chart */}
        <div className="fade-in-2" style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:'var(--r)', padding:20
        }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Income vs Expense — All Time</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Monthly trend over time</div>
          {trend.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, color:'var(--text3)', fontSize:13 }}>
              No data found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => '₹'+(v/1000)+'k'} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize:12, color:'#9198b0' }} />
                <Line type="monotone" dataKey="income"  stroke="#22d3a0" strokeWidth={2} dot={{ r:3 }} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ff5e7a" strokeWidth={2} dot={{ r:3 }} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cumulative Savings */}
      <div className="fade-in-3" style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:'var(--r)', padding:20, marginBottom:14
      }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Cumulative Savings Over Time</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Total wealth built month by month</div>
        {cumulative.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:160, color:'var(--text3)', fontSize:13 }}>
            No data found
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cumulative}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => '₹'+(v/1000).toFixed(1)+'k'} />
                <Tooltip
                  formatter={v => ['₹'+v.toLocaleString(), 'Total Saved']}
                  contentStyle={{ background:'#1e2230', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, fontSize:13 }}
                />
                <Line
                  type="monotone" dataKey="cumulative"
                  stroke={cumulative.at(-1)?.cumulative >= 0 ? '#22d3a0' : '#ff5e7a'}
                  strokeWidth={2.5} dot={{ r:3 }} activeDot={{ r:5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Started: <span style={{ color:'var(--text2)', fontWeight:600 }}>₹{cumulative[0]?.cumulative.toLocaleString()}</span>
              </div>
              <div style={{ fontSize:11, color: cumulative.at(-1)?.cumulative >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                Total saved: ₹{cumulative.at(-1)?.cumulative.toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Month × Category Heatmap */}
      <div className="fade-in-3" style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:'var(--r)', padding:20
      }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Spending Heatmap — Month × Category</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Darker = higher spend. See which category spikes each month.</div>
        {heatmap.months.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:160, color:'var(--text3)', fontSize:13 }}>
            No data found
          </div>
        ) : (() => {
          const catMaxes = {}
          heatmap.cats.forEach(cat => {
            catMaxes[cat] = Math.max(...heatmap.months.map(m => heatmap.data[m]?.[cat] || 0))
          })
          return (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:3, fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', color:'var(--text3)', fontWeight:500, padding:'4px 8px', minWidth:90 }}>Category</th>
                    {heatmap.months.map(m => (
                      <th key={m} style={{ color:'var(--text3)', fontWeight:500, padding:'4px 6px', textAlign:'center', minWidth:72 }}>
                        {m.slice(5)}/{m.slice(2,4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.cats.map(cat => (
                    <tr key={cat}>
                      <td style={{ color:'var(--text2)', padding:'4px 8px', fontWeight:500 }}>{cat}</td>
                      {heatmap.months.map(m => {
                        const val       = heatmap.data[m]?.[cat] || 0
                        const max       = catMaxes[cat] || 1
                        const intensity = val / max
                        const bg        = val === 0
                          ? 'var(--bg3)'
                          : `rgba(108,99,255,${(0.15 + intensity * 0.75).toFixed(2)})`
                        const textColor = intensity > 0.6 ? '#fff' : 'var(--text2)'
                        return (
                          <td key={m} style={{
                            background: bg, borderRadius:6, padding:'6px 4px',
                            textAlign:'center', color: textColor,
                            fontFamily:'DM Mono,monospace', fontSize:11,
                            transition:'all .2s'
                          }}>
                            {val > 0 ? '₹'+(val/1000).toFixed(1)+'k' : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>
    </div>
  )
}