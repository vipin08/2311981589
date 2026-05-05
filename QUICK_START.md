# Quick Start Guide

Follow these steps to set up and run the Campus Notification Platform on your local machine.

## 1. Backend Setup

```powershell
cd notification_app_be
npm install
cp .env.example .env
# Configure your .env file with your PostgreSQL database credentials
node init-db.js  # Run if using PostgreSQL
npm run dev
```
*The backend will be running on `http://localhost:5000`*

## 2. Frontend Setup

```powershell
cd notification_app_fe
npm install
npm run dev
```
*The frontend will be running on `http://localhost:3000`*

## 3. Testing the Application

Once both servers are running:
1. Open `http://localhost:3000` in your browser.
2. Register a new user account.
3. Log in to view the dashboard and notifications.

For more details on the architecture and database, see `notification_system_design.md`.
