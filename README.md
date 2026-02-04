# Daylytics

A lightweight productivity and notes app with advanced task management, markdown documents, and asset storage — built for simplicity and extensibility.

---

**Version:** 1.2.0  
**Release Date:** 02-04-2026

---

## Changelog

### Version 1.2.0 (02-04-2026)
**Major Updates:**
- **Complete Task System Transformation**: Migrated from date-based daily tasks to persistent task management
  - Tasks now remain indefinitely until completed or deleted
  - Added rich task properties: descriptions (2000 chars), priority levels, categories, due dates
  - Removed date dependency and archiving system
  
- **Advanced Task Features**:
  - Statistics dashboard with real-time counts (total, completed, pending, high-priority)
  - Comprehensive filtering: by status, priority, category, and text search
  - Smart sorting options: newest/oldest first, alphabetical, by priority, by due date
  - Inline editing for all task fields
  - Bulk operations (complete all, delete all completed)
  - Image attachments up to 10MB per task
  
- **Frontend Improvements**:
  - Modal-based task creation for better UX
  - Fixed image height in modals with scrollable containers
  - Created reusable Version component used across Login, Register, and Dashboard
  - Color-coded priority badges (Red/High, Yellow/Medium, Gray/Low)
  
- **Backend Optimizations**:
  - Removed redundant storage routes (233 lines) that duplicated bucket functionality
  - Eliminated expensive storage calculation endpoints
  - Cleaned up route registrations (8 → 7 endpoints)
  - Reduced memory footprint and improved startup time
  
- **Bug Fixes**:
  - Fixed Files tab showing empty data despite database having records
  - Fixed malformed HTML causing parse errors in TasksTab
  - Removed fetchArchives() calls from DataContext
  
- **Deleted Files**: AnalyticsTab.jsx, archive.js routes, DailyArchive.js model, autoArchive.js service, storage.js routes

### Version 1.0.0 (Initial Release)
- Basic daily task tracking with date-based system
- Markdown notes with inline images
- File and folder organization
- Bucket for direct file uploads
- JWT authentication
- Cloudinary integration for asset storage

---

## 1. Project summary and headline features
Daylytics is a powerful yet simple productivity application focused on task management and note-taking for individuals and small teams. The product combines an advanced persistent task manager, a markdown-based notes system, and an integrated asset storage manager. It is designed to be self-hosted and extensible.

Key features:
- **Advanced Persistent Task Management** - Create tasks with titles, descriptions, priorities, categories, due dates, and image attachments. Tasks persist indefinitely until completed or deleted.
- **Smart Filtering & Search** - Filter tasks by status, priority, or category. Search across task titles, descriptions, and categories.
- **Priority System** - Organize tasks with Low, Medium, and High priority levels with visual badges.
- **Statistics Dashboard** - Real-time overview of total, completed, pending, and high-priority tasks.
- **Markdown-based Notes** - Full-featured markdown editor with inline image uploads and live preview.
- **File and Folder Organization** - Unlimited nested folders with pinning and prioritized access.
- **Per-user Storage Quota** - Asset tracking with configurable storage limits.
- **Integrated Bucket** - Direct file uploads for images, PDFs, documents, and videos.

---

## 2. Features (detailed)
The following sections provide a detailed description of product features and their expected behavior.

### Tasks
- **Persistent Task Management**: Create tasks that remain until you complete or delete them - no date restrictions.
- **Rich Task Data**: Each task includes:
  - Title (max 500 chars)
  - Optional description (max 2000 chars)
  - Priority level (Low, Medium, High)
  - Optional category for grouping
  - Optional due date
  - Optional image attachment (max 10MB)
  - Completion status
  - Created and updated timestamps
- **Advanced Filtering**:
  - Status filter: All, Pending, or Completed
  - Priority filter: All, Low, Medium, or High
  - Text search across titles, descriptions, and categories
- **Smart Sorting**:
  - Newest First (default)
  - Oldest First
  - Alphabetical by Title
  - By Priority Level
  - By Due Date
- **Inline Editing**: Edit any task field directly in the list view or detail modal.
- **Bulk Operations**:
  - Complete all pending tasks at once
  - Delete all completed tasks with confirmation
- **Statistics Overview**: Real-time dashboard showing:
  - Total tasks count
  - Completed tasks count
  - Pending tasks count  
  - High priority pending tasks count
