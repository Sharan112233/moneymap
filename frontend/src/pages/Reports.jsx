import { downloadPDF } from '../api/client'

export default function Reports() {
  const handleDownload = async () => {
    const r = await downloadPDF()
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'MoneyMap_Report.pdf'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:600 }}>Reports</h1>
        <p style={{ fontSize:14, color:'var(--text2)', marginTop:2 }}>Download and export your financial data</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:24, textAlign:'center', cursor:'pointer' }} onClick={handleDownload}>
          <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
          <div style={{ fontWeight:600, marginBottom:4 }}>PDF Report</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Full summary with all transactions</div>
          <button style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r2)', padding:'9px 20px', fontSize:14, cursor:'pointer', fontWeight:500 }}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}