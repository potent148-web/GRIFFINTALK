import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './lib/AuthContext.jsx'
import InvitePage from './pages/InvitePage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import './styles/theme.css'

function Root() {
  const path = window.location.pathname

  const inviteMatch = path.match(/^\/invite\/([a-zA-Z0-9]+)$/)
  if (inviteMatch) {
    return <InvitePage code={inviteMatch[1]} />
  }

  const bookMatch = path.match(/^\/book\/([a-zA-Z0-9_]+)$/)
  if (bookMatch) {
    return <BookingPage username={bookMatch[1]} />
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
