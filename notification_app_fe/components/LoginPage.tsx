import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

interface LoginPageProps {
  onLogin: (email: string, clientID: string, clientSecret: string) => void;
  onSwitchToRegister: () => void;
  loading: boolean;
  credentials: {
    clientID: string;
    clientSecret: string;
  };
}

export default function LoginPage({
  onLogin,
  onSwitchToRegister,
  loading,
  credentials,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [clientID, setClientID] = useState(credentials.clientID || '');
  const [clientSecret, setClientSecret] = useState(credentials.clientSecret || '');

  useEffect(() => {
    setClientID(credentials.clientID || '');
    setClientSecret(credentials.clientSecret || '');
  }, [credentials.clientID, credentials.clientSecret]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, clientID, clientSecret);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Login
        </Typography>

        

        {credentials.clientID && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Registration successful. Latest Client ID and Client Secret are auto-filled below.
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Client ID"
            value={clientID}
            onChange={(e) => setClientID(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="Required for login (auto-filled after signup)"
            inputProps={{ autoComplete: 'off' }}
          />

          <TextField
            label="Client Secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="Required for login (auto-filled after signup)"
            inputProps={{ autoComplete: 'off' }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