- **Visual Priority Badges**: Color-coded badges (Red for High, Yellow for Medium, Gray for Low).
- **Attachment Support**: Upload and view images directly attached to tasks.

### Notes & Files (Markdown editor)
- Files are stored as Markdown documents with a title and content.
- Markdown editor with helper actions for:
  - Tables with configurable rows/columns
  - Custom spacing (margin/padding wrappers)
  - Inline image uploads
- Markdown syntax support:
  - Headings (H1-H6) and formatting (bold, italic)
  - Links, inline code, code blocks, blockquotes
  - Ordered and unordered lists
  - Tables and horizontal rules
- Inline images: users can upload images and embed them into notes; images are uploaded to Cloudinary and tracked in the file's metadata.
- Inline image metadata: each inline image stores { fileId, url, originalName, size } so storage can be accurately tracked and cleaned up when a file or image is deleted.
- Preview: live markdown rendering using `marked` with sanitized output to prevent XSS.

### Storage & Bucket
- Bucket supports direct file uploads (images, PDFs, documents, videos up to configured per-file limit).
- Per-user quota: default 100MB (configurable). Uploads fail with 413 when user exceeds quota.
- Storage view: unified list of all assets across tasks, files, and bucket entries with size, type, and origin information.
- Deletion: deleting a file or inline image reduces used storage; server removes Cloudinary assets on delete.

### Folders & Organization
- Unlimited nested folders with parent/child relationships.
- Breadcrumb navigation for easy traversal and current folder context when creating files.
- Pinning for files and folders that should remain at the top of lists.
- Deletion safety: folders with children or files cannot be deleted without first removing or reassigning contents.

### Security & UX
- JWT-based authentication for all protected endpoints.
- Role-less single-user model (no multi-tenancy) — users only access their own data.
- CORS restricted to local dev and configured production url by default.
- Accessibility considerations: responsive mobile-first UI, clear focus states, and confirmation modals for destructive actions.

---

## 3) Folder structure and API reference
A concise overview of the repo structure and the server API endpoints.

### Project structure (detailed)
```
Daylytics/
├── client/                          # Frontend React application (Vite)
│   ├── public/                       # Static assets (favicon, index.html)
│   ├── src/
│   │   ├── api/                      # Axios instance and API helper modules (auth, tasks, files)
│   │   ├── assets/                   # Images, fonts, icons
│   │   ├── components/               # Reusable UI components (Modal, Loader, Navbar, Toast, etc.)
│   │   ├── context/                  # React Context providers (AuthContext, DataContext, ThemeContext)
│   │   ├── pages/                    # Page and tab components (Dashboard, TasksTab, FilesTab...)
│   │   ├── styles/                   # CSS (theme.css, custom.css, motions.css)
│   │   └── main.jsx                  # App bootstrap (providers, router)
│   ├── package.json
│   └── vite.config.js
├── server/                          # Backend Node/Express API
│   ├── src/
│   │   ├── config/                   # DB connection (db.js) and configuration helpers
│   │   ├── middleware/               # Auth middleware (JWT) and error handlers
│   │   ├── models/                   # Mongoose schemas (User, Task, File, Folder, BucketFile, SharedLink)
│   │   ├── routes/                   # Route handlers (auth, tasks, files, folders, bucket, search)
│   │   ├── services/                 # Background services (cloudinaryService)
│   │   └── index.js                  # Server entrypoint and app initialization
│   ├── package.json
│   └── .env.example                  # Example environment variables
├── README.md                         # Project documentation (this file)
├── .gitignore
└── (optional) Dockerfile, CI configs
```

Key files
- `client/src/api/index.js` — central Axios instance and API helper modules
- `client/src/context/DataContext.jsx` — primary data operations and caching layer for tasks, files, folders, and bucket
- `client/src/pages/FilesTab.jsx` — Markdown editor, inline image upload handling, and file management UI
- `server/src/routes/files.js` — API handlers for file CRUD and inline image uploads
- `server/src/models/File.js` — Mongoose schema with `inlineImages` metadata
- `server/src/services/cloudinaryService.js` — Cloudinary upload/delete helpers and URL signing utilities
- `server/src/config/db.js` — MongoDB connection setup and export

The repository structure facilitates locating code relevant to a specific feature or issue.

