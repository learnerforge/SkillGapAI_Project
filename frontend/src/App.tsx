import { useState, type ReactNode, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import LoginPage from './components/LoginPage'
import Assessment from './components/Assessment'
import MarketInsights from './components/MarketInsights'
import LearningPath from './components/LearningPath'

type Tab = 'assessment' | 'insights' | 'learning'

const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
  {
    key: 'assessment',
    label: 'Assessment',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: 'insights',
    label: 'Market Insights',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: 'learning',
    label: 'Learning Path',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-7 h-7">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#e94560] to-[#ff6b81] opacity-90" />
        <svg className="absolute inset-0 w-7 h-7 p-1.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <span className="font-heading text-base font-semibold tracking-tight text-white">SkillGap</span>
    </div>
  )
}

function TabBar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <nav className="flex gap-1" role="tablist">
      {TABS.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${activeTab === tab.key
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

function Dashboard() {
  const { username, userId, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('assessment')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <div className="max-w-6xl mx-auto px-5 py-5">
        <header className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-6">
            <Logo />
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-white/30 font-medium uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-medium text-white/80">{username}</p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium text-white/40 border border-white/10 rounded-lg hover:text-white/70 hover:border-white/20 transition-all"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className={`min-h-[60vh] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {activeTab === 'assessment' && <Assessment userId={userId ?? ''} />}
          {activeTab === 'insights' && <MarketInsights />}
          {activeTab === 'learning' && <LearningPath />}
        </main>

        <footer className="mt-16 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-xs text-white/15">SkillGap AI Pro &middot; 2026</p>
        </footer>
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
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  )
}
