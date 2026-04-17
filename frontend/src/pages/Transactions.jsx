import { useEffect, useState } from 'react'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, deleteAllTransactions } from '../api/client'
import TransactionItem from '../components/TransactionItem'
import { importCSV } from '../api/client'
import { Upload, FileText } from 'lucide-react'

const expenseCats = ['Food','Transport','Entertainment','Health','Shopping','Utilities','Rent']
const incomeCats  = ['Salary','Freelance','Business','Investment','Other Income']

export default function Transactions() {
  const [txns, setTxns]         = useState([])
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateRange, setDateRange]   = useState('all')
  const [sortBy, setSortBy]     = useState('date')
  const [showForm, setShowForm] = useState(false)
  const [editTxn, setEditTxn]   = useState(null)
  const [csvLoading, setCsvLoading]       = useState(false)
  const [csvResult, setCsvResult]         = useState(null)
  const [showCsvModal, setShowCsvModal]   = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [showDeleteAll, setShowDeleteAll]     = useState(false)
  const [page, setPage]         = useState(1)
  const [dupWarning, setDupWarning] = useState(false)
  const PAGE_SIZE = 10
  const [form, setForm] = useState({
    description:'', amount:'', category:'Salary',
    txn_type:'income', date: new Date().toISOString().split('T')[0], notes:''
  })

  const getDateRange = () => {
    const today = new Date()
    const fmt = d => d.toISOString().split('T')[0]
    if (dateRange === 'this_month') {
      return { from_date: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to_date: fmt(today) }
    }
    if (dateRange === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const last  = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from_date: fmt(first), to_date: fmt(last) }
    }
    if (dateRange === 'last_3') {
      const from = new Date(today); from.setMonth(from.getMonth() - 3)
      return { from_date: fmt(from), to_date: fmt(today) }
    }
    if (dateRange === 'last_6') {
      const from = new Date(today); from.setMonth(from.getMonth() - 6)
      return { from_date: fmt(from), to_date: fmt(today) }
    }
    return {}
  }

  const load = () => {
    const params = {}
    if (filter)     params.category = filter
    if (search)     params.search   = search
    if (sortBy)     params.sort_by  = sortBy
    if (typeFilter) params.txn_type = typeFilter
    Object.assign(params, getDateRange())
    getTransactions(params).then(r => { setTxns(r.data); setPage(1) })
  }

  useEffect(() => { load() }, [filter, search, sortBy, typeFilter, dateRange])

  const handleTypeChange = (type) => {
    setForm({ ...form, txn_type: type, category: type === 'income' ? 'Salary' : 'Food' })
  }

  const handleEdit = (txn) => {
    setEditTxn(txn)
    setForm({
      description: txn.description,
      amount: txn.amount,
      category: txn.category,
      txn_type: txn.txn_type,
      date: txn.date,
      notes: txn.notes || ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.description || !form.amount) return
    // duplicate check — only on new transactions
    if (!editTxn) {
      const dup = txns.find(t =>
        t.description.toLowerCase() === form.description.toLowerCase() &&
        parseFloat(t.amount) === parseFloat(form.amount) &&
        t.date === form.date
      )
      if (dup && !dupWarning) { setDupWarning(true); return }
    }
    setDupWarning(false)
    if (editTxn) {
      await updateTransaction(editTxn.id, { ...form, amount: parseFloat(form.amount) })
    } else {
      await addTransaction({ ...form, amount: parseFloat(form.amount) })
    }
    setShowForm(false)
    setEditTxn(null)
    setDupWarning(false)
    setForm({ description:'', amount:'', category:'Salary', txn_type:'income', date: new Date().toISOString().split('T')[0], notes:'' })
    load()
  }
  const handleCSVImport = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!file.name.endsWith('.csv')) {
    alert('Please select a CSV file')
    return
  }
  setCsvLoading(true)
  setCsvResult(null)
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await importCSV(formData)
    setCsvResult(res.data)
    setShowCsvModal(true)
    load()
  } catch(e) {
    alert(e.response?.data?.detail || 'CSV import failed')
  }
  setCsvLoading(false)
  e.target.value = ''
}

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    setDeleteConfirmId(null)
    load()
  }

  const handleDeleteAll = async () => {
    await deleteAllTransactions()
    setShowDeleteAll(false)
    load()
  }

  const paginated = txns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(txns.length / PAGE_SIZE)

  const cats = form.txn_type === 'income' ? incomeCats : expenseCats
  const inp  = { background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'10px 12px', color:'var(--text)', fontSize:14, outline:'none', width:'100%' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600 }}>Transactions</h1>
          <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>{txns.length} records</p>
        </div>
      <div style={{ display:'flex', gap:10 }}>
  {/* CSV Import button */}
  <label style={{
    display:'flex', alignItems:'center', gap:8,
    background:'var(--bg3)', color:'var(--text2)',
    border:'1px solid var(--border2)', borderRadius:'var(--r2)',
    padding:'9px 16px', fontSize:14, cursor:'pointer', fontWeight:500,
    transition:'all .2s'
  }}>
    {csvLoading
      ? <span style={{ fontSize:12 }}>⏳ Importing...</span>
      : <><Upload size={15} /> Import CSV</>
    }
    <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display:'none' }} disabled={csvLoading} />
  </label>
  <button onClick={() => setShowDeleteAll(true)}
    style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,94,122,.1)', color:'var(--red)', border:'1px solid rgba(255,94,122,.25)', borderRadius:'var(--r2)', padding:'9px 16px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
    🗑 Delete All
  </button>
  <button onClick={()=>{ setEditTxn(null); setShowForm(!showForm) }}
    style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 16px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
    + Add
  </button>
