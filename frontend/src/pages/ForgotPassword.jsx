import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOTP, resetPassword } from '../api/client'

// step: 1 = enter email, 2 = enter OTP, 3 = set new password, 4 = success

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '13px 16px',
    color: '#e8eaf0',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box',
  }

  const btnPrimary = {
    width: '100%',
    background: 'linear-gradient(135deg,#6c63ff,#8b84ff)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError('')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim())           { setError('Please enter your email'); return }
    if (!emailRegex.test(email)) { setError('Please enter a valid email'); return }
    setLoading(true)
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() })
      setMessage(res.data.message)
      setStep(2)
    } catch(e) {
      setError(e.response?.data?.detail || 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    setError('')
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('OTP must be exactly 6 digits')
      return
    }
    setLoading(true)
    try {
      const res = await verifyOTP({ email: email.trim().toLowerCase(), otp })
      setMessage(res.data.message)
      setStep(3)
    } catch(e) {
      setError(e.response?.data?.detail || 'Invalid or expired OTP')
    }
    setLoading(false)
  }

  // ── Step 3: Set new password ───────────────────────────────────────────────
  const handleSetPassword = async () => {
    setError('')
    if (password.length < 6)      { setError('Password must be at least 6 characters'); return }
    if (password !== password2)   { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await resetPassword({ email: email.trim().toLowerCase(), password })
      setMessage(res.data.message)
      setStep(4)
    } catch(e) {
      setError(e.response?.data?.detail || 'Could not reset password. Try again.')
    }
    setLoading(false)
  }

  const stepLabels = ['Send OTP', 'Verify OTP', 'New Password']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, justifyContent:'center' }}>
          <div style={{
            width:40, height:40,
            background:'linear-gradient(135deg,#6c63ff,#26d9c9)',
            borderRadius:12, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:20
          }}>💰</div>
          <span style={{ fontSize:20, fontWeight:700, color:'#e8eaf0', letterSpacing:-0.5 }}>MoneyMap</span>
        </div>

        {/* Card */}
        <div style={{
          background:'#1a1d2e',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:16,
          padding:32,
        }}>

          {/* Step indicators */}
          {step < 4 && (
            <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
              {stepLabels.map((label, i) => {
                const num      = i + 1
                const done     = step > num
                const active   = step === num
                const dotColor = done ? '#22d3a0' : active ? '#6c63ff' : 'rgba(255,255,255,0.12)'
                const txtColor = done || active ? '#e8eaf0' : '#5c6278'
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{
                        width:28, height:28, borderRadius:'50%',
                        background: dotColor,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, color: done || active ? '#fff' : '#5c6278',
                        transition:'all .3s'
                      }}>
                        {done ? '✓' : num}
                      </div>
                      <span style={{ fontSize:10, color:txtColor, whiteSpace:'nowrap' }}>{label}</span>
                    </div>
                    {i < 2 && (
                      <div style={{
                        flex:1, height:1, margin:'0 8px 14px',
                        background: step > num + 1 ? '#22d3a0' : 'rgba(255,255,255,0.1)',
                        transition:'all .3s'
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#e8eaf0', marginBottom:6 }}>Forgot Password</h2>
              <p style={{ fontSize:14, color:'#9198b0', marginBottom:24, lineHeight:1.6 }}>
                Enter your registered email. We'll send you a 6-digit OTP.
              </p>
              <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Email Address</label>
              <input
                style={inp}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                placeholder="your@email.com"
                autoFocus
              />
              {error && <ErrorBox msg={error} />}
              <button onClick={handleSendOTP} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Sending OTP...' : 'Send OTP →'}
              </button>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#e8eaf0', marginBottom:6 }}>Enter OTP</h2>
              <p style={{ fontSize:14, color:'#9198b0', marginBottom:6, lineHeight:1.6 }}>
                A 6-digit OTP was sent to <strong style={{ color:'#8b84ff' }}>{email}</strong>
              </p>
              <p style={{ fontSize:12, color:'#5c6278', marginBottom:24 }}>Check your inbox and spam folder. Valid for 10 minutes.</p>
              <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>6-Digit OTP</label>
              <input
                style={{ ...inp, letterSpacing:8, fontSize:22, textAlign:'center', fontFamily:'DM Mono,monospace' }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                placeholder="······"
                autoFocus
              />
              {error && <ErrorBox msg={error} />}
              <button onClick={handleVerifyOTP} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Verifying...' : 'Verify OTP →'}
              </button>
              <button
                onClick={() => { setStep(1); setOtp(''); setError('') }}
                style={{ width:'100%', background:'none', border:'none', color:'#5c6278', fontSize:13, marginTop:12, cursor:'pointer' }}>
                ← Back / Resend OTP
              </button>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#e8eaf0', marginBottom:6 }}>Set New Password</h2>
              <p style={{ fontSize:14, color:'#9198b0', marginBottom:24, lineHeight:1.6 }}>
                Choose a strong password (at least 6 characters).
              </p>
              <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>New Password</label>
              <input
                style={{ ...inp, marginBottom:14 }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoFocus
              />
              <label style={{ fontSize:12, color:'#5c6278', display:'block', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:.5 }}>Confirm Password</label>
              <input
                style={inp}
                type="password"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                placeholder="Repeat password"
              />
              {error && <ErrorBox msg={error} />}
              <button onClick={handleSetPassword} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Saving...' : '🔐 Reset Password'}
              </button>
            </>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#22d3a0', marginBottom:8 }}>Password Reset!</h2>
              <p style={{ fontSize:14, color:'#9198b0', marginBottom:28, lineHeight:1.7 }}>
                Your password has been updated successfully.<br />You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ ...btnPrimary, marginTop:0 }}>
                → Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Back to login link */}
        {step < 4 && (
          <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#5c6278' }}>
            Remember your password?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{ color:'#8b84ff', cursor:'pointer', fontWeight:500 }}>
              Back to Login
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background:'rgba(255,94,122,0.1)',
      border:'1px solid rgba(255,94,122,0.25)',
      borderRadius:8,
      padding:'10px 14px',
      color:'#ff5e7a',
      fontSize:13,
      marginTop:12,
    }}>
      ⚠️ {msg}
    </div>
  )
}
