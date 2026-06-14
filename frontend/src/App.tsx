import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Assessment from './components/Assessment'
import MarketInsights from './components/MarketInsights'
import LearningPath from './components/LearningPath'

type Tab = 'assessment' | 'insights' | 'learning'

const TABS: { key: Tab; label: string }[] = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'insights', label: 'Market Insights' },
  { key: 'learning', label: 'Learning Path' },
]

function Dashboard() {
  const { username, userId, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('assessment')

  return (
    <div className="container">
      <div className="header">
        <h1>SkillGap AI Pro</h1>
        <p>2026 Market-Ready Employability Analyzer</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#888' }}>Logged in as <strong style={{ color: '#e94560' }}>{username}</strong></div>
        <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: 8, color: '#888' }}>
          Logout
        </button>
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assessment' && <Assessment userId={userId ?? ''} />}
      {activeTab === 'insights' && <MarketInsights />}
      {activeTab === 'learning' && <LearningPath />}

      <div className="footer">
        <p>SkillGap AI Pro (c) 2026 | Powered by Machine Learning</p>
        <p style={{ marginTop: 4 }}>Model Accuracy: 75%+ | Updated for 2026 Market | Course Engine: 68K+ courses, 34 providers</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { loggedIn } = useAuth()
  return loggedIn ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
