import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (typeof (import.meta) !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async register(
    email: string,
    name: string,
    rollNo: string,
    accessCode: string,
    mobileNo: string,
    githubUsername: string
  ) {
    try {
      const response = await this.client.post('/auth/register', {
        email,
        name,
        rollNo,
        accessCode,
        mobileNo,
        githubUsername,
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getToken(email: string, clientID: string, clientSecret: string) {
    try {
      const response = await this.client.post('/auth/token', {
        email,
        clientID,
        clientSecret,
      });
      this.token = response.data.access_token;
      localStorage.setItem('access_token', this.token);
      return response.data;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  async getNotifications(
    limit: number = 10,
    page: number = 1,
    notificationType?: string
  ) {
    try {
      const params: Record<string, any> = { limit, page };
      if (notificationType) {
        params.notification_type = notificationType;
      }

      const response = await this.client.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string, isRead: boolean = true) {
    try {
      const response = await this.client.put(`/notifications/${id}`, {
        isRead,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update notification:', error);
      throw error;
    }
  }

  async submitLog(stack: string, level: string, pkg: string, message: string) {
    try {
      const response = await this.client.post('/logs', {
        stack,
        level,
        package: pkg,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit log:', error);
      
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  getStoredToken(): string | null {
    return this.token;
  }
}

export const apiClient = new ApiClient();
