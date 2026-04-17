import { useEffect, useState } from 'react'
import { getSmartInsights, getAnomalies, parseSMS, checkBudgetAlerts, setupEmail } from '../api/client'

export default function Insights() {
  const [insights, setInsights]     = useState([])
  const [anomalies, setAnomalies]   = useState([])
  const [alerts, setAlerts]         = useState([])
  const [sms, setSms]               = useState('')
  const [smsResult, setSmsResult]   = useState(null)
  const [smsError, setSmsError]     = useState('')
  const [email, setEmail]           = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    getSmartInsights().then(r => setInsights(r.data.insights || [])).catch(() => {})
    getAnomalies().then(r => setAnomalies(r.data.anomalies || [])).catch(() => {})
    checkBudgetAlerts().then(r => setAlerts(r.data.alerts || [])).catch(() => {})
  }, [])

  const handleSMSParse = async () => {
    if (!sms.trim()) return
    setSmsError('')
    setSmsResult(null)
    try {
      const r = await parseSMS({ sms })
      if (r.data.error) {
        setSmsError(r.data.error)
      } else {
        setSmsResult(r.data)
        setSms('')
      }
    } catch(e) {
      setSmsError(e.response?.data?.detail || 'Could not parse SMS')
    }
  }

  const handleEmailSave = async () => {
    setEmailError('')
    setEmailSaved(false)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    try {
      await setupEmail({ email: email.trim(), enabled: true })
      setEmailSaved(true)
    } catch(e) {
      setEmailError(e.response?.data?.detail || 'Could not save email. Try again.')
    }
  }

  const inp = {
    background:'var(--bg3)', border:'1px solid var(--border2)',
    borderRadius:'var(--r2)', padding:'10px 12px',
    color:'var(--text)', fontSize:14, outline:'none', width:'100%'
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:600 }}>AI Insights ✨</h1>
        <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>Smart analysis powered by real data</p>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding:'12px 16px', borderRadius:'var(--r2)', marginBottom:8,
              display:'flex', alignItems:'center', gap:10, fontSize:13,
              background: a.status === 'exceeded' ? 'rgba(255,94,122,.1)' : 'rgba(255,181,69,.1)',
              border: `1px solid ${a.status === 'exceeded' ? 'rgba(255,94,122,.2)' : 'rgba(255,181,69,.2)'}`,
              color: a.status === 'exceeded' ? 'var(--red)' : 'var(--amber)'
            }}>
              {a.status === 'exceeded' ? '🚨' : '⚠️'}
              <strong>{a.category}</strong> budget is at {a.percentage}% — ₹{a.spent.toLocaleString()} of ₹{a.budget.toLocaleString()}
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Smart Insights */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>💬 Smart Insights</div>
          {insights.length === 0
            ? <p style={{ color:'var(--text3)', fontSize:13 }}>Add more transactions to see AI insights.</p>
            : insights.map((ins, i) => (
              <div key={i} style={{ background:'var(--bg3)', borderRadius:'var(--r2)', padding:'12px 14px', marginBottom:10, display:'flex', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ins.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{ins.title}</div>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{ins.text}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Anomalies */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>🚨 Spending Anomalies</div>
          {anomalies.length === 0
            ? <p style={{ color:'var(--text3)', fontSize:13 }}>No anomalies detected. Your spending is consistent!</p>
            : anomalies.map(a => (
              <div key={a.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{a.description}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{a.category} · {a.date}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'var(--red)', fontFamily:'DM Mono,monospace' }}>₹{a.amount.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:'var(--amber)' }}>z-score: {a.z_score}</div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* SMS Parser */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>📱 Bank SMS Parser</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Paste a bank SMS and auto-add the transaction</div>
          <textarea
            style={{ ...inp, height:90, resize:'vertical' }}
            value={sms}
            onChange={e => setSms(e.target.value)}
            placeholder="e.g. Rs.500 debited from your account at Swiggy on 22-03-2026"
          />
          <button
            onClick={handleSMSParse}
            style={{ marginTop:10, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 20px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
            Parse &amp; Add Transaction
          </button>
          {smsError && (
            <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(255,94,122,.1)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r2)', fontSize:13, color:'var(--red)' }}>
              ⚠️ {smsError}
            </div>
          )}
          {smsResult && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(34,211,160,.1)', border:'1px solid rgba(34,211,160,.2)', borderRadius:'var(--r2)', fontSize:13, color:'var(--green)' }}>
                Added: {smsResult.transaction?.description} — ₹{smsResult.transaction?.amount} ({smsResult.transaction?.category})
            </div>
          )}
        </div>

        {/* Email Alerts */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>📧 Email Budget Alerts</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Get email when budget exceeds 80%</div>
          <input
            style={inp}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailSave()}
            placeholder="your@email.com"
          />
          <button
            onClick={handleEmailSave}
            style={{ marginTop:10, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 20px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
            Save Email
          </button>
          {emailError && (
            <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(255,94,122,.1)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r2)', fontSize:13, color:'var(--red)' }}>
              ⚠️ {emailError}
            </div>
          )}
          {emailSaved && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(34,211,160,.1)', border:'1px solid rgba(34,211,160,.2)', borderRadius:'var(--r2)', fontSize:13, color:'var(--green)' }}>
                Email saved! You will get alerts when any budget is 80%+ used.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}