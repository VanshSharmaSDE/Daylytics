# Daylytics

A comprehensive productivity platform combining daily task management, document organization, asset storage, and analytics to streamline your workflow.

**Current Version:** 1.7.9 (Stable)

**Last Updated:** December 25, 2025

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Development](#development)
- [Version History](#version-history)
- [License](#license)

---

## Overview

Daylytics is a full-stack web application designed to enhance personal and professional productivity. Built with modern technologies, it offers an intuitive interface for managing daily tasks, organizing documents in a hierarchical structure, storing various file types, and tracking productivity through comprehensive analytics.

The platform features automatic task archiving, rich markdown editing, cloud-based asset storage with a 100MB limit per user, and seamless dark/light theme switching—all optimized for both desktop and mobile devices.

---

## Key Features

---

## Key Features

### Task Management

**Daily Task Organization**
- Create, edit, toggle completion status, and delete tasks for any specific date
- Attach images to tasks for visual context and detailed reference
- Inline task editing with intuitive save/cancel controls
- Task details modal for viewing complete information
- Bulk delete all tasks for a specific date with confirmation
- Character limits enforced (500 characters, 50 words per task)
- Completion tracking with checkbox-only toggle behavior

**Multiple View Modes**
- List View: Traditional vertical list with timestamps and actions
- Card View: Grid layout with visual cards for each task
- Compact View: Dense list view for maximum information density
- Circle View: Visual circular indicators with completion status
- View mode preference saved to database and synced across devices
- Smooth animations between view transitions

**Automatic Archiving**
- System automatically archives all tasks at midnight (12:00 AM) every day
- Tasks remain on their original creation date permanently
- Each day starts fresh with zero tasks
- No manual intervention required
- Preserved task history for analytics

### Document Management

**Rich Text Editing**
- Comprehensive markdown toolbar with 14 formatting options
- Support for headings (H1, H2, H3), bold, italic, and inline code
- Code blocks with syntax preservation
- Bullet lists, numbered lists, and horizontal rules
- Links, blockquotes, and tables
- Fullscreen distraction-free editing mode
- Live markdown preview rendering

**File Organization**
- Unlimited folders with nested subfolder support
- Hierarchical parent-child folder relationships
- Breadcrumb navigation for easy folder traversal
- Pin files and folders for quick access
- Files automatically sort by pinned status and update time
- Smart caching for instant folder navigation

**Inline Image Support**
- Upload and embed images directly in markdown content
- Automatic metadata tracking (file ID, URL, original name, size)
- Storage quota integration
- Cloudinary-powered image hosting

### Asset Storage (Bucket)

**File Upload & Management**
- Upload any file type (images, documents, PDFs, videos, audio, etc.)
- Maximum file size: 10MB per file
- Total storage limit: 100MB per user
- Secure file downloads via Cloudinary signed URLs
- Delete files with automatic storage recalculation
- Grid layout with responsive design

**Visual Previews**
- Automatic thumbnail generation for image files
- Video preview with inline playback controls
- PDF viewer with native browser rendering
- Word document preview via Office Online viewer
- Text file content display with syntax highlighting
- File type icons for all supported formats

**Glassmorphism UI**
- Semi-transparent button overlays on image previews
- Backdrop blur effects (10px)
- Hover states with color transitions
- Modern, clean aesthetic throughout

### Storage Management

**Quota System**
- 100MB (104,857,600 bytes) storage limit per user
- Real-time storage usage tracking
- Visual progress bar with color-coded indicators:
  - Green (under 70% usage)
  - Yellow (70-90% usage)
  - Red (over 90% usage)
- Storage warnings when approaching limit

**Unified Asset View**
- Comprehensive table displaying all uploaded assets
- Asset sources: Task images, File inline images, Bucket files
- Information displayed: Preview thumbnail, name, type badge, source, size
- Individual asset deletion from storage overview
- Responsive table design for mobile devices
- Dark mode support with proper text contrast

### Analytics & Reporting

**Archive Management**
- View all past archived tasks with completion statistics
- Month and year filter selector (2025-2035)
- Completion rate percentage calculation
- Task counts per archived day
- Automatic midnight archiving system
- Archive history preservation

### Code Editor (Beta)

> **Note:** Due to performance issues and inconsistency, the Code Editor feature is currently disabled in version 1.7.9. This feature will be re-enabled with improvements in version 1.8.

**Monaco Editor Integration**
- VS Code-like editing experience with IntelliSense
- Syntax highlighting for HTML, CSS, and JavaScript
- Auto-completion and parameter hints
- Multi-file editing with tab switching
- Full keyboard shortcut support

**Dual View Modes**
- Window View: Complete web development environment
  - HTML, CSS, and JavaScript file tabs
  - Live preview of rendered web pages
  - Theme-aware iframe background
  - Console output capture for debugging
- Console View: JavaScript practice environment
  - Standalone JavaScript file
  - Direct code execution
  - Color-coded console output (log/error/warn)
  - Separate console history from Window view

**Code Execution**
- Run button for executing code
- Real-time console output capture
- Error handling with line numbers
- Sandboxed iframe for security
- Theme-aware styling (dark/light mode)

**Data Persistence**
- All files stored in MongoDB per user
- Auto-save with 1-second debounce
- Reset to default files option
- File content preserved across sessions

### Settings & Preferences

**User Profile**
- Update display name and email address
- Secure password change with current password verification
- Input validation on all profile fields

**Storage Overview**
- Visual representation of storage usage
- Detailed asset listing with deletion capability
- File type icons and thumbnails
- Size formatting (Bytes, KB, MB, GB)

**Theme Customization**
- GitHub-inspired light and dark themes
- Seamless theme switching
- Persistent theme preference across sessions
- Geom font family (Google Fonts) applied globally

### User Interface

**Navigation**
- URL-based tab routing with browser history support
- Dashboard tabs: Tasks, Files, Analytics, Bucket, Editor (Beta - Desktop only), Settings
- Mobile-optimized sidebar with hamburger menu
- Persistent active tab state via URL parameters
- Beta badge for experimental features

**Responsive Design**
- Mobile-first approach with breakpoint-based layouts
- Touch-optimized controls for mobile devices
- Adaptive sidebar and content areas
- Icon-based navigation for small screens

**Feedback Systems**
- Toast notifications for all user actions
- Contextual loading states with operation messages
- Confirmation modals for destructive actions
- Reusable Modal component with consistent design

### Security

**Authentication**
- JWT (JSON Web Token) based authentication
- Secure password hashing with bcrypt
- Protected API routes requiring authentication
- Session persistence with token refresh

**Data Protection**
- CORS configuration restricting unauthorized origins
- Environment variable management for sensitive data
- Cloudinary secure signed URLs for file access
- User-specific data isolation

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | Component-based UI library |
| Vite | 5.0.0 | Build tool and development server |
| React Router | 6.14.0 | Client-side routing and navigation |
| Bootstrap | 5.3.0 | CSS framework with custom theming |
| Remix Icon | 4.7.0 | Comprehensive icon library |
| Axios | 1.4.0 | HTTP client for API requests |
| marked | 11.1.1 | Markdown parser and renderer |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | LTS | JavaScript runtime environment |
| Express | 4.18.2 | Web application framework |
| MongoDB | Latest | NoSQL database for data persistence |
| Mongoose | 7.0.0 | MongoDB object modeling (ODM) |
| JSON Web Token | 9.0.0 | Authentication token generation |
| bcryptjs | 2.4.3 | Password hashing algorithm |
| CORS | 2.8.5 | Cross-origin resource sharing middleware |
| Cloudinary | SDK | Cloud-based asset storage service |

### Design & Typography

**Font Family:** Geom (Google Fonts)
- Modern variable font with weights from 300 to 900
- Supports regular and italic styles
- Applied globally for consistent typography
- Clean, readable sans-serif design

---

## Project Structure

Create a `.env` file in the `server` folder with the following variables:

```env
# Database
MONGO_URI=your_mongo_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
BACKEND_URL=http://localhost:5000

# Cloudinary - Used for all file uploads (tasks, files, bucket)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Important Notes:**
- Keep all credentials secret and never commit them to source control
- Cloudinary is used for:
  - Task image attachments (folder: `daylytics/tasks`)
  - File inline images (folder: `daylytics/files/inline`)
  - Bucket file uploads (folder: `daylytics/bucket`)
- All uploads count towards the 100MB per-user storage limit


### Version 1.6.7 (Current — Stable)
- **Release Date:** December 20, 2025
- **New in This Version:** Bucket (Asset Storage) feature - a complete file storage system for uploading, managing, and downloading any type of file
- **Major Features & Improvements:**
   - **Bucket (Asset Storage) - NEW FEATURE** - Complete file storage system for all file types
     - Upload images, documents, PDFs, videos, and more
     - Image preview cards with automatic thumbnails
     - Secure file downloads via signed URLs
     - Integrated with storage management system
     - Glassmorphism buttons on image previews
   - **Task Image Attachments - NEW FEATURE** - Attach images to tasks for visual reference
   - **File Inline Images - NEW FEATURE** - Upload and embed images in markdown files
   - **Comprehensive Settings System** - New dedicated settings page with multiple sections
     - Profile management (name/email updates)
     - Password change functionality
     - Storage management with asset overview
     - Logout confirmation
   - **Storage Management System** - Complete storage tracking and management
     - 100MB storage limit per user
     - Visual storage usage with progress bar (color-coded: green/yellow/red)
     - Unified asset view showing all uploads (tasks, files, bucket)
     - Asset details: preview, name, type badge, source, size
     - Individual asset deletion from storage page
     - Real-time storage sync after operations
   - **Inline Image Storage Tracking** - Accurate size tracking for file inline images
     - Metadata stored for each uploaded inline image
     - Proper storage calculation including inline images
     - Cloudinary integration for size retrieval
   - **URL-Based Navigation** - Dashboard tabs now use URL routing
     - `/dashboard/tasks` - Tasks tab
     - `/dashboard/files` - Files tab
     - `/dashboard/analytics` - Analytics tab
     - `/dashboard/bucket` - Bucket tab
     - `/dashboard/settings` - Settings tab
     - Tab persistence across page reloads via URL
     - Browser back/forward button support
   - **Analytics Enhancements** - Month and year selector for analytics
     - Dropdown to select any month (January-December)
     - Dropdown to select year (2025-2035)
     - Filter archives by selected month/year combination
   - **Mobile Delete All Button** - Delete all tasks button added to mobile view
     - Appears alongside heading in mobile layout
     - Consistent with desktop functionality
   - **Settings Page Responsive Design** - Mobile-optimized settings layout
     - Fixed sidebar and content heights (500px on desktop)
     - Auto-adjusting heights on mobile
     - Centered loading spinner (no text) for storage
     - All styles moved to theme.css
     - Text ellipsis for long file names and sources
   - **Bucket Image Previews** - Image files show preview thumbnails in bucket cards
     - 200px height cover-fit images with rounded corners
     - Glassmorphism effect on action buttons over images
     - Blur backdrop with semi-transparent white background
     - Non-image files continue showing icon representation

### Version 1.5.7 (Previous — Beta)
- **Release Date:** December 18, 2025
- **Patch & UX Improvements:**
   - **Pinned Files Section** - Added a dedicated "Pinned Files" section in the Files tab; pinned files now appear above other files.
   - **Mobile Button Fix** - Fixed button display on mobile screens: modal action buttons now show icons on small screens with text hidden for a compact layout.
   - **UI Fixes** - Split files into pinned/unpinned lists and fixed a small key bug in the files listing.
   - **Backend Fix (Folders)** - `PUT /api/folders/:id` now persists `isPinned`; folder pin/unpin operations are saved correctly.
   - **Misc** - Updated UI version strings to `v1.5.7`.

### Version 1.5.6 (Previous — Beta)
- **Release Date:** December 16, 2025
- **Major Refactoring & Performance:**
   - **Centralized Data Management** - Created DataContext for all data operations
     - Moved all database logic from individual tabs to single DataContext
     - Tasks, Analytics, Files, and Profile operations unified
     - Single source of truth for entire application
   - **Modular Architecture** - Each tab separated into dedicated components
     - TasksTab.jsx, FilesTab.jsx, AnalyticsTab.jsx as independent components
     - Better code organization and maintainability
     - Easier to debug and extend individual features
   - **Single Global Loader** - Replaced individual tab loaders with unified loading system
     - Global loader for initial app load
     - Operation loader for CRUD operations (create, update, delete)
     - Navigation loader for folder navigation
     - Consistent Loader component used throughout
   - **Smart Navigation** - Instant folder navigation with intelligent caching
     - No loader during cached folder navigation
     - Only shows loader when fetching uncached folders
     - Prevents "no files" flash during navigation
   - **Enhanced UX & Accessibility** - Improved user experience throughout
     - Consistent loading states prevent confusion
     - Clear feedback for all operations (creating, updating, deleting)
     - Smooth transitions without jarring empty states
     - Predictable behavior across all tabs
   - **Clean Tab Components** - All tabs are now purely presentational
     - No data fetching logic in TasksTab, FilesTab, or AnalyticsTab
     - Only UI helper functions (formatting, display logic)
     - Consistent empty state handling across all tabs
   - **Removed Refresh Buttons** - Data refreshes automatically after operations
     - Tasks refresh after create/update/delete
     - Files refresh after file/folder operations
     - Analytics refresh after archiving
   - **Improved Loader Styling** - Clean, solid background loader
     - Removed blur effect for better visibility
     - Solid white/theme background
     - Consistent full-screen display
   - **Modal Layout Fix** - Fixed file/folder modals positioning
     - Modals now render outside tab containers
     - Proper z-index and positioning
     - No wrapper interference

### Version 1.4.6 (Beta)
- **Release Date:** December 2025
- Additional Improvements:
      - **Favicon Implementation** - Daylytics logo favicon added to enhance branding
      - Displays in browser tab for easy identification
      - Improves overall user experience
    - **Added Sorting Feature** - Users can now sort files by title, date, and size
      - Sorting preferences are saved and loaded automatically
      - Fixes formatting bugs related to file display
      - Removed root files display for cleaner interface

### Version 1.4.5 (Beta)
- **Release Date:** December 2025
- **Files System Improvements & Performance:**
   - **Fixed Nested Folder Deletion Bug** - Folder deletion now properly handles loading states
     - Loading state clears properly on both success and error
     - Modal closes even if deletion fails to prevent UI from getting stuck
     - Comprehensive cache clearing after deletion
   - **Simplified File Creation** - Removed folder dropdown for intuitive workflow
     - Automatically creates files in current folder location
     - Shows current location indicator (Root or folder path)
     - Eliminates confusion about where file will be created
   - **Removed File Moving Feature** - Files stay in creation location
     - Prevents accidental file misplacement
     - Cleaner, more focused editing modal
     - Simplified user experience
   - **Optimized Loading Performance** - Files section loads significantly faster
     - Enhanced caching strategy with cache-first approach
     - Reduced unnecessary API calls
     - Parallel fetch execution for folders and files
     - Instant navigation using cached data

### Version 1.4.4 (Beta)
- **Release Date:** December 2025
- **Performance Optimizations:**
   - **Instant Tab Switching** - Files tab data persists when switching between tabs
     - No reloading when navigating back to Files tab
     - Component stays mounted with display:none instead of unmounting
   - **Smart Caching System** - Folder navigation uses intelligent cache
     - OS-like file explorer experience with instant folder navigation
     - Cache invalidation only on database operations (create, update, delete)
     - Eliminates unnecessary API calls when browsing folders
   - **Refresh Buttons** - Manual refresh controls added to all tabs
     - Tasks tab refresh with loader feedback
     - Analytics tab refresh with loader feedback
     - Files tab refresh clears cache and reloads all data
   - **Unified Initial Load** - All data loads simultaneously on page load
     - Tasks, Analytics, and Files fetch in parallel
     - Single loader for entire dashboard instead of multiple loaders
     - Faster perceived performance
   - **Eliminated Flash of Empty State** - Fixed brief "No files and folders" flash
     - Proper initial loading state prevents UI flicker
     - Smooth data population without visual glitches

### Version 1.4.3 (Beta)
- **Release Date:** December 2025
- **New Features:**
   - **⏰ Automatic Daily Archiving** - System automatically archives tasks at midnight (12:00 AM)
     - No manual archiving needed - runs automatically every day
     - Archives all tasks from previous day (completed and incomplete)
     - Tasks stay on their original date and never move to next day
     - Each new day starts fresh with zero tasks
     - Scheduler calculates exact time until midnight for precise execution
   - **Removed Manual Archive Button** - Archive button removed from Analytics tab
     - Updated UI to show "auto-archived at midnight" message
     - System handles all archiving automatically

### Version 1.4.2 (Beta)
- **Release Date:** December 2025
- **Bug Fixes:**
   - **Archive Duplicate Prevention** - Fixed issue where the same day could be archived multiple times
     - Backend now checks for existing archives before creating new ones
     - Returns error message if date already archived
     - Prevents database pollution with duplicate entries

### Version 1.4.1 (Beta)
- **Release Date:** December 2025
- **Highlights:**
   - **Advanced File & Folder Management System** - Complete hierarchical file organization
   - **Folder System** - Create unlimited folders and subfolders to organize your files
     - Nested folder structure with parent-child relationships
     - Breadcrumb navigation for easy folder traversal
     - Pin folders to keep important ones at the top
     - Delete empty folders with confirmation
   - **Enhanced File Management** - Files can be organized within folders or kept at root level
     - Select folder when creating new files
     - Move files between folders while editing
     - Files inherit current folder location by default
   - **Folder & File Pinning** - Pin both folders and files for quick access
     - Pinned items automatically sort to top
     - Individual loading states for each pin action
     - Instant reordering without page reload
   - **Smart Delete System** - Icon-based delete for both files and folders
     - Delete icon buttons next to pin buttons
     - Confirmation modals for both files and folders
     - Backend validation prevents deleting non-empty folders
   - **Operation Loading States** - Full-page loader with contextual messages
     - "Creating your file..." / "Creating folder..."
     - "Updating your file..." / "Deleting folder..."
     - Prevents double-clicks and improves UX
   - **Mobile-Optimized Navigation** - Files tab accessible via sidebar on mobile
     - Hidden from mobile navbar icons
     - Available in hamburger menu
   - **Consistent Icon Design** - Unified UI with pin and delete icons
     - Folder cards show pin/delete icons in top-right
     - File cards match folder styling exactly
     - Yellow folder icons with visual hierarchy

### Version 1.3.1 (Beta)
- **Release Date:** December 2025
- **Highlights:**
   - **File Management System** - Create, edit, view, and delete unlimited files/notes
   - **Rich Text Editor** - Full markdown toolbar with 14 formatting options
     - Headings (H1, H2, H3)
     - Bold (`**text**`) and Italic (`_text_`)
     - Inline Code (`` `code` ``) and Code Blocks (` ```code``` `)
     - Bullet Lists and Numbered Lists
     - Links, Blockquotes, Tables, and Horizontal Rules
   - **Pin Files** - Pin important files to keep them at the top with instant reordering
   - **File Preview** - Click any file to view full rendered markdown content
   - **Inline Editing** - Edit files with same rich text toolbar in fullscreen edit mode
   - **Files Tab** - Dedicated tab alongside Tasks and Analytics with localStorage persistence
   - **File Cards** - Visual grid layout showing title, markdown preview (stripped formatting), and last updated timestamp
   - **Consistent UI** - File management follows same dark/light theme and modal patterns as Tasks
   - **Per-File Loading States** - Individual pin button loaders without full page refresh
   - **Delete Confirmation** - Confirmation modal before deleting files
   - **Fullscreen Modals** - Create, edit, and view modals cover entire viewport with scrollable content
   - **Dark Mode Support** - Full dark mode theming for all file components including modals and markdown preview
   - **Auto-sort** - Pinned files automatically move to top on toggle without page reload

### Version 1.2.1 (Stable)
- **Release Date:** December 4, 2025
- **Highlights:**
   - **Task Editing** - Edit task titles directly with inline editing mode
   - **Delete All Tasks** - Remove all tasks for a specific date with confirmation
   - **Task View Modal** - Click on any task to view full details in a popup
   - **Text Truncation** - Long task titles now show ellipsis (...) with overflow handling
   - **Task Validation** - Maximum 500 characters and 50 words per task
   - **Improved Archive System** - Tasks are no longer deleted after archiving, preserved in database
   - **Checkbox-only Toggle** - Task completion only toggles when clicking the checkbox
- **User Authentication** - Secure registration and login with JWT tokens
- **Daily Task Management** - Create, toggle, edit, and delete tasks for specific dates
- **Task Analytics** - Archive past tasks and view completion statistics
- **Profile Management** - Update name, email, and password directly from dashboard
- **Dark/Light Mode** - GitHub-inspired theme with seamless switching
- **Mobile Optimized** - Responsive design with slide-out sidebar and icon navigation
- **Toast Notifications** - Real-time feedback for all user actions
- **Logout Confirmation** - Prevent accidental logouts
- **Split-Screen Auth** - Beautiful login/register pages with branding
- **Server Pinging** - Automated keep-alive mechanism that reduces request delays
- **CORS Security** - Restricted access to localhost and production frontend only

---

## Technology Stack

### Frontend
- **React** `18.2.0` - UI library
- **Vite** `5.0.0` - Build tool and dev server
- **React Router** `6.14.0` - Client-side routing
- **Bootstrap** `5.3.0` - CSS framework with custom theming
- **Remix Icon** `4.7.0` - Icon library
- **Axios** `1.4.0` - HTTP client
- **marked** `11.1.1` - Markdown parser and renderer

### Backend
- **Node.js** - JavaScript runtime
- **Express** `4.18.2` - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** `7.0.0` - MongoDB ODM
- **JWT** `9.0.0` - Authentication tokens
- **bcryptjs** `2.4.3` - Password hashing
- **CORS** `2.8.5` - Cross-origin resource sharing
- **Cloudinary** - Cloud-based image and file storage

### Design & Typography
- **Font Family** - [Geom](https://fonts.google.com/specimen/Geom) (Google Fonts)
  - Modern, clean sans-serif font
  - Variable font with weights from 300 to 900
  - Supports both regular and italic styles
  - Applied globally across the entire application

---

## Project Structure

```
Daylytics/
├── client/                          # Frontend React application
│   ├── public/
│   │   └── favicon.ico             # Application icon
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js            # Axios configuration and API client
│   │   ├── assets/                 # Static images and resources
│   │   ├── components/             # Reusable React components
│   │   │   ├── Loader.jsx          # Loading spinner component
│   │   │   ├── Modal.jsx           # Reusable modal dialog
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── ProfileModal.jsx    # User profile modal (deprecated)
│   │   │   └── ToastProvider.jsx   # Toast notification system
│   │   ├── context/                # React Context providers
│   │   │   ├── AuthContext.jsx     # Authentication state management
│   │   │   ├── DataContext.jsx     # Centralized data operations
│   │   │   └── ThemeContext.jsx    # Dark/light theme state
│   │   ├── pages/                  # Page-level components
│   │   │   ├── AnalyticsTab.jsx    # Archive viewing and analytics
│   │   │   ├── BucketTab.jsx       # Asset storage and management
│   │   │   ├── Dashboard.jsx       # Main dashboard container
│   │   │   ├── FilesTab.jsx        # Document management interface
│   │   │   ├── Login.jsx           # User login page
│   │   │   ├── Register.jsx        # User registration page
│   │   │   ├── Settings.jsx        # Settings and preferences
│   │   │   └── TasksTab.jsx        # Daily task management
│   │   ├── styles/                 # CSS stylesheets
│   │   │   ├── custom.css          # Custom component styles
│   │   │   ├── motions.css         # Animation definitions
│   │   │   └── theme.css           # Main theme and variables
│   │   ├── App.jsx                 # Root component with routing
│   │   └── main.jsx                # Application entry point
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies
│   └── vite.config.js              # Vite configuration
│
├── server/                          # Backend Node.js application
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection setup
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication middleware
│   │   ├── models/                 # Mongoose data models
│   │   │   ├── BucketFile.js       # Bucket file schema
│   │   │   ├── DailyArchive.js     # Archived tasks schema
│   │   │   ├── File.js             # Document/note schema
│   │   │   ├── Folder.js           # Folder hierarchy schema
│   │   │   ├── Task.js             # Daily task schema
│   │   │   └── User.js             # User account schema
│   │   ├── routes/                 # API route handlers
│   │   │   ├── archive.js          # Archive operations
│   │   │   ├── auth.js             # Authentication endpoints
│   │   │   ├── bucket.js           # Bucket file operations
│   │   │   ├── files.js            # File CRUD and inline images
│   │   │   ├── folders.js          # Folder CRUD operations
│   │   │   ├── storage.js          # Storage management
│   │   │   └── tasks.js            # Task CRUD operations
│   │   ├── services/               # Background services
│   │   │   ├── autoArchive.js      # Midnight archiving scheduler
│   │   │   └── cloudinaryService.js # Cloudinary integration
│   │   └── index.js                # Server entry point
│   ├── package.json                # Backend dependencies
│   └── .env                        # Environment variables (not in repo)
│
├── .gitignore                       # Git exclusion rules
└── README.md                        # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Cloudinary Account** (for file storage)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/daylytics.git
cd daylytics
```

#### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
   Create a `.env` file in the `server/` directory:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/daylytics
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/daylytics

# JWT Secret (use a strong random string)
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Server Configuration
PORT=5000
BACKEND_URL=http://localhost:5000

# Cloudinary Configuration (required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend server:

```bash
npm run dev     # Development mode with nodemon
# or
npm start       # Production mode
```

The server will run on `http://localhost:5000`

#### 3. Frontend Setup

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Optionally, create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The application will run on `http://localhost:5173`

#### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

### Seeding Test Data (Optional)

To populate the database with sample data:

```bash
cd server
npm run seed
```

This creates a test user account:
- **Email:** test@example.com
- **Password:** password
- **Sample Tasks:** 4 tasks (2 completed, 2 pending)

---

## API Documentation

### Authentication Endpoints

#### Register New User
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response (201):
{
  "token": "jwt_token_string",
  "user": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "storageUsed": 0,
    "storageLimit": 104857600
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string"
}

Response (200):
{
  "token": "jwt_token_string",
  "user": { /* user object */ }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response (200):
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "storageUsed": number,
  "storageLimit": number,
  "theme": "light|dark|system"
}
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "string",
  "email": "string"
}

Response (200):
{
  "msg": "Profile updated",
  "user": { /* updated user object */ }
}
```

#### Change Password
```
PUT /api/auth/password
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}

Response (200):
{
  "msg": "Password updated successfully"
}
```

### Task Endpoints

#### Get Tasks for Date
```
GET /api/tasks?date=YYYY-MM-DD
Authorization: Bearer {token}

Response (200):
[
  {
    "_id": "string",
    "user": "string",
    "title": "string",
    "completed": boolean,
    "date": "YYYY-MM-DD",
    "imageUrl": "string|null",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

#### Create Task
```
POST /api/tasks
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- title: string (required, max 500 chars, 50 words)
- date: YYYY-MM-DD (required)
- image: file (optional, image file)

Response (201):
{
  /* created task object */
}
```

#### Update Task
```
PUT /api/tasks/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string"
}

Response (200):
{
  /* updated task object */
}
```

#### Toggle Task Completion
```
PATCH /api/tasks/:id
Authorization: Bearer {token}

Response (200):
{
  /* updated task object with toggled completed status */
}
```

#### Delete Task
```
DELETE /api/tasks/:id
Authorization: Bearer {token}

Response (200):
{
  "msg": "Task deleted",
  "deletedImageUrl": "string|null"
}
```

#### Delete All Tasks for Date
```
DELETE /api/tasks?date=YYYY-MM-DD
Authorization: Bearer {token}

Response (200):
{
  "msg": "All tasks deleted",
  "count": number,
  "deletedImages": [...]
}
```

### File Endpoints

#### Get All Files
```
GET /api/files?folder=folder_id
Authorization: Bearer {token}

Query Parameters:
- folder: optional folder ID to filter by

Response (200):
[
  {
    "_id": "string",
    "user": "string",
    "title": "string",
    "content": "string",
    "folder": "string|null",
    "isPinned": boolean,
    "inlineImages": [...],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

#### Create File
```
POST /api/files
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string",
  "folder": "string|null"
}

Response (201):
{
  /* created file object */
}
```

#### Update File
```
PUT /api/files/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string"
}

Response (200):
{
  /* updated file object */
}
```

#### Delete File
```
DELETE /api/files/:id
Authorization: Bearer {token}

Response (200):
{
  "msg": "File deleted",
  "deletedImages": [...]
}
```

#### Toggle Pin Status
```
PATCH /api/files/:id/pin
Authorization: Bearer {token}

Response (200):
{
  /* updated file object */
}
```

#### Upload Inline Image
```
POST /api/files/upload-inline
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- image: file (required)
- fileId: string (optional)

Response (200):
{
  "url": "string",
  "fileId": "string"
}
```

### Folder Endpoints

#### Get Folders
```
GET /api/folders?parentFolder=parent_id
Authorization: Bearer {token}

Query Parameters:
- parentFolder: optional parent folder ID

Response (200):
[
  {
    "_id": "string",
    "user": "string",
    "name": "string",
    "parentFolder": "string|null",
    "isPinned": boolean,
    "createdAt": "ISO date string"
  }
]
```

#### Create Folder
```
POST /api/folders
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "string",
  "parentFolder": "string|null"
}

