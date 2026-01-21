import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Jobs from './pages/Jobs'
import Resume from './pages/Resume'
import Ready from './pages/Ready'
import Applied from './pages/Applied'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/ready" element={<Ready />} />
      <Route path="/applied" element={<Applied />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
