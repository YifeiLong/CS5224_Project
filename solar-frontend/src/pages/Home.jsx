import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import HeroInput from '../components/HeroInput';
import Dashboard from '../components/Dashboard';
import PaymentModal from '../components/PaymentModal';
import LoginModal from '../components/LoginModal';
import ChatWidget from '../components/ChatWidget';
import PricingPage from '../components/PricingPage';
import AboutUsPage from '../components/AboutUsPage';
import { Box } from '@mui/material';
import { useUser } from '../context/UserContext';

const Home = () => {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Features');
  const { solarData } = useUser();
  const scrollPosRef = useRef(0);

  useEffect(() => {
    if (activeTab === 'Features' && !solarData) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeTab, solarData]);

  // Scroll to top on every tab change so navbar is always visible
  // If switching back to Features and results exist, scroll to dashboard
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'Features') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Going back to Features — if results exist scroll to dashboard, else top
      setTimeout(() => {
        if (solarData) {
          const dashboard = document.getElementById('dashboard-section');
          if (dashboard) {
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const openPayment = () => {
    scrollPosRef.current = window.scrollY;
    setPayModalOpen(true);
  };

  const closePayment = () => {
    setPayModalOpen(false);
    requestAnimationFrame(() => window.scrollTo(0, scrollPosRef.current));
  };

  const openLogin = () => {
    scrollPosRef.current = window.scrollY;
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
    requestAnimationFrame(() => window.scrollTo(0, scrollPosRef.current));
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      <Navbar
        onOpenPayment={openPayment}
        onOpenLogin={openLogin}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <Box sx={{ display: activeTab === 'Features' ? 'block' : 'none' }}>
        <HeroInput />
        <Dashboard onOpenPayment={openPayment} onOpenLogin={openLogin} />
        <ChatWidget onOpenPayment={openPayment} onOpenLogin={openLogin} />
      </Box>

      {activeTab === 'Pricing' && (
        <PricingPage onOpenPayment={openPayment} onOpenLogin={openLogin} onTabChange={handleTabChange} />
      )}
      {activeTab === 'About Us' && (
        <AboutUsPage />
      )}

      <PaymentModal open={payModalOpen} onClose={closePayment} />
      <LoginModal open={loginOpen} onClose={closeLogin} />
    </Box>
  );
};

export default Home;