Response (201):
{
  /* created folder object */
}
```

#### Update Folder
```
PUT /api/folders/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "string",
  "isPinned": boolean
}

Response (200):
{
  /* updated folder object */
}
```

#### Delete Folder
```
DELETE /api/folders/:id
Authorization: Bearer {token}

Response (200):
{
  "msg": "Folder deleted"
}

Error (400 if not empty):
{
  "msg": "Cannot delete folder with files or subfolders"
}
```

#### Toggle Pin Status
```
PATCH /api/folders/:id/pin
Authorization: Bearer {token}

Response (200):
{
  /* updated folder object */
}
```

### Bucket Endpoints

#### Get Bucket Files
```
GET /api/bucket
Authorization: Bearer {token}

Response (200):
[
  {
    "_id": "string",
    "user": "string",
    "fileName": "string",
    "mimeType": "string",
    "fileSize": number,
    "url": "string",
    "cloudinaryPublicId": "string",
    "createdAt": "ISO date string"
  }
]
```

#### Upload File
```
POST /api/bucket/push
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: file (required, max 10MB)

Response (201):
{
  /* created bucket file object */
}

Error (413 if over storage limit):
{
  "msg": "Storage limit exceeded"
}
```

#### Get Download URL
```
GET /api/bucket/pull/:id
Authorization: Bearer {token}

