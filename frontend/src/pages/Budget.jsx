import { useEffect, useState } from 'react'
import { getBudgets, setBudget, getSmartBudgetPlan, getCurrentMonthSpending } from '../api/client'
import BudgetBar from '../components/BudgetBar'
import { Lightbulb, Target, AlertTriangle, CheckCircle, X } from 'lucide-react'

const DEFAULT_CATS = ['Food','Transport','Entertainment','Health','Shopping','Utilities','Rent']
const MONTH        = new Date().toISOString().slice(0,7)
const CAT_ICONS    = { Food:'🍔', Transport:'🚗', Entertainment:'🎬', Health:'💊', Shopping:'🛍️', Utilities:'💡', Rent:'🏠' }

const GOAL_PRESETS = [
  { icon:'💻', label:'Laptop / Computer' },
  { icon:'📱', label:'New Phone' },
  { icon:'✈️', label:'Vacation / Trip' },
  { icon:'🏍️', label:'Bike / Vehicle' },
  { icon:'🛡️', label:'Emergency Fund' },
  { icon:'🎓', label:'Course / Education' },
  { icon:'🏠', label:'Home / Furniture' },
  { icon:'🎁', label:'Other Goal' },
]

export default function Budget() {
  const [budgets, setBudgets]   = useState([])
  const [spent, setSpent]       = useState({})
  const [editing, setEditing]   = useState(null)
  const [editVal, setEditVal]   = useState('')

  // Smart planner state
  const [showPlanner, setShowPlanner]     = useState(false)
  const [planForm, setPlanForm]           = useState({ goal_name:'', goal_cost:'', months:'', already_saved:'' })
  const [planResult, setPlanResult]       = useState(null)
  const [planLoading, setPlanLoading]     = useState(false)
  const [planError, setPlanError]         = useState('')
  const [applyConfirm, setApplyConfirm]   = useState(false)
  const [applied, setApplied]             = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [budgetRes, spentRes] = await Promise.all([
        getBudgets(),
        getCurrentMonthSpending(),   //   uses api client — token auto-attached
      ])
      setBudgets(budgetRes.data)
      setSpent(spentRes.data)
    } catch(e) {
      console.error('Budget load error:', e)
    }
  }

  const save = async (cat) => {
    await setBudget({ category: cat, amount: parseFloat(editVal), month: MONTH })
    loadData()
    setEditing(null)
  }

  const getBudgetAmt = (cat) => budgets.find(b => b.category === cat)?.amount || 0

  const handleGeneratePlan = async () => {
    setPlanError('')
    setPlanResult(null)
    setApplied(false)
    if (!planForm.goal_name.trim())                        { setPlanError('Please enter your goal name'); return }
    if (!planForm.goal_cost || parseFloat(planForm.goal_cost) <= 0) { setPlanError('Please enter a valid goal cost'); return }
    if (!planForm.months || parseInt(planForm.months) <= 0) { setPlanError('Please enter number of months'); return }

    setPlanLoading(true)
    try {
      const res = await getSmartBudgetPlan({
        goal_name:     planForm.goal_name.trim(),
        goal_cost:     parseFloat(planForm.goal_cost),
        months:        parseInt(planForm.months),
        already_saved: parseFloat(planForm.already_saved || 0)
      })
      setPlanResult(res.data)
    } catch(e) {
      setPlanError(e.response?.data?.detail || 'Could not generate plan. Add more transaction data first.')
    }
    setPlanLoading(false)
  }

  const handleApplyPlan = async () => {
    if (!planResult) return
    const budgetEntries = Object.entries(planResult.suggested_budgets)
    for (const [cat, data] of budgetEntries) {
      await setBudget({ category: cat, amount: data.suggested, month: MONTH })
    }
    setApplyConfirm(false)
    setApplied(true)
    loadData()
  }

  const inp = {
    background:'var(--bg3)', border:'1px solid var(--border2)',
    borderRadius:'var(--r2)', padding:'10px 12px',
    color:'var(--text)', fontSize:14, outline:'none', width:'100%',
    fontFamily:'DM Sans, sans-serif'
  }

  const today      = new Date()
  const monthLabel = today.toLocaleString('default', { month:'long', year:'numeric' })
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()
  const daysLeft   = daysInMonth - today.getDate()
  const totalBudget = DEFAULT_CATS.reduce((sum, cat) => sum + getBudgetAmt(cat), 0)
  const totalSpent  = DEFAULT_CATS.reduce((sum, cat) => sum + (spent[cat] || 0), 0)
  const totalLeft   = totalBudget - totalSpent

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600 }}>Budget Manager</h1>
          <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>
            {monthLabel} · {daysLeft} days remaining · click a category to edit budget
          </p>
        </div>
        <button
          onClick={() => { setShowPlanner(!showPlanner); setPlanResult(null); setPlanError(''); setApplied(false) }}
          style={{
            display:'flex', alignItems:'center', gap:8,
            background: showPlanner ? 'var(--accent)' : 'var(--bg3)',
            color: showPlanner ? 'white' : 'var(--text2)',
            border:'1px solid var(--border2)', borderRadius:'var(--r2)',
            padding:'10px 16px', fontSize:14, cursor:'pointer', fontWeight:500,
            transition:'all .2s'
          }}>
          <Lightbulb size={15} />
          Smart Budget Planner
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:18 }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6, textTransform:'uppercase' }}>Total Budget</div>
          <div style={{ fontSize:24, fontWeight:600, fontFamily:'DM Mono,monospace' }}>₹{totalBudget.toLocaleString()}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>for {monthLabel}</div>
        </div>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:18 }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6, textTransform:'uppercase' }}>Spent This Month</div>
          <div style={{ fontSize:24, fontWeight:600, fontFamily:'DM Mono,monospace', color:'var(--red)' }}>₹{totalSpent.toLocaleString()}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>current month only</div>
        </div>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:18 }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6, textTransform:'uppercase' }}>Remaining</div>
          <div style={{ fontSize:24, fontWeight:600, fontFamily:'DM Mono,monospace', color: totalLeft >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ₹{Math.abs(totalLeft).toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{totalLeft < 0 ? 'over budget!' : 'left to spend'}</div>
        </div>
      </div>

      {/* Smart Budget Planner */}
      {showPlanner && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:24, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <Target size={18} color='var(--accent2)' />
                Smart Budget Planner
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>
                Tell me your goal — I will suggest how to budget to achieve it
              </div>
            </div>
            <button onClick={() => setShowPlanner(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Goal presets */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>
              Quick select goal type
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {GOAL_PRESETS.map((p, i) => (
                <button key={i}
                  onClick={() => { setSelectedPreset(i); setPlanForm({ ...planForm, goal_name: p.label }) }}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'6px 12px', borderRadius:20, fontSize:13,
                    cursor:'pointer', transition:'all .2s',
                    background: selectedPreset === i ? 'rgba(108,99,255,.2)' : 'var(--bg3)',
                    color: selectedPreset === i ? 'var(--accent2)' : 'var(--text2)',
                    border: selectedPreset === i ? '1px solid rgba(108,99,255,.4)' : '1px solid var(--border)'
                  }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background:'rgba(108,99,255,.08)', border:'1px solid rgba(108,99,255,.15)', borderRadius:'var(--r2)', padding:'12px 16px', marginBottom:16, fontSize:13, color:'var(--text2)', lineHeight:1.8 }}>
            <strong style={{ color:'var(--accent2)' }}>📝 How to fill this form:</strong><br/>
            Example: I want to buy a <strong style={{ color:'var(--text)' }}>Laptop</strong> worth
            <strong style={{ color:'var(--text)' }}> ₹50,000</strong> in
            <strong style={{ color:'var(--text)' }}> 3 months</strong> and I already saved
            <strong style={{ color:'var(--text)' }}> ₹5,000</strong>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>I want to buy / save for</label>
              <input style={inp} value={planForm.goal_name} onChange={e => setPlanForm({...planForm, goal_name: e.target.value})} placeholder="e.g. New Laptop, Goa Trip" />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>It will cost approximately (₹)</label>
              <input style={inp} type="number" value={planForm.goal_cost} onChange={e => setPlanForm({...planForm, goal_cost: e.target.value})} placeholder="e.g. 50000" />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>I want to achieve this in (months)</label>
              <input style={inp} type="number" value={planForm.months} onChange={e => setPlanForm({...planForm, months: e.target.value})} placeholder="e.g. 3" min="1" max="60" />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>I already have saved (₹) — optional</label>
              <input style={inp} type="number" value={planForm.already_saved} onChange={e => setPlanForm({...planForm, already_saved: e.target.value})} placeholder="e.g. 5000 or 0" />
            </div>
          </div>

          {planError && (
            <div style={{ background:'rgba(255,94,122,.1)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r2)', padding:'10px 14px', color:'var(--red)', fontSize:13, marginBottom:12 }}>
              ⚠️ {planError}
            </div>
          )}

          <button onClick={handleGeneratePlan} disabled={planLoading} style={{
            display:'flex', alignItems:'center', gap:8,
            background: planLoading ? 'var(--bg4)' : 'var(--accent)',
            color:'white', border:'none', borderRadius:'var(--r2)',
            padding:'11px 24px', fontSize:14, cursor: planLoading ? 'not-allowed' : 'pointer',
            fontWeight:500, transition:'all .2s'
          }}>
            {planLoading ? '⏳ Analyzing your spending...' : '🤖 Generate My Budget Plan'}
          </button>

          {/* Plan Result */}
          {planResult && (
            <div style={{ marginTop:20 }}>
              {!planResult.is_feasible && (
                <div style={{ background:'rgba(255,94,122,.1)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--red)', fontWeight:600, marginBottom:8 }}>
                    <AlertTriangle size={16} /> Goal Not Feasible in {planResult.months} months
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8 }}>
                    You need <strong style={{ color:'var(--red)' }}>₹{planResult.monthly_savings_needed?.toLocaleString()}/month</strong> but your capacity is only <strong style={{ color:'var(--amber)' }}>₹{planResult.avg_monthly_savings?.toLocaleString()}/month</strong>
                    {planResult.min_months_needed && (
                      <><br/>  Minimum time needed: <strong style={{ color:'var(--green)' }}>{planResult.min_months_needed} months</strong></>
                    )}
                  </div>
                </div>
              )}

              {planResult.conflict?.detected && (
                <div style={{ background:'rgba(255,181,69,.1)', border:'1px solid rgba(255,181,69,.2)', borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--amber)', fontWeight:600, marginBottom:8 }}>
                    <AlertTriangle size={16} /> Conflict with Existing Goals Detected
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8, marginBottom:10 }}>
                    Combined needed: <strong style={{ color:'var(--red)' }}>₹{planResult.conflict.combined_needed?.toLocaleString()}</strong><br/>
                    Your capacity: <strong style={{ color:'var(--green)' }}>₹{planResult.conflict.max_capacity?.toLocaleString()}</strong><br/>
                    Shortfall: <strong style={{ color:'var(--red)' }}>₹{planResult.conflict.shortfall?.toLocaleString()}</strong>
                  </div>
                  {planResult.conflict.options?.map((opt, i) => (
                    <div key={i} style={{ fontSize:13, color:'var(--text2)', padding:'4px 0' }}>
                      <span style={{ color:'var(--accent2)' }}>Option {i+1}:</span> {opt}
                    </div>
                  ))}
                </div>
              )}

              {planResult.already_saves_enough && (
                <div style={{ background:'rgba(34,211,160,.1)', border:'1px solid rgba(34,211,160,.2)', borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--green)', fontWeight:600, marginBottom:8 }}>
                    <CheckCircle size={16} /> Great News — You Are Already On Track!
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8 }}>
                    You save <strong style={{ color:'var(--green)' }}>₹{planResult.avg_monthly_savings?.toLocaleString()}/month</strong>. You only need <strong style={{ color:'var(--accent2)' }}>₹{planResult.monthly_savings_needed?.toLocaleString()}/month</strong>.<br/>
                    <strong style={{ color:'var(--green)' }}>No budget changes needed!</strong> Goal achievable by <strong style={{ color:'var(--accent2)' }}>{planResult.target_date}</strong> 🎉
                  </div>
                </div>
              )}

              <div style={{ background:'rgba(34,211,160,.08)', border:'1px solid rgba(34,211,160,.15)', borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:12, color:'var(--green)' }}>
                  📋 Budget Plan to {planResult.goal_name} in {planResult.months} months
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  <div style={{ textAlign:'center', padding:'8px', background:'rgba(255,255,255,.04)', borderRadius:'var(--r2)' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>GOAL COST</div>
                    <div style={{ fontSize:16, fontWeight:600, fontFamily:'DM Mono,monospace' }}>₹{planResult.goal_cost?.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:'center', padding:'8px', background:'rgba(255,255,255,.04)', borderRadius:'var(--r2)' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>SAVE PER MONTH</div>
                    <div style={{ fontSize:16, fontWeight:600, fontFamily:'DM Mono,monospace', color:'var(--accent2)' }}>₹{planResult.monthly_savings_needed?.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:'center', padding:'8px', background:'rgba(255,255,255,.04)', borderRadius:'var(--r2)' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>TARGET DATE</div>
                    <div style={{ fontSize:16, fontWeight:600, color:'var(--green)' }}>{planResult.target_date}</div>
                  </div>
                </div>
              </div>

              <div style={{ background:'var(--bg3)', borderRadius:'var(--r)', overflow:'hidden', marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', padding:'10px 16px', background:'var(--bg4)', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.5, fontWeight:600 }}>
                  <span>Category</span><span>Current Avg</span><span>Suggested</span><span>Change</span>
                </div>
                {Object.entries(planResult.suggested_budgets).map(([cat, data]) => (
                  <div key={cat} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', padding:'12px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:500 }}>
                      <span>{CAT_ICONS[cat] || '💰'}</span><span>{cat}</span>
                      {data.is_fixed && <span style={{ fontSize:10, background:'rgba(255,255,255,.08)', padding:'2px 6px', borderRadius:10, color:'var(--text3)' }}>FIXED</span>}
                    </div>
                    <div style={{ fontSize:13, color:'var(--text2)', fontFamily:'DM Mono,monospace' }}>₹{data.current_avg?.toLocaleString()}</div>
                    <div style={{ fontSize:13, fontFamily:'DM Mono,monospace', fontWeight:600, color: data.change < 0 ? 'var(--amber)' : data.change > 0 ? 'var(--green)' : 'var(--text2)' }}>₹{data.suggested?.toLocaleString()}</div>
                    <div style={{ fontSize:13, color: data.change < 0 ? 'var(--red)' : data.change > 0 ? 'var(--green)' : 'var(--text3)', fontFamily:'DM Mono,monospace' }}>
                      {data.is_fixed ? '🔒' : data.change === 0 ? '→ Same' : data.change < 0 ? `↓ ₹${Math.abs(data.change).toLocaleString()}` : `↑ ₹${data.change.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:12, color:'var(--text3)', background:'var(--bg3)', borderRadius:'var(--r2)', padding:'10px 14px', marginBottom:16, lineHeight:1.7 }}>
                ⚠️ <strong style={{ color:'var(--text2)' }}>This is a suggestion only.</strong> Based on your last {planResult.data_based_on_months} months of data.
              </div>

              {applied && (
                <div style={{ background:'rgba(34,211,160,.1)', border:'1px solid rgba(34,211,160,.2)', borderRadius:'var(--r2)', padding:'12px 16px', color:'var(--green)', fontSize:14, fontWeight:500, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle size={16} /> Budget plan applied for {MONTH}!
                </div>
              )}

              {applyConfirm && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:20, marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>Confirm Apply Budget Plan</div>
                  <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.7 }}>
                    This will overwrite existing budgets for <strong style={{ color:'var(--text)' }}>{MONTH}</strong>. Are you sure?
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={handleApplyPlan} style={{ background:'var(--green)', color:'#000', border:'none', borderRadius:'var(--r2)', padding:'10px 20px', fontSize:14, cursor:'pointer', fontWeight:600 }}>  Yes Apply Plan</button>
                    <button onClick={() => setApplyConfirm(false)} style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'10px 16px', fontSize:14, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {!applied && !applyConfirm && (
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setApplyConfirm(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'11px 20px', fontSize:14, cursor:'pointer', fontWeight:500 }}>  Apply This Plan</button>
                  <button onClick={() => { setPlanResult(null); setApplied(false) }} style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'11px 16px', fontSize:14, cursor:'pointer' }}>Dismiss</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category budget bars */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:24 }}>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>
          💡 Showing spending for <strong style={{ color:'var(--text)' }}>{monthLabel}</strong> only. Click any category to set or edit its budget.
        </div>
        {DEFAULT_CATS.map(cat => {
          const budget   = getBudgetAmt(cat)
          const spentAmt = spent[cat] || 0
          return (
            <div key={cat}>
              {editing === cat ? (
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, background:'var(--bg3)', padding:'14px 16px', borderRadius:'var(--r)', border:'1px solid var(--border2)' }}>
                  <div style={{ fontSize:18 }}>{CAT_ICONS[cat]}</div>
                  <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{cat}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, color:'var(--text3)' }}>₹</span>
                    <input
                      style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'9px 12px', color:'var(--text)', fontSize:14, outline:'none', width:160, fontFamily:'DM Mono,monospace' }}
                      value={editVal} onChange={e => setEditVal(e.target.value)}
                      type="number" placeholder="Enter budget amount"
                      autoFocus onKeyDown={e => e.key === 'Enter' && save(cat)} />
                  </div>
                  <button onClick={() => save(cat)} style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }}>Save</button>
                  <button onClick={() => setEditing(null)} style={{ background:'var(--bg4)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'9px 14px', cursor:'pointer', fontSize:14 }}>Cancel</button>
                </div>
              ) : (
                <div onClick={() => { setEditing(cat); setEditVal(budget || '') }} style={{ cursor:'pointer' }} title="Click to edit budget">
                  {budget === 0 ? (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'8px 0' }}>
                      <span style={{ fontSize:14, fontWeight:500 }}>{CAT_ICONS[cat]} {cat}</span>
                      <span style={{ fontSize:12, color:'var(--accent2)' }}>+ Click to set budget</span>
                    </div>
                  ) : (
                    <BudgetBar category={`${CAT_ICONS[cat]} ${cat}`} budget={budget} spent={spentAmt} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}