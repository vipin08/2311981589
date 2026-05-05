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

## API Output Screenshots (Important)

> **Instructions for submission:** Replace the placeholder links below with your actual Postman / Insomnia API call screenshots. Ensure that the **request body**, **response**, and **response time** are clearly visible.

### 1. User Registration (`POST /api/auth/register`)

### 2. User Authentication/Token (`POST /api/auth/token`)

### 3. Fetch Notifications (`GET /api/notifications`)

### 4. Mark Notification as Read (`PUT /api/notifications/:id`)

### 5. Logging System (`POST /api/logs`)

## Key Features Implemented

- **REST API Design:** Fully structured endpoints with proper HTTP methods and status codes.
- **Priority Inbox:** Intelligent sorting of notifications based on types (Result, Placement, Event) and recency.
- **Scalable Database Schema:** Designed to handle 50,000+ students and 2.5 million+ notifications efficiently using PostgreSQL.
- **Security:** Token-based authentication (JWT) with secure password hashing.
- **Frontend Optimization:** Pagination and responsive real-time updates.