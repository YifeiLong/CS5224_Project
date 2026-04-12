import React from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';

const SolarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" /><line x1="6.34" y1="17.66" x2="4.22" y2="19.78" />
  </svg>
);

const HomeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const TeamIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <circle cx="17" cy="7" r="3" />
    <path d="M21 21v-2a4 4 0 00-3-3.87" />
  </svg>
);



// Feature-specific icons
const AnalysisIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const PredictionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M5 20V10l7-7 7 7v10" />
    <path d="M9 20v-5h6v5" />
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ReportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const RoiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const MapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const Section = ({ icon, title, children }) => (
  <Box sx={{ mb: 8 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2,
        backgroundColor: '#fef3c7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={800} color="#1e293b">{title}</Typography>
    </Box>
    <Divider sx={{ mb: 3, borderColor: '#f59e0b', borderBottomWidth: 2, width: 60 }} />
    {children}
  </Box>
);

const StatCard = ({ value, label }) => (
  <Box sx={{
    textAlign: 'center', p: 3, backgroundColor: '#fff', borderRadius: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
  }}>
    <Typography variant="h4" fontWeight={800} color="#f59e0b">{value}</Typography>
    <Typography variant="body2" color="#64748b" mt={0.5}>{label}</Typography>
  </Box>
);

const FeatureCard = ({ icon, title, description, isPro }) => (
  <Box sx={{
    p: 3, backgroundColor: '#fff', borderRadius: 3,
    border: isPro ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
    boxShadow: isPro ? '0 8px 24px rgba(245,158,11,0.12)' : '0 4px 12px rgba(0,0,0,0.05)',
    position: 'relative',
  }}>
    {isPro && (
      <Box sx={{
        position: 'absolute', top: 12, right: 12,
        backgroundColor: '#fef3c7', color: '#b45309',
        px: 1.5, py: 0.25, borderRadius: 10,
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.5,
      }}>
        PRO
      </Box>
    )}
    <Box sx={{
      width: 44, height: 44, borderRadius: 2,
      backgroundColor: '#fef3c7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
    }}>
      {icon}
    </Box>
    <Typography fontWeight={700} color="#1e293b" mb={0.75}>{title}</Typography>
    <Typography variant="body1" color="#64748b" lineHeight={1.7}>{description}</Typography>
  </Box>
);

const AboutUsPage = () => {
  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', px: 3, py: 10 }}>
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h3" fontWeight={800} color="#1e293b" mb={2}>
          Powering Singapore's Solar Future
        </Typography>
        <Typography variant="h6" color="#64748b" fontWeight={400} maxWidth="600px" mx="auto">
          We help homeowners and businesses to know about Solar energy and system, unlock true revenue potential of their rooftops using AI-driven solar analysis.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 10 }}>
        {[
          { value: '500+', label: 'Clients Served' },
          { value: '$2.4M+', label: 'Revenue Unlocked' },
          { value: '< 1 min', label: 'Average Analysis Time' }
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Why Solar Energy */}
      <Section icon={<SolarIcon />} title="Why Solar Energy">
        <Typography variant="body1" color="#475569" lineHeight={1.9}>
          Solar energy is one of the most abundant and sustainable resources on the planet. As fossil fuel reserves dwindle and climate change accelerates, solar power offers a clean, reliable, and increasingly affordable alternative. Singapore receives an average of 4–5 peak sun hours per day — far above the global average — making it one of the most solar-favorable locations in Southeast Asia.
        </Typography>
        <Typography variant="body1" color="#475569" lineHeight={1.9} mt={2}>
          Transitioning to solar is not just an environmental decision. It is a financial one. With rising electricity tariffs and falling panel costs, solar installations today deliver compelling returns on investment within 5–8 years, and generate clean revenue for decades beyond.
        </Typography>
      </Section>

      {/* How Solar Can Help */}
      <Section icon={<HomeIcon />} title="How Solar Energy Can Help">
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 3,
        }}>
          {[
            {
              title: 'Residential Homes',
              body: "Rooftop panels offset electricity bills and export surplus energy to the grid under Singapore's Enhanced Central Intermediary Scheme (ECIS) — turning your roof into passive income.",
            },
            {
              title: 'Commercial Buildings',
              body: 'Flat rooftops on warehouses and offices are prime solar real estate. Cut operating costs, meet ESG targets, and lease unused roof space to developers.',
            },
            {
              title: 'HDB & Strata Properties',
              body: 'Community solar programmes let entire estates share rooftop installation benefits, lowering utility costs across all units without individual upfront investment.',
            },
            {
              title: 'Industrial Properties',
              body: 'High energy consumers benefit most from solar offsets. Pair panels with battery storage for round-the-clock savings and energy independence.',
            },
          ].map((card) => (
            <Box key={card.title} sx={{
              p: 3, backgroundColor: '#fff', borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}>
              <Typography fontWeight={700} color="#1e293b" mb={1}>{card.title}</Typography>
              <Typography variant="body1" color="#64748b" lineHeight={1.7}>{card.body}</Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* Our Mission */}
      <Section icon={<TeamIcon />} title="Our Mission">
        <Typography variant="body1" color="#475569" lineHeight={1.9} mb={4}>
          SolarYield AI exists to make solar intelligence effortless and accessible for every property owner in Singapore. We believe that knowing your roof's true earning potential should not require an engineering degree or a costly consultant — it should take under a minute.
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 3,
          mt: 1,
        }}>
          {[
            {
              title: 'Built on Real Singapore Data',
              body: "Our predictions are powered entirely by official government data. Everything is grounded in more than 10 years of real, locally verified records.",
            },
            {
              title: 'Weather-Aware Forecasting',
              body: "Singapore's monsoon seasons directly affect how much solar energy your roof can generate. Our system accounts for rainfall likelihood and sun hours, etc. — not a generic tropical average.",
            },
            {
              title: 'From Sunshine to Kilowatt Hours',
              body: 'We convert weather forecasts into real energy numbers using the same physical formula trusted by the global solar industry. Roof size, local sun conditions, and panel performance are all factored in.',
            },
            {
              title: 'Your Savings in Dollar Terms',
              body: 'We forecast Singapore electricity tariffs over the next 12 months and multiply them against your predicted yield to show exactly how much money your installation is expected to save.',
            },
            {
              title: 'Instant ROI, No Guesswork',
              body: 'Enter your postal code and roof size and get a full 12-month financial forecast in under a minute — payback period, annual savings, and carbon offset included.',
            },
            {
              title: 'Pro Intelligence for Serious Investors',
              body: 'Free users get summary of historical data and installation cost estimates. Pro users are able to unlock AI yield forecasts, tariff projections, ROI timelines, and our AI consultant for property-specific questions.',
            },
          ].map((card) => (
            <Box key={card.title} sx={{
              p: 3, backgroundColor: '#fff', borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}>
              <Typography fontWeight={700} color="#1e293b" mb={1}>{card.title}</Typography>
              <Typography variant="body1" color="#64748b" lineHeight={1.7}>{card.body}</Typography>
            </Box>
          ))}
        </Box>
      </Section>
    </Box>
  );
};

export default AboutUsPage;