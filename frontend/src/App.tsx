import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Assessment from './components/Assessment'
import Dashboard from './components/Dashboard'
import MarketInsights from './components/MarketInsights'
import LearningPath from './components/LearningPath'
import ProgressTracker from './components/ProgressTracker'
import RoleDetail from './components/RoleDetail'
import Profile from './components/Profile'

interface User {
  username: string
}

type Tab = 'dashboard' | 'assessment' | 'market' | 'courses' | 'progress' | 'role' | 'profile'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [tabParams, setTabParams] = useState<Record<string, string>>({})

  if (!user) {
    return (
      <div className="app-container">
        <LoginPage onLogin={(u) => setUser(u)} />
      </div>
    )
  }

  const navigate = (tab: string, params?: Record<string, string>) => {
    if (tab === 'role' && (!params?.roleId || params.roleId === '')) return
    setActiveTab(tab as Tab)
    const filtered: Record<string, string> = {}
    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key]) filtered[key] = params[key]
      }
    }
    setTabParams(filtered)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'market', label: 'Market Insights' },
    { key: 'courses', label: 'Learning Path' },
    { key: 'progress', label: 'Progress' },
    { key: 'profile', label: 'Profile' },
  ]

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard username={user.username} onNavigate={navigate} />
      case 'assessment':
        return <Assessment defaultRoleId={tabParams.roleId} username={user.username} />
      case 'market':
        return <MarketInsights onNavigate={navigate} />
      case 'courses':
        return <LearningPath />
      case 'progress':
        return <ProgressTracker username={user.username} />
      case 'role':
        return <RoleDetail roleId={tabParams.roleId} onNavigate={navigate} />
      case 'profile':
        return <Profile username={user.username} onLogout={() => setUser(null)} />
      default:
        return <Dashboard username={user.username} onNavigate={navigate} />
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">SkillGap AI</div>
        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => navigate(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      {renderPage()}
    </div>
  )
}
