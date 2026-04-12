import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import { useUser } from '../context/UserContext';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'per month',
    description: 'Perfect for homeowners exploring solar potential.',
    color: '#1e293b',
    buttonLabel: 'Explore Now',
    buttonVariant: 'outlined',
    buttonSx: { borderColor: '#1e293b', color: '#1e293b', '&:hover': { borderColor: '#f59e0b', color: '#f59e0b' } },
    features: [
      { label: 'Location-based Meteorological Analysis', included: true },
      { label: 'Solar PV System Cost Estimate', included: true },
      { label: 'AI-Driven Future Prediction', included: false },
      { label: 'Interactive AI Chatbot', included: false },
      { label: 'ROI analysis', included: false }
    ],
  },
  {
    name: 'Pro',
    price: '$9.9',
    period: 'per month',
    description: 'For businesses and property investors who need full insights on cost saving and energy performance.',
    color: '#f59e0b',
    highlight: true,
    features: [
      { label: 'Unlimited Access to ALL Features', included: true },
      { label: 'AI-Driven Future Prediction', included: true },
      { label: 'Solar Yield Analysis', included: true },
      { label: 'ROI Forecast', included: true },
      { label: 'Interactive AI Chatbot', included: true },
      { label: 'Priority Customer Support', included: true },
    ],
  },
];

const PricingPage = ({ onOpenPayment, onOpenLogin, onTabChange }) => {
  const { isPro, currentUser } = useUser();

  const handleProClick = () => {
    if (!currentUser) {
      onOpenLogin();
    } else {
      onOpenPayment();
    }
  };

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', px: 3, py: 10 }}>
      <Typography variant="h3" fontWeight={800} textAlign="center" color="#1e293b" mb={1}>
        Simple & Transparent Pricing
      </Typography>
      <Typography variant="h6" textAlign="center" color="#64748b" fontWeight={400} mb={8}>
        Start for free. Upgrade when you need more.
      </Typography>

      {!currentUser && (
        <Box sx={{ textAlign: 'center', mb: 4, p: 2, backgroundColor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
          <Typography variant="body2" color="#92400e" fontWeight={600}>
            Please{' '}
            <span onClick={onOpenLogin} style={{ textDecoration: 'underline', cursor: 'pointer' }}>log in or sign up</span>
            {''}. Your plan will be linked to your account.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'stretch' }}>
        {PLANS.map((plan) => (
          <Box key={plan.name} sx={{
            flex: 1, borderRadius: 3,
            border: plan.highlight ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            backgroundColor: plan.highlight ? '#fffbeb' : '#ffffff',
            p: 4, display: 'flex', flexDirection: 'column', position: 'relative',
            boxShadow: plan.highlight ? '0 20px 40px -12px rgba(245,158,11,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
          }}>
            {plan.highlight && (
              <Box sx={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                backgroundColor: '#f59e0b', color: '#fff', px: 2.5, py: 0.5,
                borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                BEST CHOICE
              </Box>
            )}
            

            <Typography variant="h6" fontWeight={700} color="#1e293b" mb={0.5}>{plan.name}</Typography>
            <Typography variant="body2" color="#64748b" mb={3}>{plan.description}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 0.5 }}>
              <Typography variant="h3" fontWeight={800} color={plan.color} lineHeight={1}>{plan.price}</Typography>
              <Typography variant="body2" color="#94a3b8" mb={0.5}>/ {plan.period}</Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, mb: 4 }}>
              {plan.features.map((f) => (
                <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1rem', color: f.included ? '#10b981' : '#cbd5e1' }}>
                    {f.included ? '✓' : '✕'}
                  </Typography>
                  <Typography variant="body2" color={f.included ? '#1e293b' : '#94a3b8'}>{f.label}</Typography>
                </Box>
              ))}
            </Box>

            {plan.highlight ? (
              <Button fullWidth variant="contained"
                onClick={handleProClick}
                disabled={isPro}
                sx={{
                  height: '48px', fontWeight: 700, fontSize: '0.95rem',
                  textTransform: 'none', borderRadius: 2,
                  backgroundColor: '#f59e0b', color: '#fff',
                  '&:hover': { backgroundColor: '#d97706' },
                }}
              >
                {isPro ? '👑 Current Plan' : currentUser ? 'Upgrade to Pro' : 'Log In to Upgrade'}
              </Button>
            ) : (
              <Button fullWidth variant="outlined"
                disabled={!isPro}
                onClick={() => isPro && onTabChange('Features')}
                sx={{
                  height: '48px', fontWeight: 700, fontSize: '0.95rem',
                  textTransform: 'none', borderRadius: 2,
                  ...(!isPro
                    ? { borderColor: '#cbd5e1', color: '#94a3b8', '&.Mui-disabled': { borderColor: '#cbd5e1', color: '#94a3b8' } }
                    : plan.buttonSx
                  ),
                }}
              >
                {isPro ? 'Explore Now' : 'Current Plan'}
              </Button>
            )}
          </Box>
        ))}
      </Box>

      <Typography variant="body2" textAlign="center" color="#94a3b8" mt={6}>
        🔒 Secured payment. No hidden fees.
      </Typography>
    </Box>
  );
};

export default PricingPage;