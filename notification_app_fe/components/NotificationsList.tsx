import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Grid,
  Pagination,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { apiClient } from '../utils/api';

interface Notification {
  ID: string;
  Type: string;
  Message: string;
  IsRead: boolean;
  Timestamp: string;
}

interface NotificationsListProps {
  userEmail: string;
}

const getTypeColor = (type: string): any => {
  switch (type) {
    case 'Event':
      return 'primary';
    case 'Result':
      return 'success';
    case 'Placement':
      return 'warning';
    default:
      return 'default';
  }
};

export default function NotificationsList({ userEmail }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [selectedType, currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getNotifications(
        itemsPerPage,
        currentPage,
        selectedType
      );

      setNotifications(result.notifications);
      apiClient.submitLog(
        'frontend',
        'info',
        'notifications',
        `Fetched ${result.notifications.length} notifications`
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch notifications';
      setError(errorMsg);
      apiClient.submitLog('frontend', 'error', 'notifications', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id, true);
      fetchNotifications();
      apiClient.submitLog('frontend', 'info', 'notifications', `Marked notification as read: ${id}`);
    } catch (err) {
      apiClient.submitLog('frontend', 'error', 'notifications', 'Failed to mark notification as read');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filter by Type
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={selectedType === '' ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedType('');
              setCurrentPage(1);
            }}
          >
            All
          </Button>

          {['Event', 'Result', 'Placement'].map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'contained' : 'outlined'}
              onClick={() => {
                setSelectedType(type);
                setCurrentPage(1);
              }}
            >
              {type}
            </Button>
          ))}
        </Box>
      </Box>

      {notifications.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">
              No notifications found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            {notifications.map((notification) => (
              <Card
                key={notification.ID}
                sx={{
                  opacity: notification.IsRead ? 0.7 : 1,
                  borderLeft: notification.IsRead ? 'none' : '4px solid #1976d2',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={notification.Type}
                          color={getTypeColor(notification.Type)}
                          size="small"
                          variant="outlined"
                        />
                        {notification.IsRead && (
                          <MarkEmailReadOutlinedIcon sx={{ fontSize: '1rem', color: 'green' }} />
                        )}
                      </Box>

                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {notification.Message}
                      </Typography>

                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(notification.Timestamp)}
                      </Typography>
                    </Box>

                    {!notification.IsRead && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMarkAsRead(notification.ID)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(notifications.length / itemsPerPage)}
              page={currentPage}
              onChange={(e, value) => setCurrentPage(value)}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
