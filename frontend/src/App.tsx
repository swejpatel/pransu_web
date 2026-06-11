import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Gallery from './pages/Gallery';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminPhotos from './pages/AdminPhotos';
import AdminSettings from './pages/AdminSettings';
import AdminHeroSlider from './pages/AdminHeroSlider';
import AdminAbout from './pages/AdminAbout';
import { AuthProvider } from './context/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:categorySlug" element={<Gallery />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="hero" element={<AdminHeroSlider />} />
          <Route path="about" element={<AdminAbout />} />
          {/* Default admin route */}
          <Route index element={<AdminPhotos />} />
        </Route>
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
