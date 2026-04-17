import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../api/client'
import { TrendingUp, Shield, Bell, Mic } from 'lucide-react'

const features = [
  { icon: TrendingUp, text: 'ML powered 6 month savings forecast' },
  { icon: Shield,     text: 'JWT secured — your data is private' },
  { icon: Bell,       text: 'Smart budget alerts via email' },
  { icon: Mic,        text: 'Voice commands to navigate the app' },
]

export default function Login() {
  const navigate  = useNavigate()
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ name:'', email:'', password:'' })

  const handleSubmit = async () => {
    setError('')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!isLogin && !form.name.trim()) { setError('Please enter your name'); return }
    if (!form.email.trim())            { setError('Please enter your email'); return }
    if (!emailRegex.test(form.email))  { setError('Please enter a valid email like rahul@gmail.com'); return }
    if (!form.password)                { setError('Please enter your password'); return }
    if (!isLogin && form.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      const res = isLogin
        ? await login({ email: form.email.trim().toLowerCase(), password: form.password })
        : await signup({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch(e) {
      setError(e.response?.data?.detail || 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  const inp = {
    width:'100%', background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:10, padding:'13px 16px',
    color:'#e8eaf0', fontSize:15, outline:'none',
    fontFamily:'DM Sans,sans-serif', transition:'border .2s',
    boxSizing:'border-box',
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#0f1117',
      display:'flex', fontFamily:'DM Sans,sans-serif'
    }}>
      {/* Left panel — features */}
      <div style={{
        flex:1, background:'linear-gradient(135deg,#12101f,#1a1535)',
        padding:'48px', display:'flex', flexDirection:'column',
        justifyContent:'center',
        borderRight:'1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
          <div style={{
            width:44, height:44,
            background:'linear-gradient(135deg,#6c63ff,#26d9c9)',
            borderRadius:14, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:22
          }}>💰</div>
          <span style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>MoneyMap</span>
        </div>

        <h2 style={{ fontSize:32, fontWeight:700, letterSpacing:-1, marginBottom:12, lineHeight:1.2 }}>
          Take control of your finances
        </h2>
        <p style={{ fontSize:15, color:'#9198b0', marginBottom:40, lineHeight:1.7 }}>
          Track expenses, predict savings, and reach your financial goals with AI powered analytics.
        </p>

        {/* Feature list */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {features.map(({ icon: Icon, text }, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:14,
              animation:`fadeInUp .4s ease ${i * 0.1}s both`
            }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:'rgba(108,99,255,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0
              }}>
                <Icon size={17} color='#8b84ff' />
              </div>
              <span style={{ fontSize:14, color:'#c0c4d6' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'auto', fontSize:12, color:'#5c6278' }}>
          © 2025 MoneyMap · Built with React + FastAPI + scikit-learn
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width:460, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:48
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <h3 style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h3>
          <p style={{ fontSize:14, color:'#9198b0', marginBottom:28 }}>
            {isLogin ? 'Login to your MoneyMap account' : 'Start your financial journey today'}
          </p>

          {/* Tab switcher */}
          <div style={{
            display:'flex', background:'#1e2230',
            borderRadius:10, padding:4, marginBottom:24
          }}>
            {['Login','Sign Up'].map((tab, i) => (
              <div key={tab} onClick={() => { setIsLogin(i===0); setError('') }} style={{
                flex:1, textAlign:'center', padding:'9px',
                borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:500,
                background: (isLogin ? i===0 : i===1) ? '#2a2f42' : 'transparent',
                color:      (isLogin ? i===0 : i===1) ? '#e8eaf0' : '#9198b0',
                transition:'all .2s'
              }}>{tab}</div>
            ))}
          </div>

          {/* Name field */}
          {!isLogin && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Full Name</label>
              <input style={inp} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Rahul Sharma" />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Email</label>
            <input style={inp} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com" />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isLogin ? 8 : 20 }}>
            <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Password</label>
            <input style={inp} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="minimum 6 characters" onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
          </div>

          {/* Forgot Password link — only on login tab */}
          {isLogin && (
            <div style={{ textAlign:'right', marginBottom:20 }}>
              <span
                onClick={() => navigate('/forgot-password')}
                style={{ fontSize:13, color:'#8b84ff', cursor:'pointer', fontWeight:500 }}>
                Forgot password?
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background:'rgba(255,94,122,0.1)', border:'1px solid rgba(255,94,122,0.2)',
              borderRadius:8, padding:'10px 14px', color:'#ff5e7a',
              fontSize:13, marginBottom:16
            }}>⚠️ {error}</div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width:'100%',
            background: loading ? '#4a4580' : 'linear-gradient(135deg,#6c63ff,#8b84ff)',
            color:'white', border:'none', borderRadius:10,
            padding:'13px', fontSize:15, fontWeight:600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all .2s', letterSpacing:.3
          }}>
            {loading ? '⏳ Please wait...' : isLogin ? '→ Login' : '→ Create Account'}
          </button>

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#9198b0' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={()=>{setIsLogin(!isLogin);setError('')}} style={{ color:'#8b84ff', cursor:'pointer', fontWeight:500 }}>
              {isLogin ? 'Sign Up' : 'Login'}
            </span>
          </div>

          <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:'#5c6278' }}>
            🔒 Your data is private and secured with JWT
          </div>
        </div>
      </div>
    </div>
  )
}