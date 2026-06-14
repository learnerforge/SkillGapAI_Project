import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!loginUser || !loginPass) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    const err = await login(loginUser, loginPass)
    if (err) setError(err)
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!regUser || !regEmail || !regPass) { setError('Please fill all fields'); return }
    if (regPass !== regConfirm) { setError('Passwords do not match'); return }
    if (regPass.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const err = await register(regUser, regEmail, regPass)
    if (err) setError(err)
    else setTab('login')
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 60 }}>
      <div className="header">
        <h1>SkillGap AI Pro</h1>
        <p>2026 Market-Ready Employability Analyzer</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', marginBottom: 20 }}>
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
            style={{ flex: 1 }}
          >
            Login
          </button>
          <button
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
            style={{ flex: 1 }}
          >
            Register
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {tab === 'login' ? (
          <div>
            <h3 style={{ marginBottom: 16 }}>Welcome Back!</h3>
            <div className="slider-group">
              <label>Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }}
              />
            </div>
            <div className="slider-group">
              <label>Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }}
              />
            </div>
            <button className="btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: 16 }}>Create Your Account</h3>
            <div className="slider-group">
              <label>Username</label>
              <input type="text" value={regUser} onChange={e => setRegUser(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }} />
            </div>
            <div className="slider-group">
              <label>Email</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }} />
            </div>
            <div className="slider-group">
              <label>Password</label>
              <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }} />
            </div>
            <div className="slider-group">
              <label>Confirm Password</label>
              <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }} />
            </div>
            <button className="btn" onClick={handleRegister} disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
