# Daylytics

> A powerful daily task management app with built-in analytics to track your productivity.

**Current Version:** `1.6.7` (Stable)

---

## 🚀 Features

### 📋 Task Management
- **Daily Tasks** - Create, edit, toggle, and delete tasks for any date
- **Task Images** - Attach images to tasks for visual context and reference
- **Delete All** - Clear all tasks for a specific date with one click
- **Task Details Modal** - View full task information in a popup
- **Automatic Archiving** - Tasks automatically archived at midnight (12:00 AM) every day
- **Character Limits** - Tasks limited to 500 characters and 50 words

### 📝 Files & Notes
- **Rich Text Editor** - Full markdown toolbar with 14 formatting options (headings, bold, italic, code, lists, links, tables, etc.)
- **Inline Images** - Upload and embed images directly in file content
- **Folder Organization** - Create unlimited folders and subfolders for hierarchical file management
- **Pin Files & Folders** - Pin important items to keep them at the top
- **File Preview** - View rendered markdown content in a modal
- **Fullscreen Editor** - Distraction-free editing experience
- **Smart Caching** - Instant folder navigation with OS-like file explorer experience

### 🗄️ Bucket (Asset Storage) `Added in v1.6.7`
- **File Upload** - Upload any type of file (images, documents, videos, etc.)
- **Image Previews** - Automatic thumbnail generation for image files
- **Download Files** - Secure signed URLs for file downloads
- **Delete Assets** - Remove files from bucket with storage recalculation
- **Visual Cards** - Grid layout with image previews and glassmorphism buttons
- **File Type Icons** - Non-image files display appropriate icons

### 💾 Storage Management
- **100MB Limit** - Each user gets 100MB of storage for all assets
- **Unified View** - See all uploaded assets (task images, file inline images, bucket files) in one place
- **Storage Analytics** - Visual progress bar with color-coded usage (green/yellow/red)
- **Individual Deletion** - Delete any asset directly from storage page
- **Real-time Sync** - Storage updates instantly after upload/delete operations
- **Accurate Tracking** - All uploads tracked with proper file sizes from Cloudinary

### 📊 Analytics
- **Archive History** - View all past archived tasks with completion statistics
- **Month/Year Filter** - Select specific months and years (2025-2035) to view archives
- **Completion Rates** - See percentage of completed vs incomplete tasks
- **Task Counts** - Total tasks archived for each day
- **Automatic Archives** - System archives tasks every midnight

### ⚙️ Settings
- **Profile Management** - Update name and email
- **Password Change** - Secure password update with current password verification
- **Storage Overview** - View and manage all uploaded assets
- **Logout** - Secure logout with confirmation modal
- **Responsive Design** - Mobile-optimized settings interface

### 🎨 UI/UX
- **Dark/Light Mode** - GitHub-inspired theme with seamless switching
- **URL-Based Navigation** - Dashboard tabs use URL routing with browser back/forward support
- **Mobile Optimized** - Responsive design with slide-out sidebar and icon navigation
- **Toast Notifications** - Real-time feedback for all user actions
- **Loading States** - Contextual loaders for operations (creating, updating, deleting)
- **Glassmorphism** - Modern blur effects on buttons and modals

### 🔐 Security
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password encryption
- **CORS Security** - Restricted access to authorized origins only
- **Protected Routes** - All API endpoints require authentication

---

## ⚙️ Environment Variables

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
- **🎉 New in This Version:** Bucket (Asset Storage) feature - a complete file storage system for uploading, managing, and downloading any type of file
- **Major Features & Improvements:**
   - **🗄️ Bucket (Asset Storage) - NEW FEATURE** - Complete file storage system for all file types
     - Upload images, documents, PDFs, videos, and more
     - Image preview cards with automatic thumbnails
     - Secure file downloads via signed URLs
     - Integrated with storage management system
     - Glassmorphism buttons on image previews
   - **📷 Task Image Attachments - NEW FEATURE** - Attach images to tasks for visual reference
   - **🖼️ File Inline Images - NEW FEATURE** - Upload and embed images in markdown files
   - **⚙️ Comprehensive Settings System** - New dedicated settings page with multiple sections
     - Profile management (name/email updates)
     - Password change functionality
     - Storage management with asset overview
     - Logout confirmation
   - **💾 Storage Management System** - Complete storage tracking and management
     - 100MB storage limit per user
     - Visual storage usage with progress bar (color-coded: green/yellow/red)
     - Unified asset view showing all uploads (tasks, files, bucket)
     - Asset details: preview, name, type badge, source, size
     - Individual asset deletion from storage page
     - Real-time storage sync after operations
   - **📁 Inline Image Storage Tracking** - Accurate size tracking for file inline images
     - Metadata stored for each uploaded inline image
     - Proper storage calculation including inline images
     - Cloudinary integration for size retrieval
   - **🔗 URL-Based Navigation** - Dashboard tabs now use URL routing
     - `/dashboard/tasks` - Tasks tab
     - `/dashboard/files` - Files tab
     - `/dashboard/analytics` - Analytics tab
     - `/dashboard/bucket` - Bucket tab
     - `/dashboard/settings` - Settings tab
     - Tab persistence across page reloads via URL
     - Browser back/forward button support
   - **📊 Analytics Enhancements** - Month and year selector for analytics
     - Dropdown to select any month (January-December)
     - Dropdown to select year (2025-2035)
     - Filter archives by selected month/year combination
   - **🗑️ Mobile Delete All Button** - Delete all tasks button added to mobile view
     - Appears alongside heading in mobile layout
     - Consistent with desktop functionality
   - **🎨 Settings Page Responsive Design** - Mobile-optimized settings layout
     - Fixed sidebar and content heights (500px on desktop)
     - Auto-adjusting heights on mobile
     - Centered loading spinner (no text) for storage
     - All styles moved to theme.css
     - Text ellipsis for long file names and sources
   - **🖼️ Bucket Image Previews** - Image files show preview thumbnails in bucket cards
     - 200px height cover-fit images with rounded corners
     - Glassmorphism effect on action buttons over images
     - Blur backdrop with semi-transparent white background
     - Non-image files continue showing icon representation

