import React from 'react';
import { Box, Typography, Grid, Card, Button, Chip } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { useUser } from '../context/UserContext';

// ── Custom Tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      backgroundColor: '#1e293b', borderRadius: 2, p: 2,
      minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }}>
      <Typography sx={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
            <Typography sx={{ color: '#cbd5e1', fontSize: 12 }}>{p.name}</Typography>
          </Box>
          <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{p.value}</Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Custom Legend ──────────────────────────────────────────────────
const CustomLegend = ({ payload }) => (
  <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2 }}>
    {payload?.map((entry) => (
      <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 24, height: 3, borderRadius: 2, backgroundColor: entry.color }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{entry.value}</Typography>
      </Box>
    ))}
  </Box>
);

// ── Section Header — dark banner style ────────────────────────────
const SectionHeader = ({ title, subtitle, dark }) => (
  <Box sx={{
    px: 4, py: 3.5, mb: 4, borderRadius: 3,
    background: dark
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: dark ? 'none' : '1px solid #fde68a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 2,
  }}>
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{
        color: dark ? '#fff' : '#1e293b',
        letterSpacing: '-0.5px',
      }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{
          color: dark ? '#94a3b8' : '#92400e',
          mt: 0.5,
        }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {dark && (
      <Chip label="PRO FEATURE" size="small" sx={{
        backgroundColor: '#f59e0b', color: '#fff',
        fontWeight: 800, fontSize: 10, letterSpacing: 1,
      }} />
    )}
  </Box>
);

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <Card sx={{
    p: 4, height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3,
    position: 'relative', overflow: 'hidden',
  }}>
    <Box sx={{
      position: 'absolute', top: -20, right: -20,
      width: 100, height: 100, borderRadius: '50%',
      backgroundColor: color, opacity: 0.07,
    }} />
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>
      {value}
    </Typography>
  </Card>
);

// ── Chart Card ─────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <Card sx={{
    p: 4, mb: 0,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    borderRadius: 3, backgroundColor: '#fff',
  }}>
    <Typography variant="subtitle1" fontWeight={700} color="#1e293b" mb={3}>{title}</Typography>
    {children}
  </Card>
);

const axisTick = { fontFamily: 'inherit', fontSize: 13, fontWeight: 600, fill: '#475569' };

// ── Dashboard ──────────────────────────────────────────────────────
const Dashboard = ({ onOpenPayment, onOpenLogin }) => {
  const { isPro, solarData, currentUser } = useUser();
  if (!solarData) return null;

  const handleUpgrade = () => !currentUser ? onOpenLogin() : onOpenPayment();

  return (
    <Box id="dashboard-section" sx={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px 60px' }}>

      {/* Visual connector from hero */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, mb: 5,
      }}>
        <Box sx={{
          flex: 1, height: 2,
          background: 'linear-gradient(to right, #f59e0b, transparent)',
          borderRadius: 1,
        }} />
        <Box sx={{
          px: 2.5, py: 1,
          backgroundColor: '#1e293b',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Analysis Results
          </Typography>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
        </Box>
        <Box sx={{
          flex: 1, height: 2,
          background: 'linear-gradient(to left, #f59e0b, transparent)',
          borderRadius: 1,
        }} />
      </Box>

      {/* ── Free Tier Section Header ── */}
      <SectionHeader
        title="Descriptive Solar Analysis"
        subtitle="Historical meterological data based on your property detail input above"
        dark={false}
      />

      {/* ── Stat cards ── */}
      <Grid container spacing={5} sx={{ mb: 10 }}>
        <Grid item xs={12} md={5}>
          <StatCard
            label="Historical Avg Sun Hours"
            value={`${solarData.freeTier.historicalAvgSunHours} hrs/day`}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <StatCard
            label="Est. Installation Cost"
            value={`S$${solarData.freeTier.estCost.toLocaleString()}`}
            color="#10b981"
          />
        </Grid>
      </Grid>


      {/* ── Past 12 months chart ── */}
      <ChartCard title="Past 12 Months — Rainfall & Sunlight">
        <Box sx={{ height: 380, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={solarData.freeTier.past12Months} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={10} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={50} dx={-8} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              <Legend content={<CustomLegend />} />
              <Line type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="Rainfall (mm)" />
              <Line type="monotone" dataKey="sunlight" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="Sunlight (hrs)" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </ChartCard>

      {/* ── Divider between sections ── */}
      <Box sx={{ my: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        <Box sx={{ px: 2, py: 0.5, backgroundColor: '#f1f5f9', borderRadius: 10 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Pro Exclusive
          </Typography>
        </Box>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
      </Box>

      {/* ── Pro Section Header ── */}
      <SectionHeader
        title="AI-Driven Future Predictions"
        subtitle="Machine-learning powered 12-month solar yield forecast for your property"
        dark={true}
      />

      {/* ── Pro Chart ── */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, backgroundColor: '#fff', overflow: 'hidden' }}>
        <Box sx={{ px: 4, pt: 3, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
            Future 12 Months — Predicted Solar Energy Yield
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', height: 420, px: 2, pb: 2 }}>
          <Box sx={{
            height: '100%',
            filter: isPro ? 'none' : 'blur(7px)',
            transition: 'filter 0.3s',
            pointerEvents: isPro ? 'auto' : 'none',
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={solarData.proTier.future12MonthsYield} margin={{ top: 10, right: 20, left: 10, bottom: 10 }} barSize={28} barCategoryGap="35%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={10} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={60} dx={-8}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 13, fontWeight: 600, fill: '#475569' } }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                <Legend content={<CustomLegend />} />
                <Bar dataKey="yield" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Predicted Energy Yield (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {!isPro && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(2px)', borderRadius: 2, zIndex: 10,
            }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </Box>
              <Typography variant="h5" fontWeight={800} color="#1e293b" textAlign="center" mb={0.5}>
                UNLOCK MORE
              </Typography>
              <Typography variant="body1" color="#64748b" textAlign="center" maxWidth={360} mb={!currentUser ? 1 : 3}>
                Get precise forecasts and maximize your solar ROI with a Pro plan.
              </Typography>

              <Button variant="contained" onClick={handleUpgrade} sx={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', px: 4, py: 1.5,
                fontSize: '1rem', fontWeight: 700,
                textTransform: 'none', borderRadius: 2,
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' },
              }}>
                {currentUser ? 'Upgrade to Pro — $9.9/month' : 'Log In to Upgrade'}
              </Button>
            </Box>
          )}
        </Box>
      </Card>

    </Box>
  );
};

export default Dashboard;