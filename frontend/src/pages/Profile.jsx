import { useState } from 'react'
import { updateProfile } from '../api/client'
import { User, Mail, Lock, CheckCircle } from 'lucide-react'

export default function Profile() {
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'

  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', current_password: '', new_password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  const inp = {
    background:'var(--bg3)', border:'1px solid var(--border2)',
    borderRadius:'var(--r2)', padding:'10px 12px',
    color:'var(--text)', fontSize:14, outline:'none',
    width:'100%', fontFamily:'DM Sans,sans-serif'
  }

  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!form.name.trim()) { setError('Name cannot be empty'); return }
    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email }
      if (form.new_password) {
        payload.current_password = form.current_password
        payload.new_password     = form.new_password
      }
      const res = await updateProfile(payload)
      const updated = { ...user, name: res.data.name, email: res.data.email }
      localStorage.setItem('user', JSON.stringify(updated))
      setSuccess('Profile updated successfully!')
      setForm(f => ({ ...f, current_password: '', new_password: '' }))
    } catch(e) {
      setError(e.response?.data?.detail || 'Update failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 560, width:'100%' }}>
      <h1 style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>Profile</h1>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>Manage your account details and password</p>

      {/* Avatar card */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20, flexWrap:'wrap' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#f06292)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'white', flexShrink:0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize:16, fontWeight:600 }}>{user.name}</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>{user.email}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
            Member since {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month:'long', year:'numeric' }) : '—'}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:24, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <User size={15} color='var(--accent2)' /> Basic Info
        </div>
        <div style={{ display:'grid', gap:14, marginBottom:20 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Full Name</label>
            <input style={inp} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder='Your name' />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Email</label>
            <input style={inp} type='email' value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder='your@email.com' />
          </div>
        </div>

        <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <Lock size={15} color='var(--accent2)' /> Change Password <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>(optional)</span>
        </div>
        <div style={{ display:'grid', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Current Password</label>
            <input style={inp} type='password' value={form.current_password} onChange={e => setForm({...form, current_password: e.target.value})} placeholder='Enter current password' />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>New Password</label>
            <input style={inp} type='password' value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} placeholder='Min 6 characters' />
          </div>
        </div>
      </div>

      {error   && <div style={{ background:'rgba(255,94,122,.1)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r2)', padding:'10px 14px', color:'var(--red)', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}
      {success && <div style={{ background:'rgba(34,211,160,.1)', border:'1px solid rgba(34,211,160,.2)', borderRadius:'var(--r2)', padding:'10px 14px', color:'var(--green)', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><CheckCircle size={14} /> {success}</div>}

      <button onClick={handleSave} disabled={loading}
        style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'11px 28px', fontSize:14, cursor: loading ? 'not-allowed' : 'pointer', fontWeight:500, opacity: loading ? .7 : 1, width:'100%' }}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}