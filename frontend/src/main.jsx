import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { EventProfileProvider } from './context/EventProfileContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <EventProfileProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </EventProfileProvider>
  </BrowserRouter>
)
