# Notification System Design

## Project Overview
This document outlines the design and implementation of a comprehensive notification system for a campus hiring platform. The system manages real-time notifications for students regarding events, placements, and other campus activities.

---

## Stage 1: REST API Design

### Objective
Design the REST API contract and structure for the notification system to display notifications to users when they are logged in.

### Core Actions Identified
The notification platform must support the following core actions:
- **View Notifications**: GET endpoint to retrieve notifications
- **Mark as Read**: Update endpoint to mark notifications as read
- **Create Notifications**: POST endpoint for internal use to create new notifications

### API Endpoints

#### 1. Authentication Endpoints

**POST** `/api/auth/register`
- Register a new user
- Request Body:
  ```json
  {
    "email": "student@example.com",
    "name": "Student Name",
    "rollNo": "2311981589",
    "accessCode": "agaMc"
  }
  ```
- Response: 
  ```json
  {
    "clientID": "unique-client-id",
    "clientSecret": "unique-secret",
    "message": "Registration successful"
  }
  ```

**POST** `/api/auth/token`
- Get authorization token
- Request Body:
  ```json
  {
    "email": "student@example.com",
    "name": "Student Name",
    "rollNo": "2311981589",
    "accessCode": "agaMc",
    "clientID": "clientID",
    "clientSecret": "clientSecret"
  }
  ```
- Response:
  ```json
  {
    "access_token": "jwt-token-here",
    "token_type": "Bearer"
  }
  ```

#### 2. Notification Endpoints

**GET** `/api/notifications`
- Retrieve notifications for the logged-in user
- Query Parameters:
  - `limit`: Maximum number of notifications (optional, default: 10)
  - `page`: Page number for pagination (optional, default: 1)
  - `notification_type`: Filter by type (Event, Result, Placement) (optional)
- Response (Status: 200):
  ```json
  {
    "notifications": [
      {
        "ID": "notification-uuid",
        "Type": "Result",
        "Message": "Mid-sem results declared",
        "Timestamp": "2026-04-22 17:51:30"
      },
      {
        "ID": "notification-uuid",
        "Type": "Placement",
        "Message": "CSX Corporation hiring",
        "Timestamp": "2026-04-22 17:51:18"
      }
    ]
  }
  ```

**PUT** `/api/notifications/{id}`
- Mark notification as read
- Request Body:
  ```json
  {
    "isRead": true
  }
  ```
- Response:
  ```json
  {
    "ID": "notification-uuid",
    "message": "Notification marked as read"
  }
  ```

#### 3. Logging Endpoint

**POST** `/api/logs`
- Send logs to the server
- Request Body:
  ```json
  {
    "stack": "backend",
    "level": "error",
    "package": "handler",
    "message": "received string, expected bool"
  }
  ```
- Response (Status: 200):
  ```json
  {
    "logID": "unique-log-id",
    "message": "Log created successfully"
  }
  ```

---

## Stage 2: Database Design

### Objective
Design and implement the database schema for persistent storage of notifications.

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Logs Table
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  package VARCHAR(100),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships
- One User has Many Notifications
- One User has Many Logs

---

## Stage 3: Database Optimization

### Objective
Optimize the database for performance as data volume increases (50,000+ students with 2,500,000 notifications).

### Performance Issues Identified
1. **Slow Notification Queries**: Fetching all unread notifications for a user becomes slow without proper indexing
2. **Type Filtering**: Filtering by notification type requires scanning large tables

### Optimization Strategy

#### Indexes
```sql
-- Index for fast user notification retrieval
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Index for type filtering
CREATE INDEX idx_notifications_type ON notifications(user_id, type);

-- Index for read status
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read) 
WHERE is_read = false;

-- Covering index for common queries
CREATE INDEX idx_notifications_covering ON notifications(user_id, id, type, message, is_read, created_at);
```

#### Query Optimization
- Use pagination to limit result sets (fetch 10-20 at a time instead of all)
- Pre-filter by `is_read = false` for unread notifications
- Use LIMIT and OFFSET for pagination

