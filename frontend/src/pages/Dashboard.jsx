import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSummary, getTransactions, getByCategory, getMonthlyTrend } from '../api/client'
import MetricCard from '../components/MetricCard'
import TransactionItem from '../components/TransactionItem'
import EmptyState from '../components/EmptyState'
import SkeletonCard, { SkeletonChart, SkeletonList } from '../components/SkeletonCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts'
import { TrendingUp, Wallet, PiggyBank, Percent, Plus } from 'lucide-react'

const COLORS = ['#ffb545','#4fa3ff','#6c63ff','#22d3a0','#f06292','#26d9c9','#ff5e7a']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:'#1e2230', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
        <div style={{ color:'var(--text2)', marginBottom:4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontFamily:'DM Mono,monospace' }}>₹{p.value?.toLocaleString()}</div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary]         = useState(null)
  const [txns, setTxns]               = useState([])
  const [catData, setCatData]         = useState([])
  const [savingsRate, setSavingsRate] = useState([])
  const [loading, setLoading]         = useState(true)

  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    Promise.all([
      getSummary(),
      getTransactions(),
      getByCategory(true),
      getMonthlyTrend()
    ]).then(([s, t, c, m]) => {
      setSummary(s.data)
      setTxns(t.data.slice(0, 6))
      setCatData(c.data)
      setSavingsRate(
        m.data.map(d => ({
          month: d.month.slice(5),
          rate: d.income > 0 ? parseFloat(((d.income - d.expense) / d.income * 100).toFixed(1)) : 0
        }))
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div className="skeleton" style={{ height:28, width:'40%', marginBottom:8 }} />
        <div className="skeleton" style={{ height:14, width:'25%' }} />
      </div>
      <div className="grid-4" style={{ marginBottom:16 }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="grid-2-1" style={{ marginBottom:14 }}>
        <SkeletonChart height={220} />
        <SkeletonChart height={220} />
      </div>
      <SkeletonList rows={5} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="fade-in" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:12 }}>
        <div style={{ minWidth:0 }}>
          <h1 style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {greeting}, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize:14, color:'var(--text2)', marginTop:3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/transactions')}
          style={{
            display:'flex', alignItems:'center', gap:8, flexShrink:0,
            background:'var(--accent)', color:'white',
            border:'none', borderRadius:'var(--r2)',
            padding:'10px 18px', fontSize:14,
            cursor:'pointer', fontWeight:500, transition:'all .2s'
          }}>
          <Plus size={16} />
          <span className="desktop-only">Add Transaction</span>
          <span className="mobile-only" style={{ display:'none' }}>Add</span>
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid-4" style={{ marginBottom:16 }}>
        <MetricCard label="Total Income"   delay={0}   value={`₹${(summary?.total_income||0).toLocaleString()}`}  color="var(--green)"   icon={TrendingUp} change="All time" changeType="neutral" />
        <MetricCard label="Total Expense"  delay={80}  value={`₹${(summary?.total_expense||0).toLocaleString()}`} color="var(--red)"     icon={Wallet}     change="All time" changeType="neutral" />
        <MetricCard label="Net Savings"    delay={160} value={`₹${(summary?.net_savings||0).toLocaleString()}`}   color="var(--accent2)" icon={PiggyBank}  change="Income minus expenses" changeType="neutral" />
        <MetricCard label="Savings Rate"   delay={240} value={`${summary?.savings_rate||0}%`}                     color="var(--amber)"   icon={Percent}
          change={summary?.savings_rate >= 20 ? '  Above target' : '⚠️ Below 20% target'}
          changeType={summary?.savings_rate >= 20 ? 'up' : 'down'} />
      </div>

      {/* Net Worth Banner */}
      <div className="fade-in" style={{ background:'linear-gradient(135deg,rgba(108,99,255,.15),rgba(34,211,160,.1))', border:'1px solid rgba(108,99,255,.2)', borderRadius:'var(--r)', padding:'16px 20px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Net Worth (All Time)</div>
          <div style={{ fontSize:28, fontWeight:700, fontFamily:'DM Mono,monospace', color: (summary?.net_savings||0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(summary?.net_savings||0) >= 0 ? '+' : '-'}₹{Math.abs(summary?.net_savings||0).toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Total income minus total expenses since you started</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Savings Rate</div>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--amber)' }}>{summary?.savings_rate||0}%</div>
          <div style={{ fontSize:11, color: (summary?.savings_rate||0) >= 20 ? 'var(--green)' : 'var(--red)', marginTop:2 }}>
            {(summary?.savings_rate||0) >= 20 ? '  Healthy' : '⚠️ Below 20% target'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2-1" style={{ marginBottom:14 }}>
        {/* Bar chart */}
        <div className="fade-in-2" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Spending by Category</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>All time totals</div>
          {catData.length === 0 ? (
            <EmptyState icon="📊" title="No spending data yet" subtitle="Add some expense transactions to see your category breakdown" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} barSize={28}>
                <XAxis dataKey="category" tick={{ fill:'#9198b0', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#9198b0', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+(v/1000)+'k'} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Savings Rate chart */}
        <div className="fade-in-2" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Savings Rate Trend</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>Monthly savings % of income</div>
          {savingsRate.length === 0 ? (
            <EmptyState icon="📈" title="No data yet" subtitle="Add transactions to see savings trend" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={savingsRate}>
                  <XAxis dataKey="month" tick={{ fill:'#9198b0', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#9198b0', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => v+'%'} />
                  <Tooltip formatter={(v) => [v+'%', 'Savings Rate']} contentStyle={{ background:'#1e2230', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, fontSize:13 }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--accent2)" strokeWidth={2} dot={{ fill:'var(--accent2)', r:3 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  Avg: <span style={{ color:'var(--accent2)', fontWeight:600 }}>
                    {(savingsRate.reduce((s,d) => s + d.rate, 0) / savingsRate.length).toFixed(1)}%
                  </span>
                </div>
                <div style={{ fontSize:11, color: savingsRate.at(-1)?.rate >= 20 ? 'var(--green)' : 'var(--red)' }}>
                  {savingsRate.at(-1)?.rate >= 20 ? '  On track' : '⚠️ Below target'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="fade-in-3" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>Recent Transactions</div>
          <span onClick={() => navigate('/transactions')} style={{ fontSize:12, color:'var(--accent2)', cursor:'pointer' }}>
            View all →
          </span>
        </div>
        {txns.length === 0 ? (
          <EmptyState icon="💳" title="No transactions yet" subtitle="Start tracking your income and expenses" action="+ Add Transaction" onAction={() => navigate('/transactions')} />
        ) : (
          txns.map(t => <TransactionItem key={t.id} txn={t} />)
        )}
      </div>
    </div>
  )
}