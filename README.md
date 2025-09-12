<div align="center">
  <img src="https://raw.githubusercontent.com/EFFXCT290/Obsidian/main/client/public/logo.png" alt="Obsidian Tracker Logo" width="200" height="200">
  
  # Obsidian Tracker
  
  **The OverPowered Torrent Tracker**
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/EFFXCT290/Obsidian)
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/EFFXCT290/Obsidian/actions)
  [![Stable](https://img.shields.io/badge/status-stable-green.svg)](https://github.com/EFFXCT290/Obsidian/releases)
  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
  [![Node.js](https://img.shields.io/badge/node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
</div>

A modern, feature-rich BitTorrent tracker built with Next.js, Fastify, and PostgreSQL. Obsidian Tracker provides a comprehensive platform for managing torrents, users, and community features with a focus on performance, security, and user experience.

## 🚀 Features

### Core Functionality
- **Torrent Management**: Upload, categorize, and manage torrents with approval workflow
- **User System**: Registration, authentication, profiles, and role-based permissions
- **Tracker Protocol**: Full BitTorrent tracker implementation with announce/scrape support
- **Anti-Cheat System**: Comprehensive protection against cheating clients and fake stats
- **Hit & Run Detection**: Automatic tracking of seeding requirements and violations

### Community Features
- **Comments System**: Threaded comments on torrents and requests with voting
- **Request System**: Community-driven content requests with fulfillment tracking
- **Bookmarks**: Save and organize favorite torrents
- **Announcements**: Admin announcements with email notifications
- **Wiki System**: Community-editable knowledge base
- **RSS Feeds**: Personalized RSS feeds for torrent updates

### User Experience
- **Multi-language Support**: English, Spanish, and Chinese localization
- **Responsive Design**: Mobile-first design with desktop optimization
- **Dark Theme**: Modern dark theme with VS Code-inspired styling
- **Real-time Updates**: Live statistics and notifications
- **Advanced Search**: Full-text search with filtering and sorting

### Administrative Tools
- **User Management**: Ban/unban users, manage roles, and track activity
- **Torrent Approval**: Review and approve/reject uploaded torrents
- **Category Management**: Hierarchical categories with source management
- **Statistics Dashboard**: Comprehensive site statistics and analytics
- **Peer Ban System**: IP and client-based banning system

## 🏗️ Architecture

### Backend (API)
- **Framework**: Fastify.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with refresh tokens
- **File Storage**: Local storage with S3 support or full DB storage
- **Email**: Nodemailer with SMTP configuration
- **Rate Limiting**: Built-in rate limiting for API protection

### Frontend (Client)
- **Framework**: Next.js 15 with App Router
- **UI Library**: Tailwind CSS with custom components
- **State Management**: SWR for server state, React hooks for local state
- **Internationalization**: Custom i18n implementation with cookie persistence
- **Icons**: Styled Icons (Boxicons Regular)
- **Notifications**: React Hot Toast for user feedback

### Database Schema
- **Users**: Authentication, profiles, statistics, and preferences
- **Torrents**: File metadata, categories, and approval status
- **Announces**: Peer tracking and statistics
- **Categories**: Hierarchical organization with sources
- **Comments**: Threaded discussion system
- **Requests**: Community content requests
- **Notifications**: User notifications and admin messages

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 12 or higher
- **npm/yarn/bun**: Package manager of choice
- **Git**: Version control

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/EFFXCT290/Obsidian.git
cd Obsidian
```

### 2. Install Dependencies

#### Backend (API)
```bash
cd api
npm install
# or
yarn install
# or
bun install
```

#### Frontend (Client)
```bash
cd client
npm install
# or
yarn install
# or
bun install
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE obsidian_tracker;
CREATE USER obsidian_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE obsidian_tracker TO obsidian_user;
```

#### Environment Configuration
Create environment files in the `api` directory:

```bash
# api/.env
DATABASE_URL="postgresql://obsidian_user:your_password@localhost:5432/obsidian_tracker"
JWT_SECRET="your_jwt_secret_key_here"
JWT_REFRESH_SECRET="your_refresh_secret_key_here"
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:3000"

# SMTP Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="noreply@obsidian-tracker.com"

# S3 Configuration (optional)
S3_BUCKET="your-s3-bucket"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your_access_key"
S3_SECRET_ACCESS_KEY="your_secret_key"
```

#### Run Database Migrations
```bash
cd api
npx prisma migrate dev
npx prisma generate
```

#### Seed Initial Data
```bash
npm run prisma:seed
```

### 4. Development Setup

#### Start the Backend Server
```bash
cd api
npm run dev
```
The API server will start on `http://localhost:8000`

#### Start the Frontend Development Server
```bash
cd client
npm run dev
```
The client will start on `http://localhost:3000`

## 🔧 Configuration

### Database Configuration
The application uses Prisma for database management. Key configuration options:

- **Connection**: Configured via `DATABASE_URL` environment variable
- **Migrations**: Located in `api/prisma/migrations/`
- **Schema**: Defined in `api/prisma/schema.prisma`
- **Seeding**: Initial data setup in `api/prisma/seed.ts`

### Application Settings
Core settings can be configured through the admin panel or database:

- **Registration Mode**: Open, Invite-only, or Closed
- **Torrent Approval**: Require admin approval for uploads
- **Seeding Requirements**: Minimum seeding time and ratio requirements
- **Anti-Cheat Settings**: Enable/disable various protection mechanisms
- **Rate Limiting**: Configure API rate limits and cooldowns

### File Storage
The application supports multiple storage backends:

- **Local Storage**: Files stored in `UPLOAD_DIR` directory
- **S3 Storage**: AWS S3 compatible storage
- **Database Storage**: Small files stored directly in PostgreSQL

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Torrents
- `GET /torrents` - List torrents with filtering and pagination
- `POST /torrents` - Upload new torrent
- `GET /torrents/:id` - Get torrent details
- `PUT /torrents/:id` - Update torrent (admin/owner)
- `DELETE /torrents/:id` - Delete torrent (admin/owner)
- `POST /torrents/:id/vote` - Vote on torrent

### Tracker Protocol
- `GET /announce` - BitTorrent announce endpoint
- `GET /scrape` - BitTorrent scrape endpoint

### User Management
- `GET /user/torrents` - Get user's uploaded torrents
- `GET /user/bookmarks` - Get user's bookmarked torrents
- `GET /user/requests` - Get user's requests
- `GET /user/activity` - Get user activity feed

### Admin
- `GET /admin/users` - List all users
- `PUT /admin/users/:id` - Update user (ban/unban, role changes)
- `GET /admin/torrents` - List all torrents for approval
- `POST /admin/torrents/:id/approve` - Approve torrent
- `POST /admin/torrents/:id/reject` - Reject torrent

## 🎨 Frontend Structure

### Pages
- **Home** (`/`): Landing page with statistics and announcements
- **Dashboard** (`/dashboard`): Main user dashboard with latest torrents
- **Categories** (`/categories`): Browse torrents by category
- **Search** (`/search`): Advanced search with filtering
- **Latest Torrents** (`/latest-torrents`): Full list of recent uploads
- **Profile** (`/profile`): User profile and settings
- **Public Profile** (`/user/:username`): Public user profiles
- **Upload** (`/torrent/upload`): Torrent upload form
- **Torrent Detail** (`/torrent/:id`): Individual torrent page
- **Requests** (`/requests`): Community request system
- **Bookmarks** (`/bookmarks`): User's bookmarked torrents
- **RSS** (`/rss`): RSS feed management
- **Wiki** (`/wiki`): Knowledge base
- **Admin** (`/admin`): Administrative interface

### Components
- **DashboardWrapper**: Main layout wrapper with sidebar and header
- **LanguageSelector**: Multi-language support component
- **UserStatsBar**: User statistics display
- **TorrentTable**: Reusable torrent listing component
- **CommentSystem**: Threaded comment functionality
- **SearchForm**: Advanced search interface
- **ToggleSwitch**: Custom toggle component
- **Modal Components**: Various modal dialogs

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Sidebar Toggle**: Collapsible navigation on mobile
- **Adaptive Layout**: Responsive grid and flex layouts
- **Touch-Friendly**: Optimized for touch interactions

## 🌍 Internationalization

The application supports multiple languages with a custom i18n implementation:

### Supported Languages
- **English** (`en`): Default language
- **Spanish** (`es`): Full translation
- **Chinese** (`zh`): Full translation

### Translation Files
- `client/app/locales/en.json` - English translations
- `client/app/locales/es.json` - Spanish translations
- `client/app/locales/zh.json` - Chinese translations

### Usage
```typescript
import { useI18n } from '@/app/hooks/useI18n';

function MyComponent() {
  const { t } = useI18n();
  return <h1>{t('home.title', 'Default Title')}</h1>;
}
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Automatic token refresh mechanism
- **Role-Based Access**: USER, MOD, ADMIN, OWNER, FOUNDER roles
- **Password Hashing**: Argon2 password hashing
- **Email Verification**: Account verification via email

### Anti-Cheat Protection
- **Client Validation**: Whitelist/blacklist torrent clients
- **Stats Validation**: Detect impossible upload/download jumps
- **IP Abuse Detection**: Monitor for suspicious IP patterns
- **Peer Ban System**: Ban problematic peers and clients
- **Rate Limiting**: Prevent API abuse and spam

### Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Same-origin policy enforcement
- **Rate Limiting**: API endpoint rate limiting

## 📊 Monitoring & Analytics

### User Statistics
- **Upload/Download**: Track data transfer statistics
- **Ratio Calculation**: Maintain user ratios
- **Bonus Points**: Reward system for seeding
- **Hit & Run Tracking**: Monitor seeding compliance
- **Activity Logging**: User action tracking

### Site Analytics
- **Torrent Statistics**: Upload/download counts
- **User Metrics**: Registration and activity metrics
- **Category Breakdown**: Content distribution analysis
- **Performance Monitoring**: API response times
- **Error Tracking**: Application error monitoring

## 🚀 Deployment

### Production Build
```bash
# Build API
cd api
npm run build

# Build Client
cd client
npm run build
```

### Environment Variables
Ensure all required environment variables are set for production:
- Database connection string
- JWT secrets
- SMTP configuration
- S3 credentials (if using S3 storage)
- CORS origins

### Database Migration
```bash
cd api
npx prisma migrate deploy
```

### Process Management
Use PM2 or similar process manager for production:
```bash
npm install -g pm2
pm2 start api/dist/index.js --name "obsidian-api"
pm2 start client/server.js --name "obsidian-client"
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for consistent code style
- **Prettier**: Code formatting (if configured)
- **Comments**: English comments for all code

### Testing
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full application testing (if configured)

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

### What this means:

**✅ You can:**
- Use, modify, and distribute the software
- Create derivative works
- Use the software for personal and non-commercial purposes
- Contribute improvements back to the community

**⚠️ Commercial use restrictions:**
- **Web services**: Any web service using this code must release their source code under AGPL-3.0
- **Commercial distribution**: Commercial use requires compliance with AGPL-3.0 terms
- **Network services**: If you run this software as a network service, you must provide source code to users

**🔒 Key protections:**
- Prevents proprietary forks that don't contribute back
- Ensures improvements remain open source
- Protects against commercial exploitation without source release

For more information about the AGPL-3.0 License, visit [gnu.org/licenses/agpl-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Fastify Team**: For the high-performance web framework
- **Prisma Team**: For the excellent database toolkit
- **Tailwind CSS**: For the utility-first CSS framework
- **BitTorrent Community**: For the tracker protocol specification

## 📞 Support

For support, please:
1. Search existing [Issues](https://github.com/EFFXCT290/Obsidian/issues)
2. Create a new issue if your problem isn't already reported
3. Contact the development team on [Discord](https://discord.gg/C26GGafb) 

---

**Built with ❤️ by the Obsidian Tracker Team**
