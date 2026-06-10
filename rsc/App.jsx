import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [transactions, setTransactions] = useState([])
  const [type, setType] = useState('income')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('Umum')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchTransactions()
  }, [session])

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTransactions(data)
  }

  const saldo = transactions.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setTransactions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    const { error } = await supabase
      .from('transactions')
      .insert([{ type, amount: parseFloat(amount), description: desc, category }])
    if (!error) {
      setAmount('')
      setDesc('')
      fetchTransactions()
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  if (loading) return <div className="container">Memuat...</div>

  if (!session) {
    return (
      <div className="container" style={{ maxWidth: 400, marginTop: '10vh' }}>
        <div className="card">
          <h2 style={{ textAlign: 'center' }}>💰 PEMUDA RESPEK</h2>
          <p style={{ textAlign: 'center' }}>Login Pengurus</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {authError && <p style={{ color: 'red' }}>{authError}</p>}
            <button className="primary" style={{ width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="flex">
        <h2>📊 Dashboard Pemuda RESPEK</h2>
        <button className="danger" onClick={handleLogout}>Keluar</button>
      </div>
      <div className="card">
        <p>Saldo Kas Saat Ini</p>
        <div className="saldo">Rp {saldo.toLocaleString('id-ID')}</div>
      </div>
      <div className="card">
        <h3>Catat Transaksi</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <input type="number" placeholder="Jumlah" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <input placeholder="Keterangan (opsional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <input placeholder="Kategori (contoh: Donasi, Konsumsi)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <button className="primary" style={{ width: '100%' }}>Simpan</button>
        </form>
      </div>
      <div className="card">
        <h3>Riwayat Transaksi</h3>
        {transactions.length === 0 ? (
          <p>Belum ada transaksi.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Kategori</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                    <td className={t.type === 'income' ? 'income' : 'expense'}>
                      {t.type === 'income' ? 'Masuk' : 'Keluar'}
                    </td>
                    <td>{t.category}</td>
                    <td>Rp {t.amount.toLocaleString('id-ID')}</td>
                    <td>
                      <button className="danger" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleDelete(t.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
