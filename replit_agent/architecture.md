# Architecture Overview

## Overview

PetraPanel is a full-stack web application designed for YouTube content management, optimization, and translation. It provides a platform for creating, managing, and optimizing YouTube videos through a collaborative workflow between content creators, optimizers, and reviewers.

The application follows a modern client-server architecture with a React frontend and Node.js/Express backend. It uses PostgreSQL for data storage, with AWS S3 for file storage of videos and images.

## System Architecture

### High-Level Architecture

PetraPanel follows a typical three-tier architecture:

1. **Frontend Layer**: React-based SPA (Single Page Application) with TypeScript
2. **Backend Layer**: Node.js with Express web server
3. **Data Layer**: PostgreSQL database, AWS S3 for file storage

### Development Architecture

The application uses:
- TypeScript for both frontend and backend
- Vite for frontend bundling and development server
- ESBuild for server-side TypeScript compilation
- Drizzle ORM for database access and migrations

### Infrastructure

The application is designed to be deployed on:
- Replit for development and testing
- Potentially a production environment with proper load balancing and SSL termination via Cloudflare

## Key Components

### Frontend Components

1. **React Application**
   - Organized around page components and reusable UI components
   - Uses a custom UI library built on top of Radix UI primitives with a style similar to Shadcn UI
   - Implements client-side routing with Wouter
   - State management with React Query for server state and React hooks for local state

2. **UI Framework**
   - Extensive use of Radix UI components for accessible, unstyled components
   - TailwindCSS for styling
   - Custom theme system with light/dark mode support

3. **Client-Side Features**
   - Authentication state management
   - Role-based UI rendering
   - Form handling with React Hook Form and Zod validation
   - Real-time notifications and user presence via WebSockets

### Backend Components

1. **Express Server**
   - Routing and middleware configuration
   - Static file serving for the frontend application
   - API endpoints for data manipulation
   - Authentication and session management
   - WebSocket handling for real-time features

2. **Authentication System**
   - Session-based authentication with Express Session
   - Password hashing with Crypto (scrypt)
   - Role-based access control
   - CSRF protection

3. **API Endpoints**
   - RESTful API design
   - Organized by resource types (videos, projects, users, etc.)
   - Validation using Zod schemas

4. **File Processing Services**
   - Video processing with FFmpeg
   - S3 integration for file uploads and storage
   - Multipart upload support for large files

5. **AI/ML Integration**
   - Title analysis and embedding generation with OpenAI
   - Voice separation and cloning capabilities
   - YouTube data analysis

### Data Components

1. **Database**
   - PostgreSQL database with Drizzle ORM
   - Schema migrations handled via Drizzle Kit
   - Entity relationships for users, videos, projects, and actions

2. **S3 Storage**
   - Video files storage
   - Thumbnail and avatar images
   - Secure URL generation for frontend access

3. **WebSocket Services**
   - Notifications service for real-time updates
   - Online users tracking service

## Data Flow

### Authentication Flow

1. User submits credentials via login form
2. Server validates credentials and creates a session
3. Session cookie is sent to client for subsequent authenticated requests
4. Session is validated on each protected request
5. Roles determine accessible routes and actions

### Video Processing Flow

1. User creates a new video entry and uploads video file
2. Server processes the upload and stores the file in S3
3. Various users (optimizers, creators, reviewers) work on the video through a state machine
4. State transitions are controlled by role permissions
5. When the video reaches completion, it can be published to YouTube

### Notification Flow

1. System events trigger notifications (video state changes, mentions, etc.)
2. Notifications are stored in the database
3. WebSocket connections deliver notifications to relevant users in real-time
4. Users can mark notifications as read

## External Dependencies

### AWS Services
- **S3**: Used for file storage (videos, images)
- **IAM**: For authentication with AWS services

### Third-Party APIs
- **OpenAI API**: For generating text embeddings and content analysis
- **YouTube API**: For fetching channel and video data

### External Libraries
- **FFmpeg**: For video processing and transformations
- **Drizzle ORM**: Database access and migrations
- **React Query**: Data fetching and caching
- **Radix UI**: Accessible UI components
- **TailwindCSS**: Utility-first CSS framework

## Deployment Strategy

The application is configured for multiple deployment scenarios:

### Development
- Replit-based development environment
- Local development with npm run dev
- Hot module reloading for rapid development

### Production
- Build process: TypeScript compilation, bundling, and optimization
- Static asset generation for frontend
- Server-side bundling with ESBuild
- Environment variables for configuration
- Cloudflare integration for SSL and proxying

### Database
- Migration scripts for schema updates
- Database URL configuration via environment variables
- Support for Neon PostgreSQL

### Security Considerations
- Environment-based configuration
- CSRF protection
- Secure password hashing
- Rate limiting for authentication attempts
- Role-based access control
- Secure file uploads with validation

## Future Architecture Considerations

The architecture is designed to be extensible in several directions:

1. **Scaling**
   - Horizontal scaling of web servers
   - Database connection pooling
   - Caching layers for frequently accessed data

2. **Monitoring**
   - Error tracking
   - Performance monitoring
   - Usage analytics

3. **Enhanced Security**
   - Additional authentication factors
   - More granular permissions model
   - Enhanced audit logging