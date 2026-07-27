import { useEffect, useState } from 'react'
import LoginPage from './components/LoginPage'
import QaTicketFormPage from './components/QaTicketFormPage'
import TicketListPage from './components/TicketListPage'
import Sidebar from './components/Sidebar'
import WorkshopWatermark from './components/WorkshopWatermark'
import { tokenStorage, warmUpBackend } from './api/http'
import { logout } from './api/auth'

const COLLAPSED_KEY = 'qaticket.sidebarCollapsed'

export default function App() {
  const [userInfo, setUserInfo] = useState(() => {
    return tokenStorage.getAccessToken() ? tokenStorage.getUserInfo() : null
  })
  const [view, setView] = useState('list')
  const [editingTicketId, setEditingTicketId] = useState(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')

  useEffect(() => {
    warmUpBackend()

    function handleSessionExpired() {
      setUserInfo(null)
    }
    window.addEventListener('qaticket:session-expired', handleSessionExpired)
    return () => window.removeEventListener('qaticket:session-expired', handleSessionExpired)
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1')
      return !prev
    })
  }

  async function handleLogout() {
    await logout()
    setUserInfo(null)
    setView('list')
    setEditingTicketId(null)
  }

  function handleNavigate(nextView) {
    if (nextView === 'form') setEditingTicketId(null)
    setView(nextView)
  }

  if (!userInfo) {
    return <LoginPage onLoggedIn={(data) => setUserInfo(data)} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navyDark">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <WorkshopWatermark />
      </div>

      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        userInfo={userInfo}
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div
        className={`relative pt-14 sm:pt-0 transition-all duration-200 ${collapsed ? 'sm:ml-0' : 'sm:ml-64'}`}
      >
        {view === 'form' ? (
          <QaTicketFormPage
            userInfo={userInfo}
            ticketId={editingTicketId}
            onBackToList={() => setView('list')}
          />
        ) : (
          <TicketListPage
            userInfo={userInfo}
            onEdit={(id) => {
              setEditingTicketId(id)
              setView('form')
            }}
          />
        )}
      </div>
    </div>
  )
}
