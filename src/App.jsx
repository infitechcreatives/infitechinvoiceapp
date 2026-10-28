import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Dashboard from './pages/Dashboard'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceView from './pages/InvoiceView'
import Settings from './pages/Settings'

const NAV = [
  { to: '/', label: 'Invoices', icon: 'M4 6h16M4 12h16M4 18h10', end: true },
  { to: '/new', label: 'New', icon: 'M12 5v14M5 12h14' },
  { to: '/settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z' },
]

export function Icon({ d, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  )
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <StoreProvider>
      <div className="min-h-screen pb-20 sm:pb-8">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-horizontal.png" alt="InfiTech Creatives" className="h-8 w-auto" />
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-brand-500 to-brand-700" />
        </header>

        <main className="mx-auto max-w-5xl px-4 py-5">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<InvoiceForm key={pathname} />} />
            <Route path="/edit/:id" element={<InvoiceForm key={pathname} />} />
            <Route path="/duplicate/:id" element={<InvoiceForm key={pathname} duplicate />} />
            <Route path="/invoice/:id" element={<InvoiceView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${isActive ? 'text-brand-700' : 'text-slate-500'}`
              }
            >
              <Icon d={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </StoreProvider>
  )
}