Response (200):
{
  "url": "signed_cloudinary_url"
}
```

#### Delete File
```
DELETE /api/bucket/delete/:id
Authorization: Bearer {token}

Response (200):
{
  "msg": "File deleted successfully"
}
```

### Storage Endpoints

#### Get Storage Info
```
GET /api/storage
Authorization: Bearer {token}

Response (200):
{
  "storageUsed": number,
  "storageLimit": number,
  "assets": [
    {
      "id": "string",
      "name": "string",
      "url": "string",
      "type": "task|file|bucket",
      "size": number,
      "mimeType": "string",
      "taskTitle": "string (for task images)",
      "fileTitle": "string (for file inline images)",
      "fileId": "string (for file inline images)"
    }
  ]
}
```

#### Delete Asset
```
DELETE /api/storage/:type/:id?fileId=...&imageUrl=...
Authorization: Bearer {token}

Parameters:
- type: "task" | "file" | "bucket"
- id: task/file/bucket ID
- fileId: (query param, required for file inline images)
- imageUrl: (query param, required for file inline images)

Response (200):
{
  "msg": "Asset deleted",
  "newStorageUsed": number
}
```

### Archive Endpoints

#### Get Archives
```
GET /api/archive
Authorization: Bearer {token}

Response (200):
[
  {
    "_id": "string",
    "user": "string",
    "date": "YYYY-MM-DD",
    "tasks": [
      {
        "title": "string",
        "completed": boolean
      }
    ],
    "createdAt": "ISO date string"
  }
]
```

#### Archive Tasks (Manual)
```
POST /api/archive/rollover?date=YYYY-MM-DD
Authorization: Bearer {token}

