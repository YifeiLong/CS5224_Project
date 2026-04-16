import React, { useState, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Paper, ClickAwayListener } from '@mui/material';
import { useUser } from '../context/UserContext';

const NAV_TABS = ['Features', 'Pricing', 'About Us'];

const SunIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" fill="#f59e0b" stroke="none" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="#f59e0b" strokeWidth="2" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="#f59e0b" strokeWidth="2" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="#f59e0b" strokeWidth="2" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="#f59e0b" strokeWidth="2" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#f59e0b" strokeWidth="2" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#f59e0b" strokeWidth="2" />
    <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" stroke="#f59e0b" strokeWidth="2" />
    <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" stroke="#f59e0b" strokeWidth="2" />
  </svg>
);

const Navbar = ({ onOpenPayment, onOpenLogin, activeTab, onTabChange }) => {
  const { isPro, currentUser, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleUpgradeClick = () => {
    if (!currentUser) {
      onOpenLogin(); // force login first
    } else {
      onOpenPayment();
    }
  };

  return (
    <AppBar position="static" elevation={1} style={{ backgroundColor: '#0f172a', backdropFilter: 'blur(8px)' }} sx={{ color: '#fff' }}>
      <Toolbar disableGutters sx={{ px: 3 }}>

        {/* Logo */}
        <Box onClick={() => onTabChange('Features')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, cursor: 'pointer' }}>
          <SunIcon />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap', color: '#fff' }}>
            SolarYield <span style={{ color: '#f59e0b' }}>AI</span>
          </Typography>
        </Box>

        {/* Nav Tabs */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: '4px', flexGrow: 1, justifyContent: 'center' }}>
          {NAV_TABS.map((tab) => (
            <Button key={tab} onClick={() => onTabChange(tab)} sx={{
              textTransform: 'none',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#f59e0b' : '#cbd5e1',
              borderBottom: activeTab === tab ? '2px solid #f59e0b' : '2px solid transparent',
              borderRadius: 0, px: 2, py: 1,
              transition: 'all 0.2s ease',
              '&:hover': { color: '#f59e0b', backgroundColor: 'transparent' },
            }}>
              {tab}
            </Button>
          ))}
        </Box>

        {/* Auth Area */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {currentUser ? (
            // Logged in — show name with dropdown
            <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
              <Box sx={{ position: 'relative' }}>
                <Button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  sx={{
                    textTransform: 'none', color: '#fff', fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2, px: 2,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.18)' },
                  }}
                >
                  👋 Hello, {currentUser.name.split(' ')[0]}
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#94a3b8' }}>▼</span>
                </Button>
                {dropdownOpen && (
                  <Paper elevation={4} sx={{
                    position: 'absolute', top: '110%', right: 0,
                    minWidth: 180, borderRadius: 2, overflow: 'hidden', zIndex: 9999,
                    border: '1px solid #e2e8f0',
                  }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" color="#94a3b8" display="block">Signed in as</Typography>
                      <Typography variant="body2" fontWeight={600} color="#1e293b">{currentUser.email}</Typography>
                    </Box>
                    {isPro && (
                      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Typography variant="body2" color="#10b981" fontWeight={700}>👑 Pro Plan Active</Typography>
                      </Box>
                    )}
                    <Box
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      sx={{
                        px: 2, py: 1.5, cursor: 'pointer', color: '#ef4444',
                        fontSize: '0.875rem', fontWeight: 600,
                        '&:hover': { backgroundColor: '#fef2f2' },
                      }}
                    >
                      Log Out
                    </Box>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
          ) : (
            // Not logged in — show Login button
            <Button onClick={onOpenLogin} sx={{ textTransform: 'none', color: '#cbd5e1' }}>
              Login
            </Button>
          )}

          {/* Upgrade / Pro badge */}
          {!isPro ? (
            <Button variant="contained" onClick={handleUpgradeClick} sx={{
              backgroundColor: '#f59e0b', color: '#fff', textTransform: 'none',
              fontWeight: 'bold', whiteSpace: 'nowrap',
              '&:hover': { backgroundColor: '#d97706' },
            }}>
              Upgrade to Pro
            </Button>
          ) : (
            <Button variant="outlined" sx={{
              color: '#10b981', borderColor: '#10b981', fontWeight: 'bold', whiteSpace: 'nowrap',
            }}>
              👑 PRO USER
            </Button>
          )}
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;