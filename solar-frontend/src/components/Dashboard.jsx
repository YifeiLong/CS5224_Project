import React from 'react';
import { Box, Typography, Grid, Card, Button, Chip } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useUser } from '../context/UserContext';

// ── Palette ────────────────────────────────────────────────────────
const COLORS = {
  pessimistic: '#ef4444',
  neutral:     '#10b981',
  optimistic:  '#3b82f6',
  sun:         '#f59e0b',
  rain:        '#60a5fa',
};

// ── Custom Tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter
    || ((v) => typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : v);
  return (
    <Box sx={{
      backgroundColor: '#1e293b', borderRadius: 2, p: 2,
      minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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
          <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {fmt(p.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Custom Legend ──────────────────────────────────────────────────
const CustomLegend = ({ payload }) => (
  <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
    {payload?.map((entry) => (
      <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 24, height: 3, borderRadius: 2, backgroundColor: entry.color }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{entry.value}</Typography>
      </Box>
    ))}
  </Box>
);

// ── Section Header ─────────────────────────────────────────────────
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
      <Typography variant="h5" fontWeight={800} sx={{ color: dark ? '#fff' : '#1e293b', letterSpacing: '-0.5px' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: dark ? '#94a3b8' : '#92400e', mt: 0.5 }}>
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
const StatCard = ({ label, value, sub, color }) => (
  <Card sx={{
    p: 3.5, height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3,
    position: 'relative', overflow: 'hidden', textAlign: 'center',
  }}>
    <Box sx={{
      position: 'absolute', top: -20, right: -20,
      width: 100, height: 100, borderRadius: '50%',
      backgroundColor: color, opacity: 0.07,
    }} />
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
      {value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: 14, color: '#94a3b8', mt: 1 }}>{sub}</Typography>
    )}
  </Card>
);

// ── Chart Card ─────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children }) => (
  <Card sx={{
    p: 4, border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    borderRadius: 3, backgroundColor: '#fff',
  }}>
    <Typography variant="subtitle1" fontWeight={700} color="#1e293b">{title}</Typography>
    {subtitle && <Typography variant="body2" color="#94a3b8" mb={2}>{subtitle}</Typography>}
    {children}
  </Card>
);

// ── Scenario Legend (hardcoded colors — gradient fills break Recharts legend) ──
const ScenarioLegend = () => (
  <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
    {[
      { label: 'Pessimistic', color: COLORS.pessimistic },
      { label: 'Neutral',     color: COLORS.neutral },
      { label: 'Optimistic',  color: COLORS.optimistic },
    ].map(({ label, color }) => (
      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 24, height: 12, borderRadius: 1, backgroundColor: color }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</Typography>
      </Box>
    ))}
  </Box>
);

const axisTick = { fill: '#1e293b', fontSize: 12, fontWeight: 600 };

