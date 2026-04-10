import React, { useState } from 'react';
import { Modal, Box, Typography, Button, Grid, TextField, CircularProgress } from '@mui/material';
import { useUser } from '../context/UserContext';

const PaymentModal = ({ open, onClose }) => {
  const { upgradeToPro } = useUser();
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });

  const handleFill = () => {
    setCardData({ number: '4242 4242 4242 4242', expiry: '12/28', cvc: '123' });
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      upgradeToPro();
      onClose();
    }, 2000);
  };

  return (
    <Modal open={open} onClose={onClose} disableScrollLock>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '90vw', md: '700px' },
        backgroundColor: '#fff', borderRadius: 3, p: { xs: 3, md: 5 },
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', outline: 'none',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center', color: '#1e293b' }}>
          Subscribe to SolarYield Pro
        </Typography>

        <Grid container spacing={3}>
          {/* Benefits */}
          <Grid item xs={12} md={5}>
            <Box sx={{ backgroundColor: '#f8fafc', p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Pro Benefits
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'AI-Driven Future Prediction',
                  'Interactive AI Chatbot',
                  'Export Detailed PDF Reports',
                  'Priority Customer Support',
                ].map((benefit) => (
                  <Typography key={benefit} variant="body2">✅ {benefit}</Typography>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Payment */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Card Number"
                variant="outlined"
                size="small"
                value={cardData.number}
                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  variant="outlined"
                  size="small"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="CVC"
                  variant="outlined"
                  size="small"
                  value={cardData.cvc}
                  onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                />
              </Box>
              <Button variant="outlined" size="small" onClick={handleFill} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
                click to Auto-fill
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePay}
                disabled={processing || !cardData.number}
                sx={{
                  mt: 1,
                  height: '48px',
                  backgroundColor: '#10b981',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#059669' }
                }}
              >
                {processing ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Confirm Payment — $9.9/month'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default PaymentModal;