### Version 1.5.7 (Previous — Beta)
- **Release Date:** December 18, 2025
- **Patch & UX Improvements:**
   - **📌 Pinned Files Section** - Added a dedicated "Pinned Files" section in the Files tab; pinned files now appear above other files.
   - **📱 Mobile Button Fix** - Fixed button display on mobile screens: modal action buttons now show icons on small screens with text hidden for a compact layout.
   - **🧩 UI Fixes** - Split files into pinned/unpinned lists and fixed a small key bug in the files listing.
   - **🔧 Backend Fix (Folders)** - `PUT /api/folders/:id` now persists `isPinned`; folder pin/unpin operations are saved correctly.
   - **📝 Misc** - Updated UI version strings to `v1.5.7`.

### Version 1.5.6 (Previous — Beta)
- **Release Date:** December 16, 2025
- **Major Refactoring & Performance:**
   - **🎯 Centralized Data Management** - Created DataContext for all data operations
     - Moved all database logic from individual tabs to single DataContext
     - Tasks, Analytics, Files, and Profile operations unified
     - Single source of truth for entire application
   - **📂 Modular Architecture** - Each tab separated into dedicated components
     - TasksTab.jsx, FilesTab.jsx, AnalyticsTab.jsx as independent components
     - Better code organization and maintainability
     - Easier to debug and extend individual features
   - **⚡ Single Global Loader** - Replaced individual tab loaders with unified loading system
     - Global loader for initial app load
     - Operation loader for CRUD operations (create, update, delete)
     - Navigation loader for folder navigation
     - Consistent Loader component used throughout
   - **🔄 Smart Navigation** - Instant folder navigation with intelligent caching
     - No loader during cached folder navigation
     - Only shows loader when fetching uncached folders
     - Prevents "no files" flash during navigation
   - **♿ Enhanced UX & Accessibility** - Improved user experience throughout
     - Consistent loading states prevent confusion
     - Clear feedback for all operations (creating, updating, deleting)
     - Smooth transitions without jarring empty states
     - Predictable behavior across all tabs
   - **🧹 Clean Tab Components** - All tabs are now purely presentational
     - No data fetching logic in TasksTab, FilesTab, or AnalyticsTab
     - Only UI helper functions (formatting, display logic)
     - Consistent empty state handling across all tabs
   - **🚫 Removed Refresh Buttons** - Data refreshes automatically after operations
     - Tasks refresh after create/update/delete
     - Files refresh after file/folder operations
     - Analytics refresh after archiving
   - **🎨 Improved Loader Styling** - Clean, solid background loader
     - Removed blur effect for better visibility
     - Solid white/theme background
     - Consistent full-screen display
   - **🐛 Modal Layout Fix** - Fixed file/folder modals positioning
     - Modals now render outside tab containers
     - Proper z-index and positioning
     - No wrapper interference

### Version 1.4.6 (Beta)
- **Release Date:** December 2025
- Additional Improvements:
      - **🔖 Favicon Implementation** - Daylytics logo favicon added to enhance branding
      - Displays in browser tab for easy identification
      - Improves overall user experience
    - **🔧 Added Sorting Feature** - Users can now sort files by title, date, and size
      - Sorting preferences are saved and loaded automatically
      - Fixes formatting bugs related to file display
      - Removed root files display for cleaner interface

### Version 1.4.5 (Beta)
- **Release Date:** December 2025
- **Files System Improvements & Performance:**
   - **🐛 Fixed Nested Folder Deletion Bug** - Folder deletion now properly handles loading states
     - Loading state clears properly on both success and error
     - Modal closes even if deletion fails to prevent UI from getting stuck
     - Comprehensive cache clearing after deletion
   - **✏️ Simplified File Creation** - Removed folder dropdown for intuitive workflow
     - Automatically creates files in current folder location
     - Shows current location indicator (Root or folder path)
     - Eliminates confusion about where file will be created
   - **❌ Removed File Moving Feature** - Files stay in creation location
     - Prevents accidental file misplacement
     - Cleaner, more focused editing modal
     - Simplified user experience
   - **⚡ Optimized Loading Performance** - Files section loads significantly faster
     - Enhanced caching strategy with cache-first approach
     - Reduced unnecessary API calls
     - Parallel fetch execution for folders and files
     - Instant navigation using cached data