### API Endpoints (short reference)
All endpoints require `Authorization: Bearer {token}` unless noted.

Auth
- POST `/api/auth/register` — register new user
- POST `/api/auth/login` — login
- GET `/api/auth/me` — get current user
- PUT `/api/auth/profile` — update name/email
- PUT `/api/auth/password` — change password

Tasks
- GET `/api/tasks` — get all tasks for user (supports query params: status, priority, category, search, sort)
- POST `/api/tasks` — create task (body: { title, description?, priority?, category?, dueDate? })
- PUT `/api/tasks/:id` — update task (body: any task field)
- PATCH `/api/tasks/:id` — toggle task completion
- DELETE `/api/tasks/:id` — delete single task
- DELETE `/api/tasks?type=completed` — delete all completed tasks
- POST `/api/tasks/:id/upload` — upload image attachment (multipart)
- DELETE `/api/tasks/:id/upload` — delete image attachment

Files
- GET `/api/files?folder=folder_id` — list files
- POST `/api/files` — create file (JSON)
- PUT `/api/files/:id` — update file
- DELETE `/api/files/:id` — delete file and inline images
- PATCH `/api/files/:id/pin` — toggle pin
- POST `/api/files/upload-inline` — upload inline image (multipart)

Folders
- GET `/api/folders` — list folders
- POST `/api/folders` — create folder
- PUT `/api/folders/:id` — update folder (name, isPinned)
- DELETE `/api/folders/:id` — delete folder (fails if not empty)

Bucket (asset storage)
- GET `/api/bucket` — get bucket files
- POST `/api/bucket/push` — upload file to bucket (multipart)
- GET `/api/bucket/pull/:id` — get download URL
- DELETE `/api/bucket/delete/:id` — delete bucket file

Search
- GET `/api/search?query=...` — search files and folders by name/content

---

## 4. Developer setup and technologies
Follow these steps to get a development environment running locally.

### Clone & install
```bash
git clone https://github.com/yourusername/daylytics.git
cd daylytics
```

#### Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with MONGO_URI, JWT_SECRET, CLOUDINARY_* etc
npm run dev
```

#### Frontend
```bash
cd client
npm install
cp .env.example .env
# Edit VITE_API_URL if needed
npm run dev
```

### Seed data
On the server, `npm run seed` will create a test user and sample tasks/files for local testing.

### Scripts (useful)
- `server: npm run dev` — dev server with nodemon
- `server: npm run seed` — seed database with sample data
- `client: npm run dev` — start Vite with hot module replacement (HMR)
- `client: npm run build` — build for production

### Tech stack and versions

#### Frontend

| Technology | Version | Notes |
|------------|---------|-------|
| React | 18.2.0 | Primary UI library |
| Vite | 5.x | Development server and build tool |
| Bootstrap | 5.3.0 | CSS framework and components |
| marked | 11.1.x | Markdown parsing and rendering |
| Axios | 1.4.0 | HTTP client |
| Remix Icon | 4.7.0 | Icon set |
| Development tooling | ESLint, Prettier, Vitest/Jest | Linting, formatting, and testing |

#### Backend

| Technology | Version | Notes |
|------------|---------|-------|
| Node.js | 18.x+ (supports 14+) | Runtime (LTS 18/20 recommended) |
| Express | 4.18.2 | Web framework |
| Mongoose | 7.x | MongoDB ODM |
| MongoDB | 4.4+ / Atlas | Document database |
| jsonwebtoken | 9.x | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Cloudinary SDK | See `server/package.json` | Upload and asset management |
| Development tooling | nodemon | Development server reload |

**Notes**
- The versions above reflect what the project currently uses; run `npm outdated` in `client/` and `server/` to see available updates.
- When upgrading core dependencies (Node, React, Mongoose), test migrations and run integration tests to avoid breaking changes.

### Notes for contributors
- Keep PRs small and focused; include tests for backend changes.
- Respect schema changes: removing fields (like legacy `isDaily`) requires a DB migration and a clear rollback plan.
- If removing dependencies (e.g., monaco), prune `package-lock.json` / `node_modules` and run fresh installs.

---

## 5) Acknowledgements and license
Thank you for using or contributing to Daylytics — feedback and PRs are welcome. If you'd like a hosted demo or enterprise support, contact the repo owner.

**License**: MIT License © 2026 Daylytics

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, subject to the following conditions: the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

