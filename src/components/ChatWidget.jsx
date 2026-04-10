import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, IconButton, Avatar } from '@mui/material';
import { useUser } from '../context/UserContext';
import { sendChatMessage } from '../services/api';

// ── Message bubble ─────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isDisclaimer = message.role === 'disclaimer';

  if (isDisclaimer) {
    return (
      <Box sx={{ mx: 1, mb: 1.5, px: 2, py: 1, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px dashed #e2e8f0' }}>
        <Typography sx={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic' }}>
          ⚠ {message.content}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 1.5, alignItems: 'flex-end', gap: 1,
    }}>
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1e293b', fontSize: 14, flexShrink: 0 }}>☀</Avatar>
      )}
      <Box sx={{
        maxWidth: '80%', px: 2, py: 1.2,
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        backgroundColor: isUser ? '#f59e0b' : '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: isUser ? 'none' : '1px solid #e2e8f0',
      }}>
        <Typography variant="body2" sx={{ color: isUser ? '#fff' : '#1e293b', lineHeight: 1.6 }}>
          {message.content}
        </Typography>
        <Typography sx={{ fontSize: 10, color: isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8', mt: 0.3, textAlign: 'right' }}>
          {message.time}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Typing indicator ───────────────────────────────────────────────
const TypingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
    <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1e293b', fontSize: 14, flexShrink: 0 }}>☀</Avatar>
    <Box sx={{ px: 2, py: 1.2, borderRadius: '16px 16px 16px 4px', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{
          width: 7, height: 7, borderRadius: '50%', backgroundColor: '#94a3b8',
          animation: 'bounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' },
          },
        }} />
      ))}
    </Box>
  </Box>
);

// ── ChatWidget ─────────────────────────────────────────────────────
const ChatWidget = ({ onOpenPayment, onOpenLogin }) => {
  const { isPro, currentUser, solarData } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your SolarExpert AI consultant. Ask me anything about your solar analysis, ROI, installation, or Singapore solar incentives.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { role: 'user', content: trimmed, time: getTimestamp() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await sendChatMessage([...messages, userMessage], solarData);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        time: getTimestamp(),
      }]);
      if (data.disclaimer) {
        setMessages(prev => [...prev, {
          role: 'disclaimer',
          content: data.disclaimer,
          time: getTimestamp(),
        }]);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, the advisory service is unavailable. Please try again shortly.',
        time: getTimestamp(),
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoggedIn = !!currentUser;
  const canChat = isLoggedIn && isPro;

  return (
    <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 50 }}>
      {isOpen && (
        <Paper elevation={8} sx={{
          width: 360, height: 500,
          display: 'flex', flexDirection: 'column',
          mb: 2, borderRadius: 3, overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}>
          {/* ── Header ── */}
          <Box sx={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff', px: 2.5, py: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: '#f59e0b', fontSize: 16 }}>☀</Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>SolarExpert AI</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                  {canChat ? '● Online' : 'Pro feature'}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </IconButton>
          </Box>

          {/* ── Body ── */}
          <Box sx={{ flexGrow: 1, backgroundColor: '#f8fafc', p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {!isLoggedIn && (
              <Box sx={{ m: 'auto', textAlign: 'center', px: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </Box>
                <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5}>Login Required</Typography>
                <Typography variant="body2" color="#64748b" mb={2.5}>
                  Please log in and upgrade to Pro to access SolarExpert AI.
                </Typography>
                <Button fullWidth variant="contained" onClick={onOpenLogin} sx={{
                  backgroundColor: '#f59e0b', textTransform: 'none', fontWeight: 700,
                  '&:hover': { backgroundColor: '#d97706' },
                }}>
                  Log In
                </Button>
              </Box>
            )}

            {isLoggedIn && !isPro && (
              <Box sx={{ m: 'auto', textAlign: 'center', px: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </Box>
                <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5}>Pro Feature</Typography>
                <Typography variant="body2" color="#64748b" mb={0.5}>
                  Signed in as <strong>{currentUser.email}</strong>
                </Typography>
                <Typography variant="body2" color="#64748b" mb={2.5}>
                  Upgrade to Pro to unlock the AI consultant.
                </Typography>
                <Button fullWidth variant="contained" onClick={onOpenPayment} sx={{
                  backgroundColor: '#f59e0b', textTransform: 'none', fontWeight: 700,
                  '&:hover': { backgroundColor: '#d97706' },
                }}>
                  Upgrade to Pro
                </Button>
              </Box>
            )}

            {canChat && (
              <>
                {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
              </>
            )}
          </Box>

          {/* ── Input ── */}
          <Box sx={{ p: 1.5, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth multiline maxRows={3} size="small"
              placeholder={canChat ? 'Ask about solar yield, ROI, incentives...' : 'Upgrade to Pro to chat'}
              disabled={!canChat}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3, fontSize: 14,
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!canChat || !input.trim()}
              sx={{
                backgroundColor: canChat && input.trim() ? '#f59e0b' : '#e2e8f0',
                color: canChat && input.trim() ? '#fff' : '#94a3b8',
                borderRadius: 2, width: 38, height: 38, flexShrink: 0,
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: canChat && input.trim() ? '#d97706' : '#e2e8f0' },
                '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' },
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* ── Toggle button ── */}
      <Button onClick={() => setIsOpen(!isOpen)} sx={{
        width: 60, height: 60, borderRadius: '50%',
        backgroundColor: '#1e293b', color: '#fff', fontSize: 24,
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        minWidth: 'unset',
        '&:hover': { backgroundColor: '#0f172a' },
      }}>
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </Button>
    </Box>
  );
};

export default ChatWidget;