### Version 1.4.4 (Beta)
- **Release Date:** December 2025
- **Performance Optimizations:**
   - **⚡ Instant Tab Switching** - Files tab data persists when switching between tabs
     - No reloading when navigating back to Files tab
     - Component stays mounted with display:none instead of unmounting
   - **💾 Smart Caching System** - Folder navigation uses intelligent cache
     - OS-like file explorer experience with instant folder navigation
     - Cache invalidation only on database operations (create, update, delete)
     - Eliminates unnecessary API calls when browsing folders
   - **🔄 Refresh Buttons** - Manual refresh controls added to all tabs
     - Tasks tab refresh with loader feedback
     - Analytics tab refresh with loader feedback
     - Files tab refresh clears cache and reloads all data
   - **📊 Unified Initial Load** - All data loads simultaneously on page load
     - Tasks, Analytics, and Files fetch in parallel
     - Single loader for entire dashboard instead of multiple loaders
     - Faster perceived performance
   - **🚫 Eliminated Flash of Empty State** - Fixed brief "No files and folders" flash
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
   - **🗑️ Removed Manual Archive Button** - Archive button removed from Analytics tab
     - Updated UI to show "auto-archived at midnight" message
     - System handles all archiving automatically

### Version 1.4.2 (Beta)
- **Release Date:** December 2025
- **Bug Fixes:**
   - **🐛 Archive Duplicate Prevention** - Fixed issue where the same day could be archived multiple times
     - Backend now checks for existing archives before creating new ones
     - Returns error message if date already archived
     - Prevents database pollution with duplicate entries

### Version 1.4.1 (Beta)
- **Release Date:** December 2025
- **Highlights:**
   - **📁 Advanced File & Folder Management System** - Complete hierarchical file organization
   - **🗂️ Folder System** - Create unlimited folders and subfolders to organize your files
     - Nested folder structure with parent-child relationships
     - Breadcrumb navigation for easy folder traversal
     - Pin folders to keep important ones at the top
     - Delete empty folders with confirmation
   - **📝 Enhanced File Management** - Files can be organized within folders or kept at root level
     - Select folder when creating new files
     - Move files between folders while editing
     - Files inherit current folder location by default
   - **📌 Folder & File Pinning** - Pin both folders and files for quick access
     - Pinned items automatically sort to top
     - Individual loading states for each pin action
     - Instant reordering without page reload
   - **🗑️ Smart Delete System** - Icon-based delete for both files and folders
     - Delete icon buttons next to pin buttons
     - Confirmation modals for both files and folders
     - Backend validation prevents deleting non-empty folders
   - **⚡ Operation Loading States** - Full-page loader with contextual messages
     - "Creating your file..." / "Creating folder..."
     - "Updating your file..." / "Deleting folder..."
     - Prevents double-clicks and improves UX
   - **📱 Mobile-Optimized Navigation** - Files tab accessible via sidebar on mobile
     - Hidden from mobile navbar icons
     - Available in hamburger menu
   - **🎨 Consistent Icon Design** - Unified UI with pin and delete icons
     - Folder cards show pin/delete icons in top-right
     - File cards match folder styling exactly
     - Yellow folder icons with visual hierarchy

### Version 1.3.1 (Beta)
- **Release Date:** December 2025
- **Highlights:**
   - **📁 File Management System** - Create, edit, view, and delete unlimited files/notes
   - **📝 Rich Text Editor** - Full markdown toolbar with 14 formatting options
     - Headings (H1, H2, H3)
     - Bold (`**text**`) and Italic (`_text_`)
     - Inline Code (`` `code` ``) and Code Blocks (` ```code``` `)
     - Bullet Lists and Numbered Lists
     - Links, Blockquotes, Tables, and Horizontal Rules
   - **📌 Pin Files** - Pin important files to keep them at the top with instant reordering
   - **🔍 File Preview** - Click any file to view full rendered markdown content
   - **✏️ Inline Editing** - Edit files with same rich text toolbar in fullscreen edit mode
   - **🗂️ Files Tab** - Dedicated tab alongside Tasks and Analytics with localStorage persistence
   - **📊 File Cards** - Visual grid layout showing title, markdown preview (stripped formatting), and last updated timestamp
   - **🎨 Consistent UI** - File management follows same dark/light theme and modal patterns as Tasks
   - **⚡ Per-File Loading States** - Individual pin button loaders without full page refresh
   - **🗑️ Delete Confirmation** - Confirmation modal before deleting files
   - **📱 Fullscreen Modals** - Create, edit, and view modals cover entire viewport with scrollable content
   - **🌓 Dark Mode Support** - Full dark mode theming for all file components including modals and markdown preview
   - **💾 Auto-sort** - Pinned files automatically move to top on toggle without page reload

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

## 🛠️ Tech Stack

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

## 📁 Folder Structure

