import { useState } from 'react';
import { Container, Paper, Box, TextField, Button, Typography, Tab, Tabs } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ padding: '16px 0' }}>
      {value === index && children}
    </div>
  );
}

interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      let response;
      if (tab === 0) {
        response = await api.post<AuthResponse>('/auth/login', { email, password });
      } else {
        response = await api.post<AuthResponse>('/auth/register', { name, email, password });
      }
      const { token, userId, name: userName } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName);
      window.dispatchEvent(new Event('authStateChanged'));
      navigate('/');
    } catch (err: any) {
      // Support both general and field-specific errors
      const backend = err.response?.data;
      if (backend?.errors && typeof backend.errors === 'object') {
        setFieldErrors(backend.errors);
        setError(backend.error || 'Authentication failed');
      } else {
        setError(backend?.error || 'Authentication failed');
      }
    }
  };

  return (
    <Container component="main" maxWidth="sm" className="auth-container">
      <Paper elevation={3} className="auth-paper">
        <Typography variant="h4" align="center" gutterBottom>
          Welcome
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
        </Box>
        <TabPanel value={tab} index={0}>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              margin="normal"
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Register
            </Button>
          </form>
        </TabPanel>
        {error && (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Auth;