Response (201):
{
  "msg": "Tasks archived",
  "archive": { /* archive object */ }
}

Error (400 if already archived):
{
  "msg": "Already archived this date"
}
```

---

## Configuration

### Environment Variables

#### Backend (.env in server/ directory)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/daylytics` |
| `JWT_SECRET` | Secret key for JWT signing | Yes | `your_random_secret_key_here` |
| `PORT` | Server port number | No | `5000` (default) |
| `BACKEND_URL` | Backend URL for health checks | No | `http://localhost:5000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | Yes | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | `your_api_secret` |

#### Frontend (.env in client/ directory)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | No | `http://localhost:5000` |

### Cloudinary Configuration

Cloudinary is used for all file uploads with the following folder structure:

- `daylytics/tasks` - Task image attachments
- `daylytics/files/inline` - File inline images
- `daylytics/bucket` - Bucket file storage

**Important:** All uploads count towards the 100MB per-user storage limit.

### CORS Configuration

The backend is configured to accept requests only from:
- `http://localhost:5173` (development)
- `http://localhost:5174` (alternative development port)
- Production frontend URL (configure in server/src/index.js)

---

## Development

### Available Scripts

#### Backend (server/)

```bash
npm run dev      # Start development server with nodemon (auto-restart)
npm start        # Start production server
npm run seed     # Seed database with test data
npm run rollover # Manually archive tasks for all users
```