```
Daylytics/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Loader.jsx           # Loading spinner component
│   │   │   ├── Modal.jsx            # Reusable modal component
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── ProfileModal.jsx     # User profile modal (deprecated)
│   │   │   └── ToastProvider.jsx    # Toast notification system
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.jsx      # Authentication state management
│   │   │   └── ThemeContext.jsx     # Dark/light theme management
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx        # Main dashboard container
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── TasksTab.jsx         # Daily tasks management
│   │   │   ├── FilesTab.jsx         # Files and folders management
│   │   │   ├── AnalyticsTab.jsx     # Archive analytics and history
│   │   │   ├── BucketTab.jsx        # Asset/file bucket storage
│   │   │   └── Settings.jsx         # Settings page (profile, password, storage)
│   │   ├── styles/            # Custom CSS
│   │   │   ├── theme.css            # Main theme and component styles
│   │   │   ├── motions.css          # Animation styles
│   │   │   └── custom.css           # Additional custom styles
│   │   ├── api/               # API client
│   │   │   └── index.js             # Axios configuration and interceptors
│   │   ├── assets/            # Static assets (images, icons)
│   │   ├── App.jsx            # Root component with routing
│   │   └── main.jsx           # Application entry point
│   ├── index.html             # HTML template
│   └── package.json           # Frontend dependencies
│
├── server/                    # Backend application
│   ├── src/
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js              # User model (auth, storage tracking)
│   │   │   ├── Task.js              # Task model (daily tasks)
│   │   │   ├── DailyArchive.js      # Archive model (archived tasks)
│   │   │   ├── File.js              # File model (notes with inline images)
│   │   │   ├── Folder.js            # Folder model (file organization)
│   │   │   └── BucketFile.js        # Bucket file model (asset storage)
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.js              # Authentication endpoints
│   │   │   ├── tasks.js             # Task CRUD operations
│   │   │   ├── archive.js           # Archive operations
│   │   │   ├── files.js             # File CRUD and inline image uploads
│   │   │   ├── folders.js           # Folder CRUD operations
│   │   │   ├── bucket.js            # Bucket file upload/download/delete
│   │   │   └── storage.js           # Storage management and tracking
│   │   ├── middleware/        # Custom middleware
│   │   │   └── auth.js              # JWT authentication middleware
│   │   ├── services/          # Background services
│   │   │   └── autoArchive.js       # Automatic midnight archiving
│   │   ├── config/            # Configuration
│   │   │   └── db.js                # MongoDB connection
│   │   └── index.js           # Server entry point
│   └── package.json           # Backend dependencies
│
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

---

## 🏃 Running Locally

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Daylytics
   ```

2. **Setup Backend**
   ```powershell
   cd server
   npm install
   ```
   
   Create `.env` file in `server/` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/daylytics
   JWT_SECRET=your_secret_key_here
   PORT=5000
   BACKEND_URL=http://localhost:5000/api/health
   ```

3. **Setup Frontend**
   ```powershell
   cd client
   npm install
   ```
   
   Create `.env` file in `client/` directory (optional):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start Development Servers**
   
   **Terminal 1 - Backend:**
   ```powershell
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`
   
   **Terminal 2 - Frontend:**
   ```powershell
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

5. **Access the Application**
   - Open browser and navigate to `http://localhost:5173`
   - Register a new account or use seeded test data

### Optional: Seed Test Data
```powershell
cd server
npm run seed
```
This creates a test user:
- **Email:** `test@example.com`
- **Password:** `password`
- **Tasks:** 4 tasks for yesterday (2 completed, 2 pending)

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Storage
- `GET /api/storage` - Get user's storage info and all assets
- `DELETE /api/storage/:type/:id` - Delete specific asset (task/file/bucket)

### Tasks
- `GET /api/tasks?date=YYYY-MM-DD` - Get tasks for date
- `POST /api/tasks` - Create new task (with optional image attachment)
- `PUT /api/tasks/:id` - Edit task title
- `PATCH /api/tasks/:id` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task (and associated image if exists)
- `DELETE /api/tasks?date=YYYY-MM-DD` - Delete all tasks for date

### Archive
- `POST /api/archive/rollover?date=YYYY-MM-DD` - Archive tasks for date
- `GET /api/archive` - Get all archived days

### Files
- `GET /api/files` - Get all files for current user
- `GET /api/files/:id` - Get specific file
- `POST /api/files` - Create new file
- `PUT /api/files/:id` - Update file (title and/or content)
- `DELETE /api/files/:id` - Delete file
- `PATCH /api/files/:id/pin` - Toggle file pin status
- `POST /api/files/upload-inline` - Upload inline image for markdown

### Folders
- `GET /api/folders` - Get folders for current user
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `PATCH /api/folders/:id/pin` - Toggle folder pin status

### Bucket
- `GET /api/bucket` - Get all bucket files for user
- `POST /api/bucket/push` - Upload file to bucket
- `GET /api/bucket/pull/:id` - Get signed URL for file download
- `DELETE /api/bucket/delete/:id` - Delete bucket file

---

## 📦 Version History

### v1.6.7 (Current - Beta)
**Release Date:** December 20, 2025

**🎉 New in This Version:**
This release introduces the **Bucket (Asset Storage)** feature - a complete file storage system allowing users to upload, download, and manage any type of file with visual previews and integrated storage tracking.