</div>
      </div>

      {/* Type toggle + Date range */}
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <div style={{ display:'flex', background:'var(--bg3)', borderRadius:'var(--r2)', border:'1px solid var(--border)', overflow:'hidden' }}>
          {[['', 'All'], ['income', '📈 Income'], ['expense', '📉 Expense']].map(([val, label]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              style={{ padding:'8px 16px', fontSize:13, border:'none', cursor:'pointer', fontWeight: typeFilter===val ? 600 : 400,
                background: typeFilter===val ? 'var(--accent)' : 'transparent',
                color: typeFilter===val ? '#fff' : 'var(--text2)', transition:'all .2s' }}>
              {label}
            </button>
          ))}
        </div>
        <select style={{ ...inp, width:'auto', flex:1 }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3">Last 3 Months</option>
          <option value="last_6">Last 6 Months</option>
        </select>
      </div>

      {/* Search + Filter + Sort */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        <input style={inp} placeholder="🔍 Search transactions..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={inp} value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {[...expenseCats, ...incomeCats].map(c=><option key={c}>{c}</option>)}
        </select>
        <select style={inp} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="category">Sort by Category</option>
        </select>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:20, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>{editTxn ? '✏️ Edit Transaction' : '+ New Transaction'}</div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <button onClick={()=>handleTypeChange('income')}
              style={{ flex:1, padding:'9px', borderRadius:'var(--r2)', border:'none', cursor:'pointer', fontWeight:600, fontSize:14,
                background: form.txn_type==='income' ? 'var(--green)' : 'var(--bg3)', color: form.txn_type==='income' ? '#000' : 'var(--text2)' }}>
              + Income
            </button>
            <button onClick={()=>handleTypeChange('expense')}
              style={{ flex:1, padding:'9px', borderRadius:'var(--r2)', border:'none', cursor:'pointer', fontWeight:600, fontSize:14,
                background: form.txn_type==='expense' ? 'var(--red)' : 'var(--bg3)', color: form.txn_type==='expense' ? '#fff' : 'var(--text2)' }}>
              - Expense
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Description</label>
              <input style={inp} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. Swiggy" /></div>
            <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Amount (₹)</label>
              <input style={inp} type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
            <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Date</label>
              <input style={inp} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
            <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Category</label>
              <select style={inp} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {cats.map(c=><option key={c}>{c}</option>)}
              </select></div>
            <div><label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Notes</label>
              <input style={inp} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional" /></div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSave} style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 20px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
              {editTxn ? 'Update' : dupWarning ? '⚠️ Save Anyway' : 'Save'}
            </button>
            <button onClick={()=>{ setShowForm(false); setEditTxn(null); setDupWarning(false) }}
              style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'9px 20px', fontSize:14, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
          {dupWarning && (
            <div style={{ marginTop:10, background:'rgba(255,181,69,.1)', border:'1px solid rgba(255,181,69,.25)', borderRadius:'var(--r2)', padding:'10px 14px', fontSize:13, color:'var(--amber)' }}>
              ⚠️ A transaction with the same description, amount and date already exists. Click <strong>Save Anyway</strong> to add it anyway.
            </div>
          )}
        </div>
      )}

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:20 }}>
        {txns.length === 0
          ? <p style={{ color:'var(--text3)', textAlign:'center', padding:'40px 0' }}>No transactions found.</p>
          : paginated.map(t => (
            <div key={t.id}>
              {deleteConfirmId === t.id ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', marginBottom:8, background:'rgba(255,94,122,.08)', border:'1px solid rgba(255,94,122,.2)', borderRadius:'var(--r2)' }}>
                  <span style={{ fontSize:13, color:'var(--text2)' }}>Delete <strong>{t.description}</strong>?</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => handleDelete(t.id)} style={{ background:'var(--red)', color:'#fff', border:'none', borderRadius:'var(--r2)', padding:'6px 14px', fontSize:13, cursor:'pointer', fontWeight:500 }}>Yes, Delete</button>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'6px 12px', fontSize:13, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <TransactionItem key={t.id} txn={t} onDelete={() => setDeleteConfirmId(t.id)} onEdit={handleEdit} />
              )}
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:14 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'7px 14px', fontSize:13, cursor: page===1 ? 'not-allowed' : 'pointer', opacity: page===1 ? .4 : 1 }}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ background: p===page ? 'var(--accent)' : 'var(--bg3)', color: p===page ? '#fff' : 'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'7px 12px', fontSize:13, cursor:'pointer', minWidth:36 }}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            style={{ background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'7px 14px', fontSize:13, cursor: page===totalPages ? 'not-allowed' : 'pointer', opacity: page===totalPages ? .4 : 1 }}>
            Next →
          </button>
          <span style={{ fontSize:12, color:'var(--text3)', marginLeft:4 }}>{txns.length} total</span>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={() => setShowDeleteAll(false)}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:18, fontWeight:600, marginBottom:10 }}>🗑️ Delete All Transactions</div>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:20, lineHeight:1.7 }}>
              This will permanently delete all <strong style={{ color:'var(--red)' }}>{txns.length} transactions</strong>. This action cannot be undone.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleDeleteAll} style={{ flex:1, background:'var(--red)', color:'#fff', border:'none', borderRadius:'var(--r2)', padding:'10px', fontSize:14, cursor:'pointer', fontWeight:600 }}>
                Yes, Delete All
              </button>
              <button onClick={() => setShowDeleteAll(false)} style={{ flex:1, background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'10px', fontSize:14, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
{showCsvModal && csvResult && (
  <div style={{
    position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:100
  }} onClick={() => setShowCsvModal(false)}>
    <div style={{
      background:'var(--bg2)', border:'1px solid var(--border2)',
      borderRadius:16, padding:28, width:480, maxWidth:'95vw',
      maxHeight:'80vh', overflowY:'auto'
    }} onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div style={{ fontSize:18, fontWeight:600, marginBottom:20 }}>
        📊 CSV Import Results
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        <div style={{ background:'rgba(34,211,160,0.1)', border:'1px solid rgba(34,211,160,0.2)', borderRadius:10, padding:'12px 16px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>SUCCESSFULLY ADDED</div>
          <div style={{ fontSize:24, fontWeight:600, color:'var(--green)', fontFamily:'DM Mono,monospace' }}>
            {csvResult.success_count}
          </div>
        </div>
        <div style={{ background:'rgba(255,181,69,0.1)', border:'1px solid rgba(255,181,69,0.2)', borderRadius:10, padding:'12px 16px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>TOTAL ROWS IN CSV</div>
          <div style={{ fontSize:24, fontWeight:600, color:'var(--amber)', fontFamily:'DM Mono,monospace' }}>
            {csvResult.total_rows}
          </div>
        </div>
      </div>

      {/* Skip reasons */}
      <div style={{ marginBottom:16 }}>
        {csvResult.skipped_null > 0 && (
          <div style={{ fontSize:13, color:'var(--amber)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            ⚠️ Skipped {csvResult.skipped_null} rows — empty amount or date
          </div>
        )}
        {csvResult.skipped_invalid > 0 && (
          <div style={{ fontSize:13, color:'var(--amber)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            ⚠️ Skipped {csvResult.skipped_invalid} rows — invalid data
          </div>
        )}
        {csvResult.skipped_duplicate > 0 && (
          <div style={{ fontSize:13, color:'var(--blue)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            ℹ️ Skipped {csvResult.skipped_duplicate} rows — already exists
          </div>
        )}
        {csvResult.skipped_future > 0 && (
          <div style={{ fontSize:13, color:'var(--text3)', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            ℹ️ Skipped {csvResult.skipped_future} rows — future date
          </div>
        )}
      </div>

      {/* Preview */}
      {csvResult.preview && csvResult.preview.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'var(--text2)' }}>
            Preview (first 5 added):
          </div>
          {csvResult.preview.map((t, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid var(--border)', color:'var(--text2)' }}>
              <span>{t.description}</span>
              <span style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)', fontFamily:'DM Mono,monospace' }}>
                {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error rows */}
      {csvResult.error_rows && csvResult.error_rows.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'var(--red)' }}>
            Errors:
          </div>
          {csvResult.error_rows.map((err, i) => (
            <div key={i} style={{ fontSize:11, color:'var(--text3)', padding:'3px 0' }}>
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 14px', fontSize:12, color:'var(--text3)', lineHeight:1.7, marginBottom:16 }}>
        💡 <strong style={{ color:'var(--text2)' }}>How to get CSV from your bank:</strong><br/>
        1. Login to your net banking portal<br/>
        2. Go to Account Statement section<br/>
        3. Select date range and download as CSV<br/>
        4. Upload that file here
      </div>

      <button onClick={() => setShowCsvModal(false)} style={{
        width:'100%', background:'var(--accent)', color:'white',
        border:'none', borderRadius:'var(--r2)', padding:'10px',
        fontSize:14, cursor:'pointer', fontWeight:500
      }}>
        Done  
      </button>
    </div>
  </div>
)}

    </div>
  )
}