#### Frontend (client/)

```bash
npm run dev      # Start Vite development server (HMR enabled)
npm run build    # Build for production (output to dist/)
npm run preview  # Preview production build locally
```

### Development Workflow

1. **Start Backend:** Run `npm run dev` in the `server/` directory
2. **Start Frontend:** Run `npm run dev` in the `client/` directory  
3. **Access App:** Navigate to `http://localhost:5173` in your browser
4. **Hot Module Replacement:** Frontend automatically reloads on code changes
5. **Auto-Restart:** Backend automatically restarts on code changes (nodemon)

### Code Style Guidelines

- **Frontend:** React functional components with hooks
- **Backend:** Express route handlers with async/await
- **Error Handling:** Try-catch blocks with descriptive error messages
- **Validation:** Input validation on both client and server
- **Comments:** JSDoc-style comments for complex functions

### Database Indexes

The application uses optimized MongoDB indexes for performance:

**Tasks:**
- Compound index: `{ user: 1, date: 1 }`
- Index: `{ user: 1, createdAt: -1 }`

**Files:**
- Compound index: `{ user: 1, folder: 1, isPinned: -1, updatedAt: -1 }`

**Folders:**
- Compound index: `{ user: 1, parentFolder: 1, isPinned: -1 }`

**Archives:**
- Compound unique index: `{ user: 1, date: 1 }`

