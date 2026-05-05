'use client';

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import LoginPage from '../components/LoginPage';
import NotificationsList from '../components/NotificationsList';
import { apiClient } from '../utils/api';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    name: string;
    rollNo: string;
  } | null;
}

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const [showLoginForm, setShowLoginForm] = useState(true);
  const [registrationData, setRegistrationData] = useState({
    email: '',
    name: '',
    rollNo: '',
    accessCode: '',
    mobileNo: '',
    githubUsername: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    clientID: '',
    clientSecret: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        email: registrationData.email.trim(),
        name: registrationData.name.trim(),
        rollNo: registrationData.rollNo.trim(),
        accessCode: registrationData.accessCode.trim(),
        mobileNo: registrationData.mobileNo.trim(),
        githubUsername: registrationData.githubUsername.trim(),
      };

      const result = await apiClient.register(
        payload.email,
        payload.name,
        payload.rollNo,
        payload.accessCode
        ,payload.mobileNo,
        payload.githubUsername
      );

      const clientID = result.clientID || result.clientId || '';
      const clientSecret = result.clientSecret || result.client_secret || '';

      if (!clientID || !clientSecret) {
        throw new Error('Invalid registration response');
      }

      setCredentials({
        clientID,
        clientSecret,
      });

      setRegistrationData({
        email: '',
        name: '',
        rollNo: '',
        accessCode: '',
        mobileNo: '',
        githubUsername: '',
      });

      setShowLoginForm(true);
      apiClient.submitLog(
        'frontend',
        'info',
        'auth',
        `User registered: ${clientID}`
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      apiClient.submitLog('frontend', 'error', 'auth', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (
    email: string,
    clientID: string,
    clientSecret: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.getToken(email, clientID, clientSecret);

      setAuthState({
        isAuthenticated: true,
        user: {
          email,
          name: email.split('@')[0],
          rollNo: email,
        },
      });

      apiClient.submitLog('frontend', 'info', 'auth', `User logged in: ${email}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      apiClient.submitLog('frontend', 'error', 'auth', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
    apiClient.submitLog('frontend', 'info', 'auth', 'User logged out');
  };

  if (authState.isAuthenticated && authState.user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Campus Notification Platform
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Welcome, {authState.user.email}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                size="small"
              >
                Logout
              </Button>
            </Box>
          </Box>

          <NotificationsList userEmail={authState.user.email} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
          Campus Notifications
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {showLoginForm ? (
          <>
            <LoginPage
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowLoginForm(false)}
              loading={loading}
              credentials={credentials}
            />
          </>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Register
              </Typography>

              <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      email: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Name"
                  value={registrationData.name}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      name: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Roll Number"
                  value={registrationData.rollNo}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      rollNo: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Mobile Number"
                  value={registrationData.mobileNo}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      mobileNo: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="GitHub Username"
                  value={registrationData.githubUsername}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      githubUsername: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Access Code"
                  type="password"
                  value={registrationData.accessCode}
                  onChange={(e) =>
                    setRegistrationData({
                      ...registrationData,
                      accessCode: e.target.value,
                    })
                  }
                  required
                  fullWidth
                  disabled={loading}
                  helperText="Use the access code shared in your email"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setShowLoginForm(true)}
                    disabled={loading}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}
