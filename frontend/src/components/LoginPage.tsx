import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { UInput, UButton } from './ui'

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-10 h-10' }
  const iconP = { sm: 'p-1.5', md: 'p-2', lg: 'p-2' }
  const labelSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative ${dims[size]}`}>
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#e94560] to-[#ff6b81] opacity-90" />
        <svg className={`absolute inset-0 ${dims[size]} ${iconP[size]} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <span className={`font-heading ${labelSize[size]} font-semibold tracking-tight text-white`}>SkillGap</span>
    </div>
  )
}

function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      time += 0.002
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(time * 0.3) * 0.15),
        canvas.height * (0.4 + Math.cos(time * 0.4) * 0.15),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.6,
      )
      gradient.addColorStop(0, 'rgba(233, 69, 96, 0.04)')
      gradient.addColorStop(0.5, 'rgba(20, 255, 236, 0.02)')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
}

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#e94560]/3 blur-[120px] animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-[#14ffec]/3 blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#e94560]/2 blur-[150px] animate-pulse" style={{ animationDuration: '6s' }} />
    </div>
  )
}

function GridBackground() {
  return (
    <div
      className="grid-bg-subtle fixed inset-0 pointer-events-none"
    />
  )
}

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        <path d="M9 11l3 3L22 4" />
      </svg>
    ),
    title: 'Skill Assessment',
    desc: 'Rate your proficiency across 114 skills. Our ML models measure your employability readiness against 25 tech roles.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Market Insights',
    desc: 'Explore demand trends across 34 providers and 68K+ courses. Discover which roles pay the highest and grow fastest.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    title: 'Learning Path',
    desc: 'Get a personalized course plan based on your skill gaps, with recommendations curated from real provider data.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'This platform helped me identify exactly which skills to focus on. I landed a data engineering role in 8 weeks.',
    name: 'Sarah Chen',
    role: 'Data Engineer at Stripe',
  },
  {
    quote: 'The market insights are incredible. I could see which cloud certifications actually pay off before investing time.',
    name: 'Marcus Johnson',
    role: 'DevOps Lead at Vercel',
  },
  {
    quote: 'Finally a tool that maps real course data to job roles instead of generic advice. The precision is unmatched.',
    name: 'Priya Patel',
    role: 'ML Engineer at Anthropic',
  },
]

interface FieldError { field: string; message: string }

function validateLogin(user: string, pass: string): FieldError | null {
  if (!user.trim()) return { field: 'loginUser', message: 'Username is required' }
  if (!pass) return { field: 'loginPass', message: 'Password is required' }
  return null
}