**BucketFiles:**
- Compound index: `{ user: 1, createdAt: -1 }`

---

## Version History

### Version 1.7.9 (Current - Stable)
**Release Date:** December 25, 2025

**Updates:**
- **Code Editor Temporarily Disabled:** The Code Editor feature has been temporarily disabled due to performance issues and inconsistency
  - Feature will be re-enabled with improvements in version 1.8
  - All code and functionality preserved for future release
  - UI elements and navigation updated to reflect temporary removal

**Technical Changes:**
- Commented out editor routes in client and server
- Removed Editor tab from navigation menu
- Preserved EditorTab component and backend routes for future use

---

### Version 1.7.8 (Previous - Stable)
**Release Date:** December 24, 2025

**Major Features:**
- **Code Editor Tab (Beta):** Full-featured code editor with Monaco Editor integration
  - VS Code-like editing experience with IntelliSense and syntax highlighting
  - Two separate views: Window (HTML/CSS/JS) and Console (pure JavaScript)
  - Window view renders complete web pages with HTML, CSS, and JavaScript
  - Console view for JavaScript practice with console output capture
  - Real-time console output with color-coded log/error/warn messages
  - Separate console outputs for Window and Console views
  - Theme-aware code execution (dark/light mode support)
  - Auto-save functionality with 1-second debounce
  - All files stored in MongoDB per user
  - Reset to default files with confirmation modal
  - Desktop-only feature (hidden on mobile devices)