**Major Features & Improvements:**
- ✅ **Bucket (Asset Storage) - NEW FEATURE** - Complete file storage system for all file types
  - Upload any type of file (images, documents, PDFs, videos, etc.)
  - Image preview cards with automatic thumbnail generation
  - Download files via secure signed URLs
  - Delete files with automatic storage recalculation
  - Glassmorphism effect on action buttons over image previews
  - Grid layout with responsive design
  - File type icons for non-image files
  - Integrated with storage management system
- ✅ **Task Image Attachments - NEW FEATURE** - Attach images to tasks for visual context
  - Upload images directly when creating or editing tasks
  - Images stored in Cloudinary (folder: `daylytics/tasks`)
  - Image previews in task cards
  - Delete task images with storage recalculation
  - Counts towards 100MB storage limit
- ✅ **File Inline Images - NEW FEATURE** - Embed images in file markdown content
  - Upload images directly in the file editor
  - Markdown toolbar button for image uploads
  - Images stored in Cloudinary (folder: `daylytics/files/inline`)
  - Automatic storage tracking with metadata
  - Proper size tracking for all inline images
- ✅ **Comprehensive Settings System** - New dedicated settings page with sidebar navigation
  - Profile section for updating name and email
  - Password change section with current/new password fields
  - Storage management section with visual asset overview
  - Logout section with confirmation modal
  - Responsive sidebar (500px fixed height on desktop, auto on mobile)
- ✅ **Storage Management System** - Complete storage tracking and asset management
  - 100MB (104,857,600 bytes) storage limit per user
  - Visual progress bar showing storage usage (green <70%, yellow 70-90%, red >90%)
  - Unified asset view displaying all uploads from tasks, files, and bucket
  - Asset details table: thumbnail preview, name, type badge, source, size
  - Delete individual assets directly from storage page
  - Real-time storage sync after upload/delete operations
  - Cloudinary integration for fetching file sizes
- ✅ **Inline Image Storage Tracking** - Accurate size tracking for markdown inline images
  - File model stores metadata for each inline image (fileId, url, originalName, size)
  - Upload endpoint tracks image size and updates user storage
  - Storage calculation includes inline images with proper sizes
  - Fallback to Cloudinary API for legacy images without metadata
- ✅ **URL-Based Navigation** - Dashboard tabs now use URL routing for better UX
  - `/dashboard/tasks` - Tasks tab
  - `/dashboard/files` - Files tab  
  - `/dashboard/analytics` - Analytics tab
  - `/dashboard/bucket` - Bucket tab
  - `/dashboard/settings` - Settings tab
  - Tab state persists across page reloads via URL
  - Browser back/forward buttons work correctly
  - Default redirect from `/dashboard` to `/dashboard/tasks`
- ✅ **Analytics Enhancements** - Month and year selector for filtering archives
  - Month dropdown (January through December)
  - Year dropdown (2025 to 2035 - 10 years ahead)
  - Archives filtered by selected month and year combination
  - Shows "No archives for this month" when empty
- ✅ **Mobile Delete All Button** - Delete all tasks button now visible in mobile view
  - Positioned alongside heading in mobile layout
  - Same confirmation modal as desktop version
  - Consistent functionality across all screen sizes
- ✅ **Settings Page Responsive Design** - Mobile-optimized settings UI
  - Fixed heights for sidebar (500px) and content (min 500px) on desktop
  - Heights adjust automatically on mobile devices
  - Loading spinner centered without text for cleaner look
  - All inline styles moved to theme.css with proper class names
  - Text ellipsis for long file names (max 200px) and sources (max 150px)
  - Smaller asset previews on mobile (40px instead of 50px)
- ✅ **Bucket Image Previews** - Image files display thumbnail previews in bucket cards
  - Full-width 200px height images with cover fit and rounded corners
  - Glassmorphism effect on action buttons over images
    - Semi-transparent white background (rgba 0.2 opacity)
    - 10px backdrop blur filter
    - Subtle white border
  - Non-image files continue showing file type icons
  - Action buttons positioned at top-right of preview

**API Updates:**
- New `GET /api/storage` endpoint - Returns all user assets with sizes and metadata
- New `DELETE /api/storage/:type/:id` endpoint - Delete assets by type (task/file/bucket)
- New `POST /api/bucket/push` endpoint - Upload files to bucket storage
- New `GET /api/bucket/pull/:id` endpoint - Get signed download URL for bucket files
- New `DELETE /api/bucket/delete/:id` endpoint - Delete bucket files
- Updated `POST /api/files/upload-inline` - Accepts optional fileId to store metadata
- Updated `POST /api/tasks` - Accepts image attachments for tasks
- User model includes `storageUsed`, `storageLimit`, and `pendingInlineImages` fields
- File model includes `inlineImages` array for tracking inline image metadata
- BucketFile model for bucket asset management
- Storage routes query Cloudinary for legacy image sizes

