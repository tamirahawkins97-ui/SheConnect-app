import {BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
 
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import SocialHub from './pages/SocialHub';
import Feed from './pages/Feed';
import Auth from './pages/Auth';


function App(){
  return(
    <BrowserRouter>
      <nav>
        <Link to="/">Landing</Link>
        <Link to="/auth">Auth</Link>
        <Link to="/feed">Feed (Protected)</Link>
        <Link to="/social">Social (Protected)</Link>
        <Link to="/profile">Profile (Protected)</Link>
      </nav>
      
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected by a stored login token */}
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<Feed />} />
            <Route path="/social" element={<SocialHub />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App;