**Task Management Enhancements:**
- **Multiple View Modes:** Four different task viewing layouts
  - List View: Traditional list with checkboxes and timestamps
  - Card View: Grid cards with visual task representation
  - Compact View: Dense list for quick overview
  - Circle View: Visual circular progress indicators
- **View Mode Persistence:** Task view preference stored in database
  - Synced across devices and sessions
  - Accessible via settings API endpoint

**UI/UX Improvements:**
- Animated view transitions with fadeLift motion
- Improved card view with top-right action buttons
- Consistent modal design with custom confirmation dialogs
- Better mobile responsiveness for task views
- Theme-aware console colors for better readability

**API Updates:**
- New editor endpoints: `GET /api/editor`, `PUT /api/editor/:id`, `POST /api/editor/reset`
- Task view mode endpoint: `PUT /api/auth/settings` with task-view-mode support
- EditorFile model for storing user code files
- User settings expanded to include task-view-mode preference

**Technical Improvements:**
- Monaco Editor (@monaco-editor/react v4.7.0) integration
- Iframe sandboxing for secure code execution
- PostMessage API for console output capture
- Debounced auto-save to reduce database writes
- File content diffing to optimize updates
- Enhanced DataContext with editor state management

---

### Version 1.6.8 (Previous - Stable)
**Release Date:** December 22, 2025

**UI/UX Enhancements:**
- Improved dark mode support for code blocks in markdown preview
- Fixed storage management table contrast issues in dark mode
- Enhanced badge text visibility across all themes
- Standardized Modal component design across all confirmation dialogs
- Implemented custom modal for asset deletion (replaced browser confirm dialogs)
- Added hover effects for bucket file actions with proper color transitions
- Fixed delete button visibility on bucket file cards

**Bug Fixes:**
- Resolved table text rendering issues in dark mode
- Fixed storage management table background transparency
- Corrected type badge colors in both light and dark themes
- Improved button styling consistency in confirmation modals

**Technical Improvements:**
- All modals now use consistent reusable Modal component
- CSS variables properly applied to all table elements
- Improved color contrast ratios for accessibility compliance

---

### Version 1.6.7 ( Stable)
**Release Date:** December 20, 2025

**Major Features:**
- **Bucket Asset Storage System:** Complete file storage solution for any file type (images, documents, PDFs, videos, audio)
  - Image preview cards with automatic thumbnail generation
  - Video preview with inline playback controls
  - PDF viewer with native browser rendering
  - Word document preview via Office Online
  - Text file content display
  - Secure downloads via Cloudinary signed URLs
  - Maximum 10MB per file, 100MB total storage per user

- **Task Image Attachments:** Upload images directly to tasks
  - Stored in Cloudinary folder: `daylytics/tasks`
  - Integrated with storage quota system
  - Delete images with automatic storage recalculation

- **File Inline Images:** Embed images in markdown files
  - Markdown toolbar button for image uploads
  - Stored in Cloudinary folder: `daylytics/files/inline`
  - Automatic metadata tracking (fileId, url, originalName, size)
  - Proper storage quota integration

- **Comprehensive Settings System:** Dedicated settings page with sidebar navigation
  - Profile management (name and email updates)
  - Password change functionality
  - Storage management with visual asset overview
  - Logout confirmation modal
  - Responsive design for mobile devices

