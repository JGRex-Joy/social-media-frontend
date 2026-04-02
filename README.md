# Social Media Frontend — Pulse

A modern social media web application built with **React 18**, **Vite**, and **Tailwind CSS**. Connects to the [social-media-backend](https://github.com/JGRex-Joy/social-media-backend) REST API.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Pages & Routes](#pages--routes)
- [Key Components](#key-components)
- [API Integration](#api-integration)
- [Authentication Flow](#authentication-flow)

---

## Features

- **Authentication** — register, login, logout with JWT access + refresh token auto-rotation
- **Feed** — personalized post feed from followed users
- **Posts** — create, edit, delete posts with optional image upload; visibility control (public / followers only / private); like/unlike
- **Post Detail** — comments with nested replies, like counter
- **Stories** — horizontal stories bar with 24-hour expiring stories
- **User Profiles** — public profiles with follower/following counts, follow/unfollow
- **Direct Messages** — conversation inbox, send text and image messages
- **Notifications** — real-time-style notification feed with unread badge
- **Admin Panel** — user management, post moderation, platform stats (admin role only)
- **Dark/Light theme** — CSS variable-based theming
- **Responsive layout** — mobile-friendly sidebar navigation

---

## Tech Stack

| | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 6 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Styling | Tailwind CSS 3 + custom CSS variables |
| Date formatting | date-fns |

---

## Project Structure

```
src/
├── components/
│   ├── Avatar.jsx           # User avatar with fallback initials
│   ├── Navbar.jsx           # Top navigation bar
│   ├── PostCard.jsx         # Post preview card for feeds
│   ├── ProtectedRoute.jsx   # Auth guards (ProtectedRoute, PublicOnlyRoute, AdminRoute)
│   ├── Sidebar.jsx          # Mobile bottom nav + desktop sidebar
│   ├── StoriesBar.jsx       # Horizontal stories strip
│   └── ui.jsx               # Shared UI primitives (Spinner, LoadingScreen, PageHeader)
├── context/
│   ├── AuthContext.jsx      # Global auth state (user, login, logout)
│   └── ToastContext.jsx     # Toast notification system
├── pages/
│   ├── HomePage.jsx         # Landing page (logged-out)
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── FeedPage.jsx         # Personalized feed
│   ├── PostsPage.jsx        # Public posts list with search
│   ├── PostFormPage.jsx     # Create / edit post
│   ├── PostDetailPage.jsx   # Single post with comments
│   ├── ProfilePage.jsx      # Own profile page
│   ├── UserProfilePage.jsx  # Other user's public profile
│   ├── UsersPage.jsx        # User search/directory
│   ├── MessagesPage.jsx     # Inbox + conversation view
│   ├── NotificationsPage.jsx
│   ├── DashboardPage.jsx    # Personal stats dashboard
│   ├── AdminPage.jsx        # Admin panel
│   └── NotFoundPage.jsx
├── services/
│   └── api.js               # Axios instance + all API methods
├── utils/
│   └── index.js             # Helpers (timeAgo, getApiError, etc.)
├── App.jsx                  # Root component, router, layout
├── main.jsx                 # React entry point
└── index.css                # Global styles, CSS variables, Tailwind base
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- The [backend](https://github.com/JGRex-Joy/social-media-backend) running locally or deployed

### Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/JGRex-Joy/social-media-frontend.git
cd social-media-frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment** — create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

4. **Start the dev server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full base URL of the backend API | `https://your-backend.onrender.com/api/v1` |

> All Vite environment variables must start with `VITE_` to be accessible in the browser.

---

## Deploying to Vercel

Vercel automatically detects Vite projects — no `Dockerfile` or extra config needed.

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repository
3. Vercel will auto-detect the framework as **Vite**. Build settings will be set automatically:
   - Build command: `vite build`
   - Output directory: `dist`
4. Go to **Settings → Environment Variables** and add:

```
VITE_API_URL = https://your-backend-url.com/api/v1
```

5. Click **Deploy** — done.

> **Important:** Every time you change `VITE_API_URL`, you need to trigger a redeploy for it to take effect, since Vite bakes env variables into the bundle at build time.

---

## Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing / home page |
| `/login` | Guest only | Login form |
| `/register` | Guest only | Registration form |
| `/feed` | Auth required | Personalized post feed |
| `/posts` | Auth required | All public posts with search |
| `/posts/create` | Auth required | Create new post |
| `/posts/:id` | Auth required | Post detail with comments |
| `/posts/:id/edit` | Auth required | Edit own post |
| `/users` | Auth required | User directory with search |
| `/users/:id` | Auth required | Public user profile |
| `/profile` | Auth required | Own profile and settings |
| `/notifications` | Auth required | Notification feed |
| `/messages` | Auth required | Message inbox |
| `/messages/:userId` | Auth required | Conversation with a user |
| `/dashboard` | Auth required | Personal stats |
| `/admin` | Admin only | Admin panel |

---

## Key Components

**`AuthContext`** — provides `user`, `login(tokens)`, `logout()` and `loading` state globally. Reads the access token from `localStorage` and fetches the current user on mount.

**`ProtectedRoute`** — wraps routes that require authentication. Redirects to `/login` if not authenticated. `AdminRoute` additionally checks for the `ADMIN` role.

**`ToastContext`** — global toast system. Call `addToast(message, type)` from anywhere. Supports `success`, `error`, and `warning` types. Toasts auto-dismiss after 3.5 seconds.

**`PostCard`** — reusable card for post feeds. Handles like toggling with optimistic UI updates.

**`StoriesBar`** — fetches and displays active stories from followed users in a horizontal scrollable strip.

---

## API Integration

All API calls go through `src/services/api.js`. It exports:

- `authAPI` — register, login, refresh, me, logout
- `usersAPI` — list, getMe, updateMe, uploadAvatar, getById, follow, unfollow, getFollowers, getFollowing
- `postsAPI` — list, feed, create, getById, update, delete, toggleLike, getComments, createComment, uploadImage
- `storiesAPI` — list, getMyStories, getUserStories, getById, create, delete, getComments, addComment
- `commentsAPI` — update, delete, getReplies
- `notificationsAPI` — list, markRead, markAllRead
- `messagesAPI` — inbox, getConversation, send, sendImage, delete
- `adminAPI` — stats, listUsers, updateUser, deleteUser, listPosts, deletePost, pinPost
- `mediaURL(path)` — converts a relative upload path (e.g. `/uploads/posts/abc.jpg`) to a full URL

The Axios instance automatically attaches the `Authorization: Bearer <token>` header on every request and handles **401 token refresh** — if an access token expires, it silently fetches a new one using the refresh token and retries the original request. If the refresh also fails, the user is redirected to `/login`.

---

## Authentication Flow

```
User logs in
    → receives access_token + refresh_token
    → both stored in localStorage

On every request
    → Axios interceptor injects Authorization header

Access token expires (401 response)
    → interceptor calls POST /auth/refresh
    → stores new tokens
    → retries original request transparently

Refresh token expires
    → clears localStorage
    → redirects to /login
```