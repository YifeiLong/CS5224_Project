import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, CircularProgress, Divider, Alert } from '@mui/material';
import { useUser } from '../context/UserContext';
import { registerUser, loginUser } from '../services/api';

// ── Validators ─────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isValidPassword = (password) => password.length >= 8;

const LoginModal = ({ open, onClose }) => {
  const { setCurrentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // ── Field-level validation ─────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (isRegister && !form.name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address (e.g. user@email.com).';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (!isValidPassword(form.password)) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      let data;
      if (isRegister) {
        // ── REGISTER ──────────────────────────────────────────────
        // Calls POST /auth/register
        // Backend should save user to DB and return { user, token }
        data = await registerUser(form.name.trim(), form.email.trim(), form.password);
      } else {
        // ── LOGIN ─────────────────────────────────────────────────
        // Calls POST /auth/login
        // Backend checks if email exists and password matches
        // Returns { user: { id, name, email, isPro }, token }
        data = await loginUser(form.email.trim(), form.password);
      }

      // Store JWT so authHeaders() picks it up for all future requests
      localStorage.setItem('solar_token', data.token);

      // Update global user state — isPro comes from the DB via backend
      setCurrentUser(data.user);

      setForm({ name: '', email: '', password: '' });
      setErrors({});
      onClose();

    } catch (err) {
      // Backend error messages: "Email already exists", "No account found", "Incorrect password"
      setServerError(err.message || 'Something went wrong. Please try again.');

      // Auto-switch to sign up if backend says user not found
      if (!isRegister && err.message?.toLowerCase().includes('sign up')) {
        setTimeout(() => setIsRegister(true), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    setIsRegister(!isRegister);
    setServerError('');
    setErrors({});
    setForm({ name: '', email: '', password: '' });
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear field error as user types
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (serverError) setServerError('');
  };

  return (
    <Modal open={open} onClose={onClose} disableScrollLock>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '90vw', md: '420px' },
        backgroundColor: '#fff', borderRadius: 3, p: { xs: 3, md: 4 },
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', outline: 'none',
      }}>
        <Typography variant="h5" fontWeight={800} textAlign="center" color="#1e293b" mb={0.5}>
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </Typography>
        <Typography variant="body2" textAlign="center" color="#64748b" mb={3}>
          {isRegister ? 'Sign up to get started with SolarYield AI' : 'Log in to your SolarYield AI account'}
        </Typography>

        {/* Server-level error (wrong password, email not found, etc.) */}
        {serverError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
            {serverError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isRegister && (
            <TextField
              fullWidth label="Full Name" variant="outlined" size="small"
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          )}

          <TextField
            fullWidth label="Email Address" type="email" variant="outlined" size="small"
            value={form.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
          />

          <TextField
            fullWidth label="Password" type="password" variant="outlined" size="small"
            value={form.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            error={!!errors.password}
            helperText={errors.password || (isRegister ? 'Minimum 8 characters' : '')}
          />

          {!isRegister && (
            <Typography variant="caption" color="#f59e0b"
              sx={{ alignSelf: 'flex-end', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Forgot password?
            </Typography>
          )}

          <Button
            fullWidth variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              height: '48px', backgroundColor: '#f59e0b', fontWeight: 'bold',
              fontSize: '1rem', textTransform: 'none', mt: 1,
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            {loading
              ? <CircularProgress size={24} sx={{ color: '#fff' }} />
              : isRegister ? 'Create Account' : 'Log In'}
          </Button>

          <Divider><Typography variant="caption" color="#94a3b8">or</Typography></Divider>

          <Typography variant="body2" textAlign="center" color="#64748b">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span onClick={handleSwitch}
              style={{ color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}>
              {isRegister ? 'Log In' : 'Sign Up'}
            </span>
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default LoginModal;