- **Storage Management System:** Complete quota tracking and management
  - 100MB (104,857,600 bytes) per user limit
  - Color-coded progress bar (green/yellow/red)
  - Unified view of all uploaded assets
  - Individual asset deletion capability
  - Real-time storage sync

- **URL-Based Navigation:** Dashboard tabs use URL routing
  - Routes: `/dashboard/tasks`, `/dashboard/files`, `/dashboard/analytics`, `/dashboard/bucket`, `/dashboard/settings`
  - Tab state persists across page reloads
  - Browser back/forward support

- **Analytics Enhancements:** Month and year selector for filtering archives
  - Select any month (January-December)
  - Select year (2025-2035)
  - Filter archives by date range

- **Typography Update:** Geom font family (Google Fonts) applied globally
  - Modern variable font with weights 300-900
  - Improved readability and visual consistency

**API Updates:**
- New storage management endpoints (`GET /api/storage`, `DELETE /api/storage/:type/:id`)
- New bucket endpoints (`POST /api/bucket/push`, `GET /api/bucket/pull/:id`, `DELETE /api/bucket/delete/:id`)
- Updated file upload endpoint with metadata tracking
- User model updated with storage fields

---

### Version 1.5.7 (Beta)
**Release Date:** December 18, 2025

**Features & Fixes:**
- Dedicated "Pinned Files" section in Files tab
- Split files into pinned/unpinned lists
- Fixed folder pin/unpin persistence in backend
- Updated UI version strings

---

### Version 1.5.6 (Beta)
**Release Date:** December 16, 2025

**Major Refactoring:**
- **DataContext:** Centralized all data operations
  - Unified Tasks, Analytics, Files, and Profile operations
  - Single source of truth for application state
  
- **Modular Architecture:** Separated tabs into independent components
  - TasksTab.jsx, FilesTab.jsx, AnalyticsTab.jsx
  - Improved code organization and maintainability

- **Global Loader System:** Replaced individual loaders
  - Global loader for initial app load
  - Operation loader for CRUD operations
  - Navigation loader for folder traversal

- **Smart Navigation:** Intelligent caching system
  - Instant folder navigation with cached data
  - No loader for cached content
  - Cache invalidation on mutations

- **UX Improvements:**
  - Consistent loading states
  - Clear operation feedback
  - Smooth transitions without empty state flashes
  - Removed manual refresh buttons (automatic refresh)

---

### Version 1.4.6 (Beta)
**Release Date:** December 2025

**Features:**
- Favicon implementation with Daylytics logo
- File sorting by title, date, and size
- Automatic save/load of sorting preferences
- Removed root files display for cleaner interface

---

### Version 1.4.5 (Beta)
**Release Date:** December 2025

**Improvements:**
- Fixed nested folder deletion loading states
- Simplified file creation workflow (auto-creates in current folder)
- Removed file moving feature for cleaner UX
- Optimized loading performance with enhanced caching
- Parallel fetch execution for folders and files

---

### Version 1.4.4 (Beta)
**Release Date:** December 2025

**Performance Optimizations:**
- Instant tab switching with persistent data
- Smart caching system for folder navigation
- Manual refresh controls for all tabs
- Unified initial data loading
- Eliminated empty state flashing

---

### Version 1.4.3 (Beta)
**Release Date:** December 2025

**Automation:**
- Automatic daily archiving at midnight (12:00 AM)
- Archives all tasks from previous day
- Removed manual archive button
- Precise scheduler for midnight execution

---

### Version 1.4.2 (Beta)
**Release Date:** December 2025

**Bug Fix:**
- Archive duplicate prevention
- Backend validation for existing archives

---

### Version 1.4.1 (Beta)
**Release Date:** December 2025

**Major Features:**
- **File & Folder Management System:**
  - Unlimited nested folder structure
  - Breadcrumb navigation
  - Pin folders and files
  - Delete with confirmation modals
  - Backend validation prevents deleting non-empty folders

- **Loading States:** Contextual full-page loaders
- **Mobile Optimization:** Files tab in sidebar menu
- **Icon Design:** Unified pin/delete icons

---

### Version 1.3.1 (Beta)
**Release Date:** December 2025

**Major Features:**
- **File Management System:** Complete CRUD for files/notes
- **Rich Text Editor:** 14 markdown formatting options
- **Fullscreen Modals:** Distraction-free editing
- **Markdown Rendering:** Live preview with `marked` library
- **Pin Files:** Keep important files at top
- **Character Limits:** Title (200 chars), Content (50,000 chars)

---

### Version 1.2.1 (Stable)
**Release Date:** December 4, 2025

**Features:**
- Task editing with inline mode
- Bulk delete all tasks for date
- Task view modal
- Task validation (500 chars, 50 words)
- Text truncation with ellipsis
- Improved archive system (tasks preserved)
- Checkbox-only completion toggle

---

### Version 1.1.1 (Stable)
**Release Date:** December 4, 2025

**Fixes:**
- Fixed login redirection to dashboard
- Dynamic theme system (system, light, dark)
- Per-task loaders for updates/deletes
- Improved mobile responsiveness
- GitHub contribution button
- Fixed task border styling

---

### Version 1.0.1 (Stable)
**Release Date:** December 4, 2025

**Features:**
- Server pinging mechanism (reduces cold starts)
- Version display on dashboard
- CORS security (localhost and production only)
- Automated health checks every 10 minutes

---

### Version 1.0.0 (Stable)
**Release Date:** December 2025

**Initial Release:**
- Complete authentication system with JWT
- Daily task CRUD operations
- Task archiving and analytics
- Profile management
- Dark/light theme toggle
- Mobile-responsive design
- Toast notification system
- Split-screen auth pages

---

## License

MIT License

Copyright (c) 2025 Daylytics

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.