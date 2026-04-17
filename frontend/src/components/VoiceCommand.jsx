import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSummary, getByCategory, getTransactions } from '../api/client'
import { Mic, MicOff, X } from 'lucide-react'

export default function VoiceCommand({ onAddExpense }) {
  const navigate  = useNavigate()
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback]     = useState('')
  const [feedbackType, setFeedbackType] = useState('info')
  const [supported, setSupported]   = useState(true)
  const [history, setHistory]       = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const recognitionRef = useRef(null)

  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang  = 'en-IN'
    utterance.rate  = 0.95
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setSupported(false); return }

    const recognition          = new SpeechRecognition()
    recognition.continuous     = false
    recognition.interimResults = false
    recognition.lang           = 'en-IN'

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase().trim()
      setTranscript(text)
      handleCommand(text)
    }
    recognition.onend   = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      showFeedback('Could not hear. Try again.', 'error')
    }

    recognitionRef.current = recognition
  }, [])

  const addToHistory = (command, result) => {
    setHistory(prev => [
      { command, result, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9)
    ])
  }

  const showFeedback = (msg, type = 'info') => {
    setFeedback(msg)
    setFeedbackType(type)
    setTimeout(() => { setFeedback(''); setTranscript('') }, 3000)
  }

  const handleCommand = async (text) => {
    addToHistory(text, 'Processing...')

    // ── NAVIGATION ──────────────────────────────────────────
    if (text.includes('dashboard') || text.includes('home')) {
      navigate('/dashboard')
      showFeedback('📊 Opening Dashboard', 'success')
      speak('Opening Dashboard')

    } else if (text.includes('transaction')) {
      navigate('/transactions')
      showFeedback('💳 Opening Transactions', 'success')
      speak('Opening Transactions')

    } else if (text.includes('analytic') || text.includes('analysis')) {
      navigate('/analytics')
      showFeedback('📈 Opening Analytics', 'success')
      speak('Opening Analytics')

    } else if (text.includes('budget')) {
      navigate('/budget')
      showFeedback('💰 Opening Budget', 'success')
      speak('Opening Budget')

    } else if (text.includes('forecast') || text.includes('goal') || text.includes('prediction')) {
      navigate('/forecast')
      showFeedback('🔮 Opening Forecast & Goals', 'success')
      speak('Opening Forecast and Goals')

    } else if (text.includes('insight') || text.includes('ai')) {
      navigate('/insights')
      showFeedback('✨ Opening AI Insights', 'success')
      speak('Opening AI Insights')

    } else if (text.includes('report')) {
      navigate('/reports')
      showFeedback('📄 Opening Reports', 'success')
      speak('Opening Reports')

    // ── READ DATA OUT LOUD ───────────────────────────────────
    } else if (
      text.includes('savings rate') ||
      text.includes('saving rate') ||
      text.includes('how much am i saving')
    ) {
      try {
        const res  = await getSummary()
        const rate = res.data.savings_rate
        const msg  = `Your savings rate is ${rate} percent`
        showFeedback(`📊 Savings rate: ${rate}%`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('total income') ||
      text.includes('how much income') ||
      text.includes('my income')
    ) {
      try {
        const res    = await getSummary()
        const income = res.data.total_income?.toLocaleString()
        const msg    = `Your total income is rupees ${income}`
        showFeedback(`💚 Total income: ₹${income}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('total expense') ||
      text.includes('how much did i spend') ||
      text.includes('my expense') ||
      text.includes('total spending')
    ) {
      try {
        const res     = await getSummary()
        const expense = res.data.total_expense?.toLocaleString()
        const msg     = `Your total expense is rupees ${expense}`
        showFeedback(`🔴 Total expense: ₹${expense}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('net saving') ||
      text.includes('how much saved') ||
      text.includes('total saved') ||
      text.includes('my savings')
    ) {
      try {
        const res     = await getSummary()
        const savings = res.data.net_savings?.toLocaleString()
        const msg     = `Your net savings is rupees ${savings}`
        showFeedback(`💜 Net savings: ₹${savings}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('how many transaction') ||
      text.includes('transaction count') ||
      text.includes('number of transaction')
    ) {
      try {
        const res   = await getTransactions()
        const count = res.data.length
        const msg   = `You have ${count} transactions in total`
        showFeedback(`💳 Total transactions: ${count}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on food') ||
      text.includes('food spending') ||
      text.includes('food expense')
    ) {
      try {
        const res  = await getByCategory(true)
        const food = res.data.find(d => d.category === 'Food')
        const msg  = food
          ? `You spent rupees ${food.total?.toLocaleString()} on food`
          : `No food expenses found`
        showFeedback(`🍔 Food spending: ₹${food?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on rent') ||
      text.includes('rent expense') ||
      text.includes('rent amount')
    ) {
      try {
        const res  = await getByCategory(true)
        const rent = res.data.find(d => d.category === 'Rent')
        const msg  = rent
          ? `You spent rupees ${rent.total?.toLocaleString()} on rent`
          : `No rent expenses found`
        showFeedback(`🏠 Rent spending: ₹${rent?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on transport') ||
      text.includes('transport expense') ||
      text.includes('travel expense')
    ) {
      try {
        const res       = await getByCategory(true)
        const transport = res.data.find(d => d.category === 'Transport')
        const msg       = transport
          ? `You spent rupees ${transport.total?.toLocaleString()} on transport`
          : `No transport expenses found`
        showFeedback(`🚗 Transport: ₹${transport?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on shopping') ||
      text.includes('shopping expense')
    ) {
      try {
        const res      = await getByCategory(true)
        const shopping = res.data.find(d => d.category === 'Shopping')
        const msg      = shopping
          ? `You spent rupees ${shopping.total?.toLocaleString()} on shopping`
          : `No shopping expenses found`
        showFeedback(`🛍️ Shopping: ₹${shopping?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on health') ||
      text.includes('health expense') ||
      text.includes('medical expense')
    ) {
      try {
        const res    = await getByCategory(true)
        const health = res.data.find(d => d.category === 'Health')
        const msg    = health
          ? `You spent rupees ${health.total?.toLocaleString()} on health`
          : `No health expenses found`
        showFeedback(`💊 Health: ₹${health?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on entertainment') ||
      text.includes('entertainment expense')
    ) {
      try {
        const res           = await getByCategory(true)
        const entertainment = res.data.find(d => d.category === 'Entertainment')
        const msg           = entertainment
          ? `You spent rupees ${entertainment.total?.toLocaleString()} on entertainment`
          : `No entertainment expenses found`
        showFeedback(`🎬 Entertainment: ₹${entertainment?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    } else if (
      text.includes('spent on utilities') ||
      text.includes('utilities expense') ||
      text.includes('electricity bill')
    ) {
      try {
        const res       = await getByCategory(true)
        const utilities = res.data.find(d => d.category === 'Utilities')
        const msg       = utilities
          ? `You spent rupees ${utilities.total?.toLocaleString()} on utilities`
          : `No utilities expenses found`
        showFeedback(`💡 Utilities: ₹${utilities?.total?.toLocaleString() || 0}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch data', 'error') }

    // ── FULL SUMMARY ─────────────────────────────────────────
    } else if (
      text.includes('full summary') ||
      text.includes('financial summary') ||
      text.includes('give me summary') ||
      text.includes('summary')
    ) {
      try {
        const res     = await getSummary()
        const d       = res.data
        const msg     = `Your financial summary. Total income rupees ${d.total_income?.toLocaleString()}. Total expense rupees ${d.total_expense?.toLocaleString()}. Net savings rupees ${d.net_savings?.toLocaleString()}. Savings rate ${d.savings_rate} percent.`
        showFeedback(`📊 Summary fetched — listening...`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } catch { showFeedback('Could not fetch summary', 'error') }

    // ── ADD TRANSACTION BY VOICE ─────────────────────────────
    } else if (
      text.includes('add expense') ||
      text.includes('new expense') ||
      text.includes('add income') ||
      text.includes('new income')
    ) {
      const amountMatch = text.match(/\d+/)
      const amount      = amountMatch ? amountMatch[0] : ''

      const categories = ['food','transport','entertainment','health','shopping','utilities','rent','salary','freelance']
      let detectedCat  = ''
      for (const cat of categories) {
        if (text.includes(cat)) { detectedCat = cat; break }
      }

      navigate('/transactions')

      if (amount && detectedCat) {
        const msg = `Adding ${detectedCat} expense of rupees ${amount}`
        showFeedback(`➕ Adding: ₹${amount} — ${detectedCat}`, 'success')
        speak(msg)
        addToHistory(text, msg)
      } else {
        showFeedback('➕ Opening Add Transaction form', 'success')
        speak('Opening add transaction form')
        if (onAddExpense) onAddExpense()
      }

    // ── SCROLL COMMANDS ───────────────────────────────────────
    } else if (text.includes('scroll down') || text.includes('go down')) {
      window.scrollBy({ top: 300, behavior:'smooth' })
      showFeedback('⬇️ Scrolling down', 'info')

    } else if (text.includes('scroll up') || text.includes('go up')) {
      window.scrollBy({ top: -300, behavior:'smooth' })
      showFeedback('⬆️ Scrolling up', 'info')

    } else if (text.includes('scroll to top') || text.includes('go to top') || text.includes('top of page')) {
      window.scrollTo({ top: 0, behavior:'smooth' })
      showFeedback('⬆️ Scrolled to top', 'info')

    } else if (text.includes('scroll to bottom') || text.includes('go to bottom')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' })
      showFeedback('⬇️ Scrolled to bottom', 'info')

    // ── APP CONTROLS ──────────────────────────────────────────
    } else if (text.includes('logout') || text.includes('log out') || text.includes('sign out')) {
      showFeedback('👋 Logging out...', 'info')
      speak('Logging out. Goodbye!')
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }, 1500)

    } else if (text.includes('show history') || text.includes('command history')) {
      setShowHistory(true)
      showFeedback('📋 Showing command history', 'info')

    } else if (text.includes('hide history') || text.includes('close history')) {
      setShowHistory(false)
      showFeedback('📋 History hidden', 'info')

    } else if (text.includes('help') || text.includes('what can you do') || text.includes('commands')) {
      const msg = 'You can say: go to dashboard, go to transactions, go to analytics, go to budget, what is my savings rate, total income, total expense, net savings, how many transactions, spent on food, spent on rent, add expense, scroll up, scroll down, logout, or full summary'
      showFeedback('🎙️ Saying available commands...', 'info')
      speak(msg)
      addToHistory(text, 'Listed available commands')

    } else if (text.includes('stop') || text.includes('cancel') || text.includes('never mind')) {
      window.speechSynthesis?.cancel()
      showFeedback('⏹️ Stopped', 'info')
      addToHistory(text, 'Stopped')

    // ── GREETINGS ─────────────────────────────────────────────
    } else if (
      text.includes('hello') || text.includes('hi') ||
      text.includes('hey') || text.includes('good morning') ||
      text.includes('good evening')
    ) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const msg  = `Hello ${user.name?.split(' ')[0] || 'there'}! How can I help you with your finances today?`
      showFeedback(`👋 Hello ${user.name?.split(' ')[0] || 'there'}!`, 'success')
      speak(msg)
      addToHistory(text, msg)

    // ── UNKNOWN COMMAND ───────────────────────────────────────
    } else {
      showFeedback(`❓ Unknown: "${text}" — say "help" for commands`, 'error')
      speak('Sorry, I did not understand. Say help to hear available commands.')
      addToHistory(text, 'Unknown command')
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      setTranscript('')
      setFeedback('')
      recognitionRef.current.start()
      setListening(true)
    }
  }

  const feedbackColors = {
    success: { bg:'rgba(34,211,160,0.12)',  border:'rgba(34,211,160,0.25)',  color:'#22d3a0' },
    error:   { bg:'rgba(255,94,122,0.12)',  border:'rgba(255,94,122,0.25)',  color:'#ff5e7a' },
    info:    { bg:'rgba(108,99,255,0.12)',  border:'rgba(108,99,255,0.25)',  color:'#8b84ff' },
  }
  const fc = feedbackColors[feedbackType] || feedbackColors.info

  if (!supported) return null

  return (
    <>
      {/* Command history panel */}
      {showHistory && (
        <div style={{
          position:'fixed', bottom:90, right:28,
          background:'#161922', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:14, padding:16, zIndex:1000,
          width:280, maxHeight:300, overflowY:'auto',
          boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          animation:'slideUp .2s ease'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Command History</div>
            <button onClick={() => setShowHistory(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>
              <X size={14} />
            </button>
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'16px 0' }}>No commands yet</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
              <div style={{ color:'var(--text)', marginBottom:2 }}>"{h.command}"</div>
              <div style={{ color:'var(--text3)' }}>{h.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback popup */}
      {(feedback || listening) && (
        <div style={{
          position:'fixed', bottom:92, right:28,
          background:'#161922', border:`1px solid ${fc.border}`,
          borderRadius:12, padding:'12px 16px',
          fontSize:13, zIndex:1000, maxWidth:280,
          boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          animation:'slideUp .2s ease'
        }}>
          {listening && !feedback && (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#ff5e7a' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff5e7a', animation:'pulse 1s infinite' }} />
              Listening... speak now
            </div>
          )}
          {transcript && !feedback && (
            <div style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>
              Heard: "{transcript}"
            </div>
          )}
          {feedback && (
            <div style={{ color: fc.color, fontWeight:500 }}>{feedback}</div>
          )}
        </div>
      )}

      {/* Floating mic button */}
      <div
        onClick={toggleListening}
        title="Voice Commands — say 'help' for list"
        style={{
          position:'fixed', bottom:28, right:28,
          width:52, height:52, borderRadius:'50%',
          background: listening
            ? 'linear-gradient(135deg,#ff5e7a,#ff8c5a)'
            : 'linear-gradient(135deg,#6c63ff,#26d9c9)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', zIndex:1000,
          boxShadow: listening
            ? '0 0 0 8px rgba(255,94,122,0.15), 0 4px 20px rgba(255,94,122,0.3)'
            : '0 4px 20px rgba(108,99,255,0.35)',
          transition:'all .3s',
          animation: listening ? 'pulse 1.2s infinite' : 'none'
        }}>
        {listening ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { transform:scale(1); }
          50% { transform:scale(1.08); }
        }
        @keyframes slideUp {
          from { transform:translateY(10px); opacity:0; }
          to   { transform:translateY(0); opacity:1; }
        }
      `}</style>
    </>
  )
}
