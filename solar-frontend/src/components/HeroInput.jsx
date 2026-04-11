import React, { useState } from 'react';
import { Box, Typography, Card, TextField, Button, CircularProgress, Slider } from '@mui/material';
import { useUser } from '../context/UserContext';
import { fetchPrediction } from '../services/api';
import heroBg from '../assets/solar-panel-on-a-red-roof-reflecting-the-sun-web.jpg';

const HeroInput = () => {
  const { setSolarData } = useUser();
  const [loading, setLoading] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [roofSize, setRoofSize] = useState(50);
  const [postalError, setPostalError] = useState('');

  const handleAnalyze = async () => {
    if (!postalCode) {
      setPostalError('Please enter your postal code before analyzing.');
      return;
    }
    if (!/^\d{6}$/.test(postalCode)) {
      setPostalError('Singapore postal codes must be exactly 6 digits.');
      return;
    }

    setPostalError('');
    setLoading(true);

    const response = await fetchPrediction(postalCode, roofSize);
    setSolarData(response.data);

    setLoading(false);

    setTimeout(() => {
      const dashboard = document.getElementById('dashboard-section');
      if (dashboard) {
        dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      backgroundColor: '#f8fafc',  // ← makes bottom gap visible as white
      pb: '80px',                  // ← shifts card up, leaves margin at bottom
      boxSizing: 'border-box',
    }}>

      {/* Background image — stops before page bottom */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '28px',               // ← gap so image doesn't touch page bottom
        borderRadius: '0 0 20px 20px',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px',
          background: 'linear-gradient(to bottom, transparent, rgba(248, 250, 252, 1))',
          zIndex: 1,
        }} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', px: 2, width: '100%', maxWidth: '800px' }}>
        <Typography variant="h2" sx={{
          color: '#fff',
          fontWeight: 800,
          mb: 2,
          letterSpacing: '-1px',
          fontSize: { xs: '2rem', sm: '2.6rem', md: '3.3rem' }, 
        }}> 
        Maximize Your Roof's<br />Revenue Potential with AI.
        </Typography>
        <Typography variant="h6" sx={{ color: '#cbd5e1', mb: 6, fontWeight: 400 }}>
          Trusted by 500+ Singapore businesses. Get instant ROI analysis.
        </Typography>
        <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'left', fontWeight: 600 }}>
              Get started by entering your property details now!
            </Typography>
            <TextField
              fullWidth
              label="Postal Code of your property (e.g. 560123)"
              variant="outlined"
              value={postalCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPostalCode(val);
                if (postalError) setPostalError('');
              }}
              error={!!postalError}
              helperText={postalError}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
            />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Estimated Roof Size (Square feet)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Slider
                  value={roofSize}
                  onChange={(e, val) => setRoofSize(val)}
                  min={10} max={1000}
                  sx={{ color: '#f59e0b', flexGrow: 1 }}
                />
                <TextField
                  type="number" variant="outlined" size="small"
                  value={roofSize}
                  onChange={(e) => setRoofSize(Number(e.target.value))}
                  sx={{ width: '100px' }}
                />
              </Box>
            </Box>
          </Box>
          <Button
            fullWidth variant="contained" onClick={handleAnalyze} disabled={loading}
            sx={{
              backgroundColor: '#f59e0b', color: '#fff', height: '60px',
              fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'none',
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            {loading ? <CircularProgress size={28} sx={{ color: '#fff' }} /> : 'Analyze Now'}
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

export default HeroInput;