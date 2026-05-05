# Campus Notification Platform

This project is a comprehensive full-stack notification platform designed for campus hiring scenarios. The system features an Express.js backend for REST APIs (registration, authentication, notifications, logging) and a React frontend (built with Vite) for a seamless user interface.

## Project Structure

- `notification_app_be/` - Express.js backend with PostgreSQL/In-memory fallback.
- `notification_app_fe/` - React/Vite frontend using TypeScript and modern UI concepts.
- `logging_middleware/` - Custom middleware for system-wide logging.
- `notification_system_design.md` - Comprehensive architecture and system design documentation.
- `QUICK_START.md` - Step-by-step setup and installation guide.

## Setup & Installation

Please refer to the [`QUICK_START.md`](QUICK_START.md) file for detailed instructions on how to install dependencies and run the application locally.

## API Output

### 1. User Registration (`POST /api/auth/register`)

{
  "email": "vipin1589.be23@chitkarauniversity.edu.in",
  "name": "Vipin Sohal",
  "rollNo": "2311981589",
  "accessCode": "EXfvDp",
  "mobileNo": "8219839956",
  "githubUsername": "vipin08"
}

### 2. User Authentication/Token (`POST /api/auth/token`)

{
  "email": "vipin1589.be23@chitkarauniversity.edu.in",
  "clientID": "e0f1851b-e385-4f7b-8a57-5bcfadf11ff0",
  "clientSecret": "7f3a9c21-5d8e-4b6a-9f02-3c7d1e8a6b4f"
}

### 3. Fetch Notifications (`GET /api/notifications`)

{
    "error": "No token provided"
}

### 4. Mark Notification as Read (`PUT /api/notifications/:id`)

{
  "isRead": true
}

### 5. Logging System (`POST /api/logs`)

{
  "stack": "backend",
  "level": "info",
  "package": "auth-service",
  "message": "User Vipin Sohal successfully tested APIs"
}

## Key Features Implemented

- **REST API Design:** Fully structured endpoints with proper HTTP methods and status codes.
- **Priority Inbox:** Intelligent sorting of notifications based on types (Result, Placement, Event) and recency.
- **Scalable Database Schema:** Designed to handle 50,000+ students and 2.5 million+ notifications efficiently using PostgreSQL.
- **Security:** Token-based authentication (JWT) with secure password hashing.
- **Frontend Optimization:** Pagination and responsive real-time updates.