**UI/UX Updates:**
- Settings icon button in navbar (replaces separate profile/logout buttons)
- Settings page with glassmorphism modal backdrop
- Asset table with responsive columns and hover effects
- Color-coded storage progress bar
- Mobile-first responsive design for settings page
- Consistent loading states across all sections
- **New Typography** - Geom font family from Google Fonts applied globally
  - Modern, clean variable font with weights 300-900
  - Replaces previous system fonts for better visual consistency
  - Supports both regular and italic styles

### v1.5.7 (Previous - Beta)
**Release Date:** December 18, 2025

**Patch & UX Improvements:**
- ✅ **Pinned Files Section** - Added a dedicated "Pinned Files" section in the Files tab; pinned files now appear above other files.
- ✅ **UI Fixes** - Split files into pinned/unpinned lists and fixed a small key bug in the files listing.
- ✅ **Backend Fix (Folders)** - `PUT /api/folders/:id` now persists `isPinned`; folder pin/unpin operations are saved correctly.
- ✅ **Misc** - Updated UI version strings to `v1.5.7`.

### v1.5.6 (Previous - Beta)
**Release Date:** December 16, 2025

**Major Refactoring & Performance:**
- ✅ **Centralized Data Management** - Created DataContext for all data operations
  - Moved all database logic from individual tabs to single DataContext
  - Tasks, Analytics, Files, and Profile operations unified
  - Single source of truth for entire application
- ✅ **Modular Architecture** - Each tab separated into dedicated components
  - TasksTab.jsx, FilesTab.jsx, AnalyticsTab.jsx as independent components
  - Better code organization and maintainability
  - Easier to debug and extend individual features
- ✅ **Single Global Loader** - Replaced individual tab loaders with unified loading system
  - Global loader for initial app load
  - Operation loader for CRUD operations (create, update, delete)
  - Navigation loader for folder navigation
  - Consistent Loader component used throughout
- ✅ **Smart Navigation** - Instant folder navigation with intelligent caching
  - No loader during cached folder navigation
  - Only shows loader when fetching uncached folders
  - Prevents "no files" flash during navigation
- ✅ **Enhanced UX & Accessibility** - Improved user experience throughout
  - Consistent loading states prevent confusion
  - Clear feedback for all operations (creating, updating, deleting)
  - Smooth transitions without jarring empty states
  - Predictable behavior across all tabs
- ✅ **Clean Tab Components** - All tabs are now purely presentational
  - No data fetching logic in tabs
  - Only UI helper functions (formatting, display logic)
  - Consistent empty state handling
- ✅ **Removed Refresh Buttons** - Data refreshes automatically after operations
  - Tasks refresh after create/update/delete
  - Files refresh after file/folder operations
  - Analytics refresh after archiving
- ✅ **Improved Loader Styling** - Clean, solid background loader
  - Removed blur effect for better visibility
  - Solid white/theme background
  - Consistent full-screen display
- ✅ **Modal Layout Fix** - Fixed file/folder modals positioning
  - Modals now render outside tab containers
  - Proper z-index and positioning

### v1.4.6 (Beta)
**Release Date:** December 2025
**Additional Improvements:**
- ✅ **Favicon Implementation** - Daylytics logo favicon added to enhance branding
  - Displays in browser tab for easy identification
  - Improves overall user experience
- ✅ **Added Sorting Feature** - Users can now sort files by title, date, and size
  - Sorting preferences are saved and loaded automatically
  - Fixes formatting bugs related to file display
  - Removed root files display for cleaner interface

### v1.4.5 (Beta)
**Release Date:** December 2025

**Files System Improvements & Performance:**
- ✅ **Fixed Nested Folder Deletion Bug** - Folder deletion now properly handles loading states
  - Loading state clears properly on both success and error
  - Modal closes even if deletion fails to prevent UI from getting stuck
  - Comprehensive cache clearing after deletion
- ✅ **Simplified File Creation** - Removed folder dropdown for intuitive workflow
  - Automatically creates files in current folder location
  - Shows current location indicator (Root or folder path)
  - Eliminates confusion about where file will be created
- ✅ **Removed File Moving Feature** - Files stay in creation location
  - Prevents accidental file misplacement
  - Cleaner, more focused editing modal
  - Simplified user experience
- ✅ **Optimized Loading Performance** - Files section loads significantly faster
  - Enhanced caching strategy with cache-first approach
  - Reduced unnecessary API calls
  - Parallel fetch execution for folders and files
  - Instant navigation using cached data

### v1.4.4 (Beta)
**Release Date:** December 2025

**Performance Optimizations:**
- ✅ **Instant Tab Switching** - Files tab data persists when switching between tabs
  - No reloading when navigating back to Files tab
  - Component stays mounted with display:none instead of unmounting
- ✅ **Smart Caching System** - Folder navigation uses intelligent cache
  - OS-like file explorer experience with instant folder navigation
  - Cache invalidation only on database operations (create, update, delete)
  - Eliminates unnecessary API calls when browsing folders
- ✅ **Refresh Buttons** - Manual refresh controls added to all tabs
  - Tasks tab refresh with loader feedback
  - Analytics tab refresh with loader feedback
  - Files tab refresh clears cache and reloads all data
