# Daylytics

> A powerful daily task management app with built-in analytics to track your productivity.

**Current Version:** `1.4.5` (Beta)

---

## 🚀 Features

### Version 1.4.6 (Cuurrent — Beta)
- **Release Date:** December 2025
- Additional Improvements:
      - **🔖 Favicon Implementation** - Daylytics logo favicon added to enhance branding
      - Displays in browser tab for easy identification
      - Improves overall user experience
    - **🔧 Added Sorting Feature** - Users can now sort files by title, date, and size
      - Sorting preferences are saved and loaded automatically
      - Fixes formatting bugs related to file display
      - Removed root files display for cleaner interface

### Version 1.4.5 (Current)
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

---

## 📁 Folder Structure

```
Daylytics/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Loader.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   └── ToastProvider.jsx
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── FilesTab.jsx
│   │   ├── styles/            # Custom CSS
│   │   │   ├── theme.css
│   │   │   └── motions.css
│   │   ├── api/               # API client
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/                    # Backend application
│   ├── src/
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   ├── DailyArchive.js
│   │   │   ├── File.js
│   │   │   └── Folder.js
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── archive.js
│   │   │   ├── files.js
│   │   │   └── folders.js
│   │   ├── middleware/        # Custom middleware
│   │   │   └── auth.js
│   │   ├── config/            # Configuration
│   │   │   └── db.js
│   │   └── index.js           # Server entry point
│   ├── scripts/               # Utility scripts
│   │   ├── seedTestData.js
│   │   └── rolloverAll.js
│   └── package.json
│
└── README.md
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

### Tasks
- `GET /api/tasks?date=YYYY-MM-DD` - Get tasks for date
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Edit task title
- `PATCH /api/tasks/:id` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task
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

---

## 📦 Version History

### v1.4.6 (Current - Beta)
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
