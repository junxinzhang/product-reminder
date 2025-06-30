# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a product expiry reminder system with automated WeChat Work notifications. It's a full-stack application using Node.js/Express backend with SQLite database and Vue 3/Element Plus frontend.

## Development Commands

### Full Development Environment
```bash
npm run install-all    # Install dependencies for both server and client
npm run dev            # Start both server and client in development mode
```

### Server Only
```bash
npm run server         # Start backend with nodemon (auto-restart)
npm start              # Start backend in production mode
```

### Client Only
```bash
cd client && npm run serve  # Start Vue dev server
cd client && npm run build  # Build for production
cd client && npm run lint   # Run ESLint
```

### Docker Deployment
```bash
docker-compose up -d   # Start with nginx proxy
docker-compose up product-reminder  # Start without nginx
```

## Architecture

### Backend Structure
- **server/index.js** - Main Express server with API routes and SPA support
- **server/database/init.js** - SQLite schema: users, products, notifications, wechat_config
- **server/services/scheduler.js** - Cron jobs for daily reminder checks and cleanup
- **server/services/wechat.js** - WeChat Work API integration with dual delivery methods
- **server/routes/** - RESTful API endpoints (auth, products, notifications)

### Frontend Structure
- **Vue 3 + Composition API** with Element Plus UI components
- **Pinia** for state management (auth store)
- **Vue Router** with authentication guards
- **Axios** API client with JWT token interceptors

### Database Schema
- **products** - Core entity with expiry_date and configurable reminder_days
- **notifications** - Audit trail of all reminder attempts
- **users** - JWT-based authentication
- **wechat_config** - WeChat Work integration settings

## Key Features

1. **Automated Reminders**: Daily cron job (9 AM) checks for expiring products
2. **WeChat Integration**: Supports both WeChat Work API and webhook delivery
3. **Flexible Notifications**: Per-product reminder windows (default 7 days)
4. **Comprehensive Logging**: All notification attempts tracked with status
5. **Development Mode**: 5-minute intervals for testing reminder logic

## Environment Configuration

Required for WeChat notifications:
- `WECHAT_CORP_ID` - WeChat Work corporation ID
- `WECHAT_AGENT_ID` - Application agent ID  
- `WECHAT_SECRET` - Application secret
- `WECHAT_WEBHOOK_URL` - Alternative webhook URL

Optional:
- `JWT_SECRET` - JWT signing key (default provided for development)
- `DATABASE_PATH` - SQLite file location
- `PORT` - Server port (default 3000)

## Testing Reminders

The scheduler runs different intervals based on NODE_ENV:
- **Development**: Every 5 minutes for rapid testing
- **Production**: Daily at 9 AM and weekly cleanup on Sunday 2 AM

To test notification logic, check the Products page and set expiry dates within the reminder window.