---

## Stage 4: Performance Optimization

### Objective
Optimize the notification fetching on page load to prevent slowdowns.

### Current Problem
- Fetching all notifications on page load is causing poor UX
- Database is getting overwhelmed with requests

### Solution Implemented
1. **Pagination**: Fetch only 10 notifications per page
2. **Lazy Loading**: Load more notifications on user scroll
3. **Caching**: Cache frequently accessed notifications in-memory (Redis)
4. **Background Jobs**: Move heavy computations to background tasks

#### Implementation
- Frontend loads initial 10 notifications
- Implements infinite scroll to load more
- Backend uses indexed queries with LIMIT
- Consider Redis caching for frequently viewed notifications

---

## Stage 5: Email Notifications

### Objective
Implement email notification system to notify all students of important announcements.

### Implementation Approach
```javascript
function notifyAll(student_ids: Array, message: string):
  for each student_id in student_ids:
    - Create notification record in database
    - Send email via Email API
    - Log the action using Logging Middleware
```

### Key Considerations
- **Reliability**: Ensure all students receive notifications even if API fails
- **Rate Limiting**: Batch send emails to avoid overwhelming email service
- **Logging**: Log each send attempt for auditing
- **Retry Logic**: Implement exponential backoff for failed emails

### Email Notification Response
- Status: Successfully sent emails to students
- Shortcomings: Email delivery limited by API rate limits (200 students at a time)
- Optimization: Implement queue system (Bull, RabbitMQ) for async email sending

---

## Stage 6: Priority Inbox

### Objective
Implement a priority inbox that displays top 'n' important notifications first.

### Approach
1. **Notification Weighting**:
   - Result: Weight 3 (High)
   - Placement: Weight 2 (Medium)
   - Event: Weight 1 (Low)
   - Recency: Newer notifications get higher weight

2. **Sorting Algorithm**:
   ```sql
   SELECT * FROM notifications
   WHERE user_id = $1
   ORDER BY (
     CASE 
       WHEN type = 'Result' THEN 3
       WHEN type = 'Placement' THEN 2
       ELSE 1
     END * (1 - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400))
   ) DESC
   LIMIT $2
   ```

3. **Database Query**:
   - Use calculated priority score for ordering
   - Implement efficient filtering for notification types
   - Use indexes on type and created_at columns

### Display Features
- Top 'n' notifications (prioritized by type and recency)
- Filter by notification type
- Search functionality
- Mark as read action

---

## Stage 7: Frontend Implementation

### Objective
Develop a responsive React/Next.js frontend for the notification system.

### Tech Stack
- **Framework**: React (Next.js)
- **Language**: TypeScript
- **Styling**: Material UI
- **State Management**: React Hooks / Context API

### Features Implemented

#### Authentication
- Login/Registration page
- Token-based authentication
- Session management

#### Notification Display
- Fetch and display notifications
- Real-time updates (polling every 5 seconds)
- Infinite scroll pagination
- Notification type filtering
- Mark as read functionality

#### UI Components
- Notification List
- Notification Card (with Type, Message, Timestamp)
- Filter Controls
- Search Bar
- Loading States
- Error Handling

#### API Integration
- Fetch notifications from backend
- Handle authentication tokens
- Retry logic for failed requests
- Loading and error states

### Performance Optimizations
- Code splitting
- Lazy loading of components
- Memoization of expensive computations
- Image optimization

---

## Submission Summary

This design document outlines the complete architecture for a scalable notification system:
- **Stage 1**: REST API design with clear contracts
- **Stage 2**: Efficient database schema
- **Stage 3**: Index optimization for performance
- **Stage 4**: Query optimization for page load
- **Stage 5**: Email notification system
- **Stage 6**: Priority inbox with intelligent sorting
- **Stage 7**: Responsive React/Next.js frontend

Each stage builds upon the previous one, creating a comprehensive solution for managing and displaying notifications at scale.