- ✅ **Unified Initial Load** - All data loads simultaneously on page load
  - Tasks, Analytics, and Files fetch in parallel
  - Single loader for entire dashboard instead of multiple loaders
  - Faster perceived performance
- ✅ **Eliminated Flash of Empty State** - Fixed brief "No files and folders" flash
  - Proper initial loading state prevents UI flicker
  - Smooth data population without visual glitches

**Technical Improvements:**
- Implemented useRef caching for folders and files
- Coordinated loading states between Dashboard and FilesTab
- Added optional loader parameters to fetch functions
- Cache invalidation strategy on all mutations

---

### v1.4.3 (Beta)
**Release Date:** December 2025

**New Features:**
- ✅ **Automatic Daily Archiving** - System automatically archives tasks at midnight (12:00 AM)
  - Auto-archive service runs at exactly midnight every day
  - Archives all tasks from previous day (both completed and incomplete)
  - Tasks remain on their original date permanently
  - Each new day starts completely fresh with zero tasks
  - Scheduler calculates precise time until midnight for accurate execution
  - No manual intervention required

**UI Updates:**
- ✅ **Removed Manual Archive Button** - Archive button removed from Analytics tab
  - Updated Analytics header to show "auto-archived at midnight" message
  - System fully automates the archiving process

**Backend Updates:**
- New `autoArchive.js` service with midnight scheduler
- Auto-archive function processes all users automatically
- Calculates milliseconds until next midnight for precise scheduling
- Logs all archive operations for monitoring

---

### v1.4.2 (Beta)
**Release Date:** December 2025

**Bug Fixes:**
- ✅ **Archive Duplicate Prevention** - Fixed issue where the same day could be archived multiple times
  - Backend now checks for existing archives before creating new ones
  - Returns error message if date already archived
  - Prevents database pollution with duplicate entries

---

### v1.4.1 (Beta)
**Release Date:** December 2025

**New Features:**
- ✅ **Advanced File & Folder Management System** - Complete hierarchical file organization
- ✅ **Folder System** - Create unlimited folders and subfolders to organize your files
  - Nested folder structure with parent-child relationships
  - Breadcrumb navigation for easy folder traversal
  - Pin folders to keep important ones at the top
  - Delete empty folders with confirmation
- ✅ **Enhanced File Management** - Files can be organized within folders or kept at root level
  - Select folder when creating new files
  - Move files between folders while editing
  - Files inherit current folder location by default
- ✅ **Folder & File Pinning** - Pin both folders and files for quick access
  - Pinned items automatically sort to top
  - Individual loading states for each pin action
  - Instant reordering without page reload
- ✅ **Smart Delete System** - Icon-based delete for both files and folders
  - Delete icon buttons next to pin buttons
  - Confirmation modals for both files and folders
  - Backend validation prevents deleting non-empty folders
- ✅ **Operation Loading States** - Full-page loader with contextual messages
  - "Creating your file..." / "Creating folder..."
  - "Updating your file..." / "Deleting folder..."
  - Prevents double-clicks and improves UX
- ✅ **Mobile-Optimized Navigation** - Files tab accessible via sidebar on mobile
  - Hidden from mobile navbar icons
  - Available in hamburger menu
- ✅ **Consistent Icon Design** - Unified UI with pin and delete icons
  - Folder cards show pin/delete icons in top-right
  - File cards match folder styling exactly
  - Yellow folder icons with visual hierarchy

**API Updates:**
- `GET /api/folders` - Get folders for current user (with optional parentFolder filter)
- `GET /api/folders/:id` - Get specific folder
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder (rename/move)
- `DELETE /api/folders/:id` - Delete empty folder
- `PATCH /api/folders/:id/pin` - Toggle folder pin status
- Updated `GET /api/files` - Now accepts folder query parameter
- Updated `POST /api/files` - Accepts folder field for organization
- Updated `PUT /api/files/:id` - Can move files between folders

**Database Updates:**
- New `Folder` model with user, name, parentFolder, isPinned fields
- Updated `File` model with folder reference field
- Compound indexes for optimized queries

---

### v1.3.1 (Beta)
**Release Date:** December 2025

**New Features:**
- ✅ **File Management System** - Create, edit, view, delete, and organize unlimited files/notes
- ✅ **Rich Text Editor** - Full markdown toolbar with 14 formatting options:
  - **Headings:** H1, H2, H3
  - **Text Styling:** Bold (`**text**`), Italic (`_text_`)
  - **Lists:** Bullet lists, Numbered lists
  - **Code:** Inline code (`` `code` ``), Code blocks (` ```code``` `)
  - **Advanced:** Links, Blockquotes, Tables, Horizontal rules
- ✅ **Pin Files** - Pin important files to keep them at the top with instant reordering
- ✅ **Fullscreen Modals** - Create, edit, and view modals cover entire viewport for distraction-free writing
- ✅ **Markdown Rendering** - File content rendered with `marked` library, showing formatted preview
- ✅ **File Cards** - Beautiful grid layout with title truncation, stripped markdown preview, and "Last updated" timestamp
- ✅ **Files Tab** - New dedicated tab in navigation with localStorage persistence
- ✅ **Character Limits** - Title max 200 chars, Content max 50,000 chars with live counters
- ✅ **Delete Confirmation** - Modal confirmation before deleting files

