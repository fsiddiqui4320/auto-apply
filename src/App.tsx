import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Jobs from './pages/Jobs'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