function validateRegister(user: string, email: string, pass: string, confirm: string): FieldError | null {
  if (!user.trim()) return { field: 'regUser', message: 'Username is required' }
  if (user.length < 3) return { field: 'regUser', message: 'Username must be at least 3 characters' }
  if (!email.trim()) return { field: 'regEmail', message: 'Email is required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { field: 'regEmail', message: 'Invalid email address' }
  if (!pass) return { field: 'regPass', message: 'Password is required' }
  if (pass.length < 6) return { field: 'regPass', message: 'Password must be at least 6 characters' }
  if (pass !== confirm) return { field: 'regConfirm', message: 'Passwords do not match' }
  return null
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth()
  const { success, error: notifyError } = useNotification()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const clearErrors = useCallback(() => setFieldErrors({}), [])

  const handleLogin = async () => {
    clearErrors()
    const err = validateLogin(loginUser, loginPass)
    if (err) { setFieldErrors({ [err.field]: err.message }); return }
    setLoading(true)
    const result = await login(loginUser, loginPass)
    if (result) notifyError(result)
    setLoading(false)
  }

  const handleRegister = async () => {
    clearErrors()
    const err = validateRegister(regUser, regEmail, regPass, regConfirm)
    if (err) { setFieldErrors({ [err.field]: err.message }); return }
    setLoading(true)
    const result = await register(regUser, regEmail, regPass)
    if (result) {
      notifyError(result)
    } else {
      success('Account created! You can now log in.')
      setTab('login')
      setRegUser(''); setRegEmail(''); setRegPass(''); setRegConfirm('')
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action()
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-content relative w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Logo size="sm" />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              aria-label="Close modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex mb-6 border-b border-white/10">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); clearErrors() }}
                className={`
                  flex-1 pb-3 text-sm font-medium transition-all duration-200 relative tab-indicator min-h-[44px]
                  ${tab === t ? 'text-white active' : 'text-white/40 hover:text-white/70'}
                `}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <div
              className="space-y-5"
              onKeyDown={e => handleKeyDown(e, handleLogin)}
            >
              <UInput
                label="Username"
                type="text"
                value={loginUser}
                onChange={e => { setLoginUser(e.target.value); clearErrors() }}
                error={fieldErrors.loginUser}
                placeholder="Enter your username"
                autoFocus
              />
              <UInput
                label="Password"
                type="password"
                value={loginPass}
                onChange={e => { setLoginPass(e.target.value); clearErrors() }}
                error={fieldErrors.loginPass}
                placeholder="Enter your password"
                showPasswordToggle
              />
              <UButton
                variant="cta"
                className="w-full !rounded-lg !py-3"
                onClick={handleLogin}
                disabled={loading}
                loading={loading}
              >
                Sign in
              </UButton>
            </div>
          ) : (
            <div
              className="space-y-4"
              onKeyDown={e => handleKeyDown(e, handleRegister)}
            >
              <UInput
                label="Username" type="text" value={regUser}
                onChange={e => { setRegUser(e.target.value); clearErrors() }}
                error={fieldErrors.regUser}
                placeholder="At least 3 characters"
              />
              <UInput
                label="Email" type="email" value={regEmail}
                onChange={e => { setRegEmail(e.target.value); clearErrors() }}
                error={fieldErrors.regEmail}
                placeholder="your@email.com"
              />
              <UInput
                label="Password" type="password" value={regPass}
                onChange={e => { setRegPass(e.target.value); clearErrors() }}
                error={fieldErrors.regPass}
                placeholder="At least 6 characters"
                showPasswordToggle
                maxLength={128}
              />
              <UInput
                label="Confirm Password" type="password" value={regConfirm}
                onChange={e => { setRegConfirm(e.target.value); clearErrors() }}
                error={fieldErrors.regConfirm}
                placeholder="Repeat your password"
                showPasswordToggle
              />
              <UButton
                variant="cta"
                className="w-full !rounded-lg !py-3"
                onClick={handleRegister}
                disabled={loading}
                loading={loading}
              >
                Create account
              </UButton>
            </div>
          )}

          <p className="text-xs text-white/40 text-center mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-white/60 hover:text-white transition-colors link-underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-white/60 hover:text-white transition-colors link-underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0a0a0b] overflow-hidden">
      <BackgroundEffect />
      <FloatingOrbs />
      <GridBackground />

      <header
        className={`relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAuth(true)}
            className="text-sm text-white/50 hover:text-white transition-colors font-medium min-h-[44px] px-3"
          >
            Sign in
          </button>
          <UButton
            variant="cta"
            size="sm"
            onClick={() => setShowAuth(true)}
            className="!rounded-lg !px-5"
          >
            Get started
          </UButton>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center">
        <section className="w-full max-w-5xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24 text-center">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/60 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#14ffec]" />
            2026 Market-Ready Employability Analyzer
          </div>

          <h1 className={`typo-hero text-white mb-4 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Bridge your{' '}
            <span className="text-gradient">skill gap</span>
            <span className="typo-hero-sub">with AI precision</span>
          </h1>

          <p className={`typo-body max-w-xl mx-auto mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Analyze your current skills against 25 tech roles, get personalized learning paths
            from 68K+ courses across 34 providers, and track your employability growth.
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '250ms' }}>
            <UButton
              variant="cta"
              size="lg"
              onClick={() => setShowAuth(true)}
              className="!rounded-xl !px-8 !py-4 w-full sm:w-auto"
            >
              Start your assessment
            </UButton>
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium text-white/50 hover:text-white/80 transition-colors rounded-xl border border-white/10 hover:border-white/20 w-full sm:w-auto justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              See how it works
            </button>
          </div>

          <div className={`flex items-center justify-center gap-10 sm:gap-16 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center">
              <div className="font-heading text-3xl sm:text-4xl font-bold text-white">68K+</div>
              <div className="text-xs sm:text-sm text-white/50 mt-1">Courses indexed</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="font-heading text-3xl sm:text-4xl font-bold text-white">34</div>
              <div className="text-xs sm:text-sm text-white/50 mt-1">Providers</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="font-heading text-3xl sm:text-4xl font-bold text-white">25</div>
              <div className="text-xs sm:text-sm text-white/50 mt-1">Roles mapped</div>
            </div>
          </div>
        </section>

        <section className={`w-full max-w-5xl mx-auto px-6 pb-16 lg:pb-24 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '350ms' }}>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="feature-card glass-card rounded-xl p-6"
                style={{ animationDelay: `${400 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#e94560] mb-4">
                  {f.icon}
                </div>
                <h3 className="font-heading text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`w-full max-w-4xl mx-auto px-6 pb-20 lg:pb-28 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
          <div className="text-center mb-10">
            <h2 className="typo-section text-white mb-2">Trusted by professionals</h2>
            <p className="text-sm text-white/50">From startups to Big Tech, engineers use SkillGap to accelerate their careers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card glass-card rounded-xl p-6">
                <svg className="w-5 h-5 text-[#e94560]/40 mb-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-white/65 leading-relaxed mb-4">{t.quote}</p>
                <div>
                  <p className="text-sm font-medium text-white/80">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={`relative z-10 text-center py-6 border-t border-white/[0.03] transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-white/25">SkillGap AI &middot; 68K+ courses &middot; 34 providers &middot; 25 roles &middot; 2026</p>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