**Improvements:**
- ✅ **Consistent UI** - File management follows same dark/light theme and modal patterns as Tasks
- ✅ **Responsive Toolbar** - Rich text toolbar adapts to mobile screens with horizontal scrolling
- ✅ **Per-File Loading States** - Individual pin button loaders without full page refresh
- ✅ **Auto-sort on Pin** - Pinned files automatically move to top when toggled (no page reload needed)
- ✅ **Dark Mode Support** - Full theming for modals, toolbar, markdown preview, and all file components
- ✅ **Backdrop Blur** - Modal backgrounds match task modal behavior with blur effect
- ✅ **Click-Outside-to-Close** - Modals close when clicking backdrop (same UX as tasks)
- ✅ **Conditional Dashboard Sections** - Welcome/hero sections hide when Files tab is active
- ✅ **File Validation** - Server-side validation for title and content length
- ✅ **Indexed Database** - Optimized queries with compound indexes on user, isPinned, and timestamps
- ✅ **Smart Formatting** - Toolbar buttons properly handle text selection and cursor positioning

**API Updates:**
- `GET /api/files` - Fetch all files for logged-in user (sorted by pinned and updatedAt)
- `GET /api/files/:id` - Get specific file by ID
- `POST /api/files` - Create new file with validation
- `PUT /api/files/:id` - Update file title and/or content
- `DELETE /api/files/:id` - Delete file
- `PATCH /api/files/:id/pin` - Toggle pin status

**Bug Fixes:**
- ✅ Fixed inline code, bold, and italic formatting not applying to selected text
- ✅ Fixed modal border-radius in dark mode
- ✅ Fixed toolbar colors in dark mode
- ✅ Fixed markdown preview showing white background in dark mode
- ✅ Fixed theme toggle showing unnecessary loader
- ✅ Fixed modals covering entire viewport with proper scrolling

---

### v1.2.1 (Stable)
**Release Date:** December 4, 2025

**New Features:**
- ✅ **Task Editing** - Edit task titles with inline editing mode (Save/Cancel icons with hover animations)
- ✅ **Delete All Tasks** - Bulk delete all tasks for a specific date with confirmation modal
- ✅ **Task View Modal** - Click on task content to view full details in popup
- ✅ **Task Validation** - Maximum 500 characters and 50 words per task title
- ✅ **Text Truncation** - Long task titles display with ellipsis (...) and proper overflow handling

**Improvements:**
- ✅ **Improved Archive System** - Tasks no longer deleted after archiving, preserved in database for history
- ✅ **Checkbox-only Toggle** - Task completion only triggers when clicking checkbox (not entire row)
- ✅ **Enhanced Button Styles** - Edit, save, cancel buttons use same hover animation pattern as delete
- ✅ **Better Mobile Spacing** - Reduced padding and margins on mobile to prevent component overlap

**API Updates:**
- `PUT /api/tasks/:id` - New endpoint for editing task titles
- `DELETE /api/tasks?date=YYYY-MM-DD` - New endpoint for bulk deletion
- Enhanced validation on task creation and editing

---

### v1.1.1 (Stable)
**Release Date:** December 4, 2025

**Fixes & Improvements:**
- ✅ Fixed login redirection — users now go straight to the dashboard after successful login.
- ✅ Theme improvements — dark/light theme is now dynamic and fetched/persisted per-user (supports `system`, `light`, `dark`).
- ✅ Better UX for task updates/deletes — per-task loaders and disabled controls while requests are in-flight.
- ✅ Improved responsiveness on very small screens so layout and controls remain usable.
- ✅ Added GitHub contribution button directly on the dashboard.
- ✅ Fixed task border visual issues for consistent item styling.

---

### v1.0.1 (Stable)
**Release Date:** December 4, 2025

**New Features:**
- ✅ Server pinging mechanism - Keeps backend alive and reduces cold start delays
- ✅ Version display on dashboard - Shows current version in bottom-right corner
- ✅ Updated version badges on auth pages
- ✅ CORS security - Configured to only allow localhost and production frontend (https://daylytics.onrender.com)

**Improvements:**
- Optimized server response times with automated health checks every 10 minutes
- Better user experience with reduced initial request latency
- Enhanced security with restricted CORS origins

**Tech Updates:**
- Added Axios to server dependencies for health check requests
- Configured CORS whitelist for allowed origins

---

### v1.0.0 (Stable)
**Release Date:** December 2025

**Features:**
- ✅ Complete authentication system
- ✅ Daily task CRUD operations
- ✅ Task archiving and analytics
- ✅ Profile management
- ✅ Dark/light theme toggle
- ✅ Mobile-responsive design
- ✅ Toast notification system
- ✅ Split-screen auth pages

**Tech Stack:**
- React 18.2.0, Vite 5.0.0
- Express 4.18.2, MongoDB, Mongoose 7.0.0
- JWT authentication, bcryptjs

---

## 🧪 Development Scripts

### Server Scripts
```powershell
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed test data
npm run rollover # Archive tasks for all users
```

### Client Scripts
```powershell
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📝 License

MIT

---