// ── Dashboard ──────────────────────────────────────────────────────
const Dashboard = ({ onOpenPayment, onOpenLogin }) => {
  const { isPro, solarData, currentUser } = useUser();
  if (!solarData) return null;

  const { freeTier, proTier } = solarData;
  const handleUpgrade = () => !currentUser ? onOpenLogin() : onOpenPayment();

  const fmtSgd   = (n) => n != null ? `S$${Math.round(n).toLocaleString()}` : '—';
  const fmtYears = (n) => n != null ? `${parseFloat(n.toFixed(1))} yrs` : '>30 yrs';
  const fmtRoi   = (n) => n != null ? `${(n * 100).toFixed(1)}%` : '—';

  return (
    <Box id="dashboard-section" sx={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px 60px' }}>

      {/* Connector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
        <Box sx={{ flex: 1, height: 2, background: 'linear-gradient(to right, #f59e0b, transparent)', borderRadius: 1 }} />
        <Box sx={{ px: 2.5, py: 1, backgroundColor: '#1e293b', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Analysis Results
          </Typography>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
        </Box>
        <Box sx={{ flex: 1, height: 2, background: 'linear-gradient(to left, #f59e0b, transparent)', borderRadius: 1 }} />
      </Box>

      {/* ── FREE TIER ── */}
      <SectionHeader
        title="Descriptive Solar Analysis"
        subtitle="Historical meteorological and tariff data in past 12 months based on the input postal code"
        dark={false}
      />

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            label="Avg Daily Sun Hours"
            value={`${freeTier.historicalAvgSunHours} hrs`}
            sub="Historical 12-month average"
            color="#f59e0b"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            label="Avg Rainy Days / Month"
            value={freeTier.historicalAvgRainyDays != null ? `${parseFloat(freeTier.historicalAvgRainyDays.toFixed(1))}` : '—'}
            sub="Historical 12-month average"
            color="#60a5fa"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            label="Avg Electricity Tariff / kWh"
            value={freeTier.historicalAvgTariffCents != null ? `${freeTier.historicalAvgTariffCents.toFixed(2)} ¢` : '—'}
            sub="Historcal 12-month average of electricity cost"
            color="#8b5cf6"
          />
        </Box>
                <Box sx={{ flex: 1 }}>
          <StatCard
            label="Est. Installation Cost of Solar PV System"
            value={fmtSgd(freeTier.estCost)}
            sub="Based on system size"
            color="#10b981"
          />
        </Box>
      </Box>
      <Box sx={{ mt:10 }} />

      {/* Three vertically stacked line charts — all 12 past months, auto-scaled y-axis */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Sun Hours */}
        <Card sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5} textAlign="center">Monthly Sun Hours</Typography>
          <Box sx={{ height: 180, mt: 1.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={freeTier.sunHoursChart} margin={{ top: 8, right: 32, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} interval={0} />
                <YAxis tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name="Sun Hours (hrs)"
                  stroke={COLORS.sun} strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS.sun, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Rainy Days */}
        <Card sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5} textAlign="center">Rainy Days</Typography>
          <Box sx={{ height: 180, mt: 1.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={freeTier.rainyDaysChart} margin={{ top: 8, right: 32, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} interval={0} />
                <YAxis tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name="Rainy Days"
                  stroke={COLORS.rain} strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS.rain, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Tariff */}
        <Card sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5} textAlign="center">Electricity Tariff ¢/kWh</Typography>
          <Box sx={{ height: 180, mt: 1.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={freeTier.tariffChart} margin={{ top: 8, right: 32, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} interval={0} />
                <YAxis tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name="Tariff (¢/kWh)"
                  stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>

      </Box>

      {/* Divider */}
      <Box sx={{ my: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        <Box sx={{ px: 2, py: 0.5, backgroundColor: '#f1f5f9', borderRadius: 10 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Pro Exclusive
          </Typography>
        </Box>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
      </Box>

      {/* ── PRO TIER ── */}
      <SectionHeader
        title="AI-Driven Yield & ROI Forecast"
        subtitle={
          <>
            Prophet ML for the next 12 months on pessimistic / neutral / optimistic scenarios
            <br />
            In pessimistic scenarios, forecast with a conservative perspective; In optimistic scenarios, forecast with a positive mindset
          </>
        }
        dark={true}
      />

      {isPro ? (
        <>
          {/* Pro stat cards */}
          <Box sx={{ display: 'flex', gap: 3, mb: 5 }}>
            <Box sx={{ flex: 1 }}>
              <StatCard
                label="Payback Period"
                value={fmtYears(proTier.roiYears)}
                sub="Neutral scenario"
                color="#10b981"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                label="10-Year ROI"
                value={fmtRoi(proTier.roi10y)}
                sub="Neutral scenario"
                color="#8b5cf6"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                label="Annual Savings"
                value={fmtSgd(proTier.annualSavings)}
                sub="Neutral scenario"
                color="#ec4899"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StatCard
                label="Carbon Offset"
                value={`${proTier.carbonOffset?.toLocaleString()} kg`}
                sub="CO₂/year saved"
                color="#06b6d4"
              />
            </Box>
          </Box>
          <Box sx={{ mt: 10 }} />

          {/* Chart 1: Grouped bar — 3 scenario yields */}
          <Box sx={{ mb: 5 }}>
            <ChartCard
              title="Predicted Monthly PV Yield (Sunlight Conversion into Electricity) for next 12 months"
              subtitle="kWh generated per month across weather under three types of scenarios"
            >
              <Box sx={{ height: 360, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proTier.future12MonthsYield} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barCategoryGap="28%">
                    <defs>
                      <linearGradient id="gradPess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.pessimistic} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={COLORS.pessimistic} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradNeut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.neutral} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={COLORS.neutral} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.optimistic} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={COLORS.optimistic} stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={8} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={50} dx={-4}
                      label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 12, fontWeight: 600, fill: '#475569' } }}
                    />
                    <Tooltip content={<CustomTooltip valueFormatter={(v) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`} />} cursor={{ fill: 'rgba(241,245,249,0.6)' }} />
                    <Legend content={<ScenarioLegend />} />
                    <Bar dataKey="Pessimistic" fill="url(#gradPess)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Neutral"     fill="url(#gradNeut)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Optimistic"  fill="url(#gradOpt)"  radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Box>

          {/* Chart 1b: Monthly savings — mirrors roi.py savings_sgd computation */}
          <Box sx={{ mb: 5 }}>
            <ChartCard
              title="Monthly Electricity Cost Avoided (Neutral Scenario) for next 12 months"
              subtitle="Full PV yield consumed × forecast monthly tariff → Equivalent monthly electricity bill reduction"
            >
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={proTier.monthlySavingsChart} margin={{ top: 10, right: 32, left: 5, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={8} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} dx={-4}
                      domain={['auto', dataMax => parseFloat((dataMax * 1.02).toFixed(2))]}
                      tickFormatter={(v) => `S$${v.toFixed(2)}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="gridCostAvoidedSgd" name="Grid Cost Avoided (S$)"
                      stroke={COLORS.neutral} strokeWidth={3}
                      dot={{ r: 4, fill: COLORS.neutral, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Box>

          {/* Chart 2: Quarterly cashflow + payback cards side by side */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
            {/* Breakeven chart (quarterly, 5 points) */}
            <Box sx={{ flex: 2 }}>
              <ChartCard
                title="Cumulative Cashflow Breakeven Analysis for next 4 quarters"
                subtitle="Measured at the start of each quarter"
              >
                <Box sx={{ height: 460, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={proTier.quarterlyCashflow} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={8} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} width={72} dx={-4}
                        tickFormatter={(v) => `S$${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip content={<CustomTooltip valueFormatter={(v) => `S$${Math.round(v).toLocaleString()}`} />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                      <Legend content={<ScenarioLegend />} />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="6 3" strokeWidth={2}
                        label={{ value: 'Breakeven', position: 'insideTopRight', fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                      />
                      <Line type="monotone" dataKey="Pessimistic" stroke={COLORS.pessimistic} strokeWidth={2.5}
                        dot={{ r: 5, fill: COLORS.pessimistic, strokeWidth: 0 }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
                      <Line type="monotone" dataKey="Neutral"     stroke={COLORS.neutral}     strokeWidth={3}
                        dot={{ r: 5, fill: COLORS.neutral,     strokeWidth: 0 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Optimistic"  stroke={COLORS.optimistic}  strokeWidth={2.5}
                        dot={{ r: 5, fill: COLORS.optimistic,  strokeWidth: 0 }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </ChartCard>
            </Box>

            {/* Payback period cards stacked vertically */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StatCard
                label="Optimistic Payback Period"
                value={fmtYears(proTier.roiYearsOptimistic)}
                sub="Best-case scenario"
                color={COLORS.optimistic}
              />
              <StatCard
                label="Neutral Payback Period"
                value={fmtYears(proTier.roiYears)}
                sub="Expected scenario"
                color={COLORS.neutral}
              />
              <StatCard
                label="Pessimistic Payback"
                value={fmtYears(proTier.roiYearsPessimistic)}
                sub="Worst-case scenario"
                color={COLORS.pessimistic}
              />
            </Box>
          </Box>
        </>
      ) : (
        /* Locked overlay */
        <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, backgroundColor: '#fff', overflow: 'hidden' }}>
          <Box sx={{ px: 4, pt: 3, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
              Future Yield and ROI Forecast
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', height: 420, px: 2, pb: 2 }}>
            <Box sx={{ height: '100%', filter: 'blur(7px)', pointerEvents: 'none' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proTier.future12MonthsYield} margin={{ top: 10, right: 20, left: 10, bottom: 10 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Bar dataKey="Pessimistic" fill={COLORS.pessimistic} radius={[4,4,0,0]} />
                  <Bar dataKey="Neutral"     fill={COLORS.neutral}     radius={[4,4,0,0]} />
                  <Bar dataKey="Optimistic"  fill={COLORS.optimistic}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
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
              <Typography variant="body1" color="#64748b" textAlign="center" maxWidth={380} mb={3}>
                Get 3-scenario yield forecasts, breakeven cashflow analysis, and ROI projections with Pro.
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
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;