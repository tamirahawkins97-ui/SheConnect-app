import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import  ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar'

import Home from './pages/Landing';
import Profile from './pages/Profile';
import SocialHub from './pages/SocialHub';
import Feed from './pages/Feed';
import Auth from './pages/Auth';


function App(){
  return(
    <BrowserRouter>
      <Navbar/>
      
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected by a valid authenticated session */}
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
