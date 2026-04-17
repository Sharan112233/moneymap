import { useEffect, useState } from 'react'
import { getForecast, getPredictMonthEnd, getForecastByCategory, getGoals, addGoal, updateGoal, deleteGoal, predictGoal } from '../api/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import MetricCard from '../components/MetricCard'

const COLORS = ['#ffb545','#4fa3ff','#6c63ff','#22d3a0','#f06292','#26d9c9','#ff5e7a']

export default function Forecast() {
  const [forecast, setForecast]     = useState({ historical:[], forecast:[] })
  const [monthEnd, setMonthEnd]     = useState({})
  const [catForecast, setCatForecast] = useState({})
  const [goals, setGoals]           = useState([])
  const [goalPredictions, setGoalPredictions] = useState({})
const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ name:'', target:'', saved:'', icon:'🎯' })
  const [addingTo, setAddingTo]   = useState(null)
  const [addAmount, setAddAmount] = useState('')

  useEffect(() => {
    getForecast().then(r => setForecast(r.data))
    getPredictMonthEnd().then(r => setMonthEnd(r.data))
    getForecastByCategory().then(r => setCatForecast(r.data))
    loadGoals()
  }, [])

  const loadGoals = () => {
    getGoals().then(r => {
      setGoals(r.data)
      r.data.forEach(g => {
        predictGoal(g.id).then(pr => {
          setGoalPredictions(prev => ({ ...prev, [g.id]: pr.data }))
        })
      })
    })
  }

  const handleAddGoal = async () => {
    if(!goalForm.name || !goalForm.target) return
    await addGoal({ name: goalForm.name, target: parseFloat(goalForm.target), saved: parseFloat(goalForm.saved||0), icon: goalForm.icon })
    setShowGoalForm(false)
    setGoalForm({ name:'', target:'', saved:'', icon:'🎯' })
    loadGoals()
  }

  const handleAddSavings = (goal) => {
    setAddingTo(goal.id)
    setAddAmount('')
  }

  const handleSaveAmount = async (goal) => {
    if(!addAmount || isNaN(addAmount)) return
    const newTotal = goal.saved + parseFloat(addAmount)
    await updateGoal(goal.id, { saved: newTotal })
    setAddingTo(null)
    setAddAmount('')
    loadGoals()
  }

  const handleDeleteGoal = async (id) => {
    if(window.confirm('Delete this goal?')) {
      await deleteGoal(id)
      loadGoals()
    }
  }

  const chartData = [
    ...((forecast.historical||[]).map(d => ({ month:d.month, actual: d.savings }))),
    ...((forecast.forecast||[]).map(d => ({ month:d.month, predicted: d.predicted_savings })))
  ]

  const catChartData = Object.entries(catForecast).map(([cat, data]) => ({
    category: cat,
    next_month: data.next_month_predicted || 0,
    trend: data.trend
  })).filter(d => d.next_month > 0)

  const inp = { background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'10px 12px', color:'var(--text)', fontSize:14, outline:'none', width:'100%' }
  const tt  = { contentStyle:{ background:'#1e2230', border:'1px solid rgba(255,255,255,.1)', borderRadius:8 }, formatter: v => '₹'+v.toLocaleString() }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:600 }}>Forecast & Goals</h1>
        <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>ML-powered predictions using Linear Regression</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <MetricCard label="Spent So Far"       value={`₹${(monthEnd.spent_so_far||0).toLocaleString()}`} color="var(--red)"     change={`${monthEnd.days_passed||0} days passed`} />
        <MetricCard label="Daily Average"      value={`₹${(monthEnd.daily_avg||0).toLocaleString()}`}    color="var(--amber)" />
        <MetricCard label="Predicted Month-End" value={`₹${(monthEnd.predicted_total||0).toLocaleString()}`} color="var(--accent2)" change="Linear projection" />
      </div>

      {/* Savings Forecast Chart */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20, marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>6-Month Savings Forecast</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Green = actual · Blue dashed = ML predicted (scikit-learn LinearRegression)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill:'#9198b0', fontSize:11 }} />
            <YAxis tick={{ fill:'#9198b0', fontSize:11 }} tickFormatter={v=>'₹'+v.toLocaleString()} />
            <Tooltip {...tt} />
            <Line type="monotone" dataKey="actual"    stroke="#22d3a0" strokeWidth={2} dot={{ r:5 }} name="Actual Savings" />
            <Line type="monotone" dataKey="predicted" stroke="#6c63ff" strokeWidth={2} strokeDasharray="6 3" dot={{ r:5 }} name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per Category Forecast */}
      {catChartData.length > 0 && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20, marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Next Month Spending Forecast by Category</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Predicted spending per category for next month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="category" tick={{ fill:'#9198b0', fontSize:11 }} />
              <YAxis tick={{ fill:'#9198b0', fontSize:11 }} tickFormatter={v=>'₹'+v.toLocaleString()} />
              <Tooltip {...tt} />
              <Bar dataKey="next_month" radius={[6,6,0,0]} name="Predicted Spend">
                {catChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.trend === 'increasing' ? '#ff5e7a' : '#22d3a0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12, color:'var(--text3)' }}>
            <span><span style={{ color:'var(--red)' }}>●</span> Increasing trend</span>
            <span><span style={{ color:'var(--green)' }}>●</span> Decreasing trend</span>
          </div>
        </div>
      )}

      {/* Savings Goals */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>🎯 Savings Goals + ML Predictor</div>
          <button onClick={()=>setShowGoalForm(!showGoalForm)}
            style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'7px 14px', fontSize:13, cursor:'pointer' }}>
            + New Goal
          </button>
        </div>

        {showGoalForm && (
          <div style={{ background:'var(--bg3)', borderRadius:'var(--r2)', padding:16, marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', gap:10, marginBottom:10 }}>
              <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Goal Name</label>
                <input style={inp} value={goalForm.name} onChange={e=>setGoalForm({...goalForm,name:e.target.value})} placeholder="e.g. New Laptop" /></div>
              <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Target (₹)</label>
                <input style={inp} type="number" value={goalForm.target} onChange={e=>setGoalForm({...goalForm,target:e.target.value})} /></div>
              <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Saved So Far (₹)</label>
                <input style={inp} type="number" value={goalForm.saved} onChange={e=>setGoalForm({...goalForm,saved:e.target.value})} /></div>
              <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Icon</label>
                <input style={inp} value={goalForm.icon} onChange={e=>setGoalForm({...goalForm,icon:e.target.value})} /></div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleAddGoal} style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'8px 18px', fontSize:13, cursor:'pointer' }}>Save Goal</button>
              <button onClick={()=>setShowGoalForm(false)} style={{ background:'var(--bg4)', color:'var(--text2)', border:'none', borderRadius:'var(--r2)', padding:'8px 14px', fontSize:13, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {goals.length === 0
          ? <p style={{ color:'var(--text3)', textAlign:'center', padding:'30px 0', fontSize:13 }}>No goals yet. Add your first savings goal!</p>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {goals.map(g => {
              const pct  = Math.min(100, Math.round(g.saved / g.target * 100))
              const pred = goalPredictions[g.id]
              const color = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--accent2)'
              return (
                <div key={g.id} style={{ background:'var(--bg3)', borderRadius:'var(--r)', padding:16, border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:24 }}>{g.icon}</span>
                      <div style={{ fontSize:14, fontWeight:600 }}>{g.name}</div>
                    </div>
                    <button onClick={()=>handleDeleteGoal(g.id)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:6 }}>
                    <span>₹{g.saved.toLocaleString()} saved</span>
                    <span>₹{g.target.toLocaleString()} goal</span>
                  </div>
                  <div style={{ height:6, background:'var(--bg4)', borderRadius:4, marginBottom:8 }}>
                    <div style={{ width:pct+'%', height:'100%', background:color, borderRadius:4, transition:'width .5s' }} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color, marginBottom:8 }}>{pct}% complete</div>
                  {pred && pred.months_needed && (
                    <div style={{ fontSize:11, color:'var(--text3)', background:'var(--bg4)', borderRadius:6, padding:'6px 8px', marginBottom:8, lineHeight:1.7 }}>
                      🤖 ML Prediction:<br/>
                      ₹{pred.remaining?.toLocaleString()} remaining<br/>
                      ~{pred.months_needed} months at ₹{pred.avg_monthly_savings?.toLocaleString()}/mo<br/>
                      <span style={{ color:'var(--accent2)' }}>Est. completion: {pred.predicted_completion}</span>
                    </div>
                  )}
                  {addingTo === g.id ? (
  <div style={{ marginTop:8 }}>
    <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>
      Current: ₹{g.saved.toLocaleString()} — Enter amount to add:
    </div>
    <div style={{ display:'flex', gap:8 }}>
      <input
        type="number"
        value={addAmount}
        onChange={e => setAddAmount(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSaveAmount(g)}
        placeholder="₹ Amount"
        autoFocus
        style={{
          flex:1, background:'var(--bg4)',
          border:'1px solid var(--border2)',
          borderRadius:'var(--r2)', padding:'8px 10px',
          color:'var(--text)', fontSize:13,
          outline:'none', fontFamily:'DM Mono, monospace'
        }}
      />
      <button
        onClick={() => handleSaveAmount(g)}
        style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'8px 14px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
        Add
      </button>
      <button
        onClick={() => setAddingTo(null)}
        style={{ background:'var(--bg4)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'8px 10px', fontSize:13, cursor:'pointer' }}>
        ✕
      </button>
    </div>
    <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
      New total will be: ₹{(g.saved + (parseFloat(addAmount)||0)).toLocaleString()}
    </div>
  </div>
) : (
  <button
    onClick={() => handleAddSavings(g)}
    style={{ width:'100%', background:'rgba(108,99,255,.15)', color:'var(--accent2)', border:'1px solid rgba(108,99,255,.2)', borderRadius:'var(--r2)', padding:'8px', fontSize:12, cursor:'pointer', marginTop:8 }}>
    + Add Savings
  </button>
)}

                </div>
              )
            })}
          </div>
        }
      </div>
    </div>
  )
}