import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, CreditCard,
  PieChart, Target, Sparkles, FileText,
  LogOut, Sun, Moon, User, Menu, X
} from 'lucide-react'

const links = [
  { to:'/dashboard',    icon: LayoutDashboard, label:'Dashboard' },
  { to:'/analytics',    icon: TrendingUp,       label:'Analytics' },
  { to:'/transactions', icon: CreditCard,       label:'Transactions' },
  { to:'/budget',       icon: PieChart,         label:'Budget' },
  { to:'/forecast',     icon: Target,           label:'Forecast & Goals' },
  { to:'/insights',     icon: Sparkles,         label:'AI Insights' },
  { to:'/reports',      icon: FileText,         label:'Reports' },
]

// Bottom nav shows only the most important 5 links on mobile
const bottomLinks = [
  { to:'/dashboard',    icon: LayoutDashboard, label:'Home' },
  { to:'/transactions', icon: CreditCard,       label:'Txns' },
  { to:'/budget',       icon: PieChart,         label:'Budget' },
  { to:'/forecast',     icon: Target,           label:'Goals' },
  { to:'/insights',     icon: Sparkles,         label:'Insights' },
]

export default function Sidebar({ theme, toggleTheme }) {
  const navigate        = useNavigate()
  const [open, setOpen] = useState(false)
  const user            = JSON.parse(localStorage.getItem('user') || '{}')
  const initials        = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const close = () => setOpen(false)

  // ── Shared sidebar content (used in both desktop + mobile drawer) ────────
  const SidebarContent = () => (
    <aside className="sidebar-drawer" style={{
      width: 220,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
      overflowY: 'auto',
      height: '100vh',
    }}
    // Add open class for mobile
    ref={el => {
      if (el) {
        if (open) el.classList.add('open')
        else el.classList.remove('open')
      }
    }}>

      {/* Logo + theme toggle + close button (mobile) */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px 28px' }}>
        <div style={{
          width:34, height:34,
          background:'linear-gradient(135deg,#6c63ff,#26d9c9)',
          borderRadius:10, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:18, flexShrink:0
        }}>💰</div>
        <span style={{ fontSize:16, fontWeight:600, letterSpacing:-0.3, flex:1 }}>MoneyMap</span>
        <button onClick={toggleTheme}
          style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'5px 7px', cursor:'pointer', color:'var(--text2)', display:'flex', alignItems:'center' }}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {/* Close button — only visible on mobile */}
        <button onClick={close} className="mobile-only"
          style={{ display:'none', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'5px 7px', cursor:'pointer', color:'var(--text2)', alignItems:'center', marginLeft:2 }}>
          <X size={14} />
        </button>
      </div>

      {/* Nav links */}
      <div style={{ flex:1 }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={close}>
            {({ isActive }) => (
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 10px', borderRadius:'var(--r2)',
                marginBottom:2, cursor:'pointer',
                color:      isActive ? 'var(--accent2)' : 'var(--text2)',
                background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                fontSize:14, transition:'all .2s',
                fontWeight: isActive ? 500 : 400,
                textDecoration:'none'
              }}>
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* User card + logout */}
      <div style={{ paddingTop:16, borderTop:'1px solid var(--border)' }}>
        <div onClick={() => { navigate('/profile'); close() }}
          style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px', background:'var(--bg3)',
            borderRadius:'var(--r2)', marginBottom:8, cursor:'pointer'
          }}>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'linear-gradient(135deg,#6c63ff,#f06292)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:600, color:'white', flexShrink:0
          }}>{initials}</div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user.name || 'User'}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user.email || ''}
            </div>
          </div>
          <User size={13} color='var(--text3)' />
        </div>

        <button onClick={handleLogout} style={{
          width:'100%', display:'flex', alignItems:'center',
          justifyContent:'center', gap:8,
          background:'rgba(255,94,122,0.08)',
          color:'var(--red)', border:'1px solid rgba(255,94,122,0.15)',
          borderRadius:'var(--r2)', padding:'8px',
          fontSize:13, cursor:'pointer', fontWeight:500, transition:'all .2s'
        }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible on ≥769px) ── */}
      <aside className="desktop-only" style={{
        width: 220,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        {/* Logo + theme */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px 28px' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#6c63ff,#26d9c9)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💰</div>
          <span style={{ fontSize:16, fontWeight:600, letterSpacing:-0.3, flex:1 }}>MoneyMap</span>
          <button onClick={toggleTheme}
            style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'5px 7px', cursor:'pointer', color:'var(--text2)', display:'flex', alignItems:'center' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Nav links */}
        <div style={{ flex:1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 10px', borderRadius:'var(--r2)', marginBottom:2,
                  cursor:'pointer',
                  color:      isActive ? 'var(--accent2)' : 'var(--text2)',
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                  fontSize:14, transition:'all .2s',
                  fontWeight: isActive ? 500 : 400, textDecoration:'none'
                }}>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* User card */}
        <div style={{ paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <div onClick={() => navigate('/profile')}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'var(--bg3)', borderRadius:'var(--r2)', marginBottom:8, cursor:'pointer' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#f06292)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'white', flexShrink:0 }}>{initials}</div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name || 'User'}</div>
              <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email || ''}</div>
            </div>
            <User size={13} color='var(--text3)' />
          </div>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(255,94,122,0.08)', color:'var(--red)', border:'1px solid rgba(255,94,122,0.15)', borderRadius:'var(--r2)', padding:'8px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setOpen(true)}
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'7px 9px', cursor:'pointer', color:'var(--text)', display:'flex', alignItems:'center' }}>
            <Menu size={18} />
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg,#6c63ff,#26d9c9)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>💰</div>
            <span style={{ fontSize:15, fontWeight:600 }}>MoneyMap</span>
          </div>
        </div>
        <button onClick={toggleTheme}
          style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'7px 9px', cursor:'pointer', color:'var(--text2)', display:'flex', alignItems:'center' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={close} />

      {/* ── Mobile drawer sidebar ── */}
      <aside style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        width: 260,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        overflowY: 'auto',
        zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        // Only shown on mobile via JS transform; CSS hides on desktop via media query below
      }} className="mobile-sidebar">

        {/* Logo + close */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px 28px' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#6c63ff,#26d9c9)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💰</div>
          <span style={{ fontSize:16, fontWeight:600, letterSpacing:-0.3, flex:1 }}>MoneyMap</span>
          <button onClick={close}
            style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'5px 7px', cursor:'pointer', color:'var(--text2)', display:'flex', alignItems:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ flex:1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={close}>
              {({ isActive }) => (
                <div style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'11px 12px', borderRadius:'var(--r2)', marginBottom:3,
                  cursor:'pointer',
                  color:      isActive ? 'var(--accent2)' : 'var(--text2)',
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                  fontSize:15, transition:'all .2s',
                  fontWeight: isActive ? 500 : 400, textDecoration:'none'
                }}>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* User + logout */}
        <div style={{ paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <div onClick={() => { navigate('/profile'); close() }}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'var(--bg3)', borderRadius:'var(--r2)', marginBottom:8, cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#f06292)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'white', flexShrink:0 }}>{initials}</div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name || 'User'}</div>
              <div style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email || ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(255,94,122,0.08)', color:'var(--red)', border:'1px solid rgba(255,94,122,0.15)', borderRadius:'var(--r2)', padding:'10px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Bottom navigation bar (mobile only) ── */}
      <nav className="bottom-nav">
        {bottomLinks.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}