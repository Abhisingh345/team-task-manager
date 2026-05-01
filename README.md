# 🚀 Team Task Manager

A full-stack web application for team collaboration — create projects, assign tasks, and track progress with **role-based access control (Admin/Member)**.

---

## 🎯 Assignment Submission

- **Live URL:** [Insert Railway Frontend URL here]
- **GitHub Repo:** [https://github.com/Abhisingh345/team-task-manager](https://github.com/Abhisingh345/team-task-manager)
- **Demo Video:** [Insert Demo Video Link here]

---

## 📁 Folder Structure

```
team-task-manager/
├── backend/                    # Node.js + Express API
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Project.js          # Project schema
│   │   └── Task.js             # Task schema
│   ├── routes/
│   │   ├── auth.js             # /api/auth (register, login, me)
│   │   ├── projects.js         # /api/projects (CRUD + members)
│   │   ├── tasks.js            # /api/tasks (CRUD + dashboard)
│   │   └── users.js            # /api/users (search, profile)
│   ├── middleware/
│   │   ├── auth.js             # JWT protect middleware
│   │   └── role.js             # Admin/Member role checks
│   ├── .env.example            # Environment variables template
│   ├── railway.toml            # Railway deployment config
│   ├── package.json
│   └── server.js               # Entry point
│
├── frontend/                   # React app
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js  # Global auth state
│   │   ├── utils/
│   │   │   ├── api.js          # Axios instance with interceptors
│   │   │   └── helpers.js      # Utility functions
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ProjectsPage.js
│   │   │   ├── ProjectDetailPage.js
│   │   │   └── TasksPage.js
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Layout.js   # Sidebar + topbar
│   │   │       └── Layout.css
│   │   ├── App.js              # Router setup
│   │   ├── index.js
│   │   └── index.css           # Global styles
│   ├── .env.example
│   ├── railway.toml
│   └── package.json
│
├── package.json                # Root scripts
└── README.md
```

---

## ⚙️ Setup Steps

### Prerequisites
- Node.js v16+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Git

---

### 1. Clone & Install Dependencies

```bash
# Clone the repo
git clone <your-repo-url>
cd team-task-manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend — create `backend/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/team-task-manager

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend — create `frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

### 3. Run Locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

---

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/team-task-manager
git push -u origin main
```

### Step 2 — Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project
2. Select **Deploy from GitHub Repo**
3. Choose your repo → Set **Root Directory** to `backend`
4. Add **Environment Variables**:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = a strong random string
   - `JWT_EXPIRE` = 7d
   - `NODE_ENV` = production
5. Copy the generated backend URL (e.g., `https://your-backend.up.railway.app`)

### Step 3 — Deploy Frontend on Railway
1. In the same Railway project → New Service → GitHub Repo
2. Set **Root Directory** to `frontend`
3. Add **Environment Variables**:
   - `REACT_APP_API_URL` = `https://your-backend.up.railway.app/api`
4. Railway will auto-detect and build your React app

### Step 4 — Update CORS
In `backend/.env` add:
```env
FRONTEND_URL=https://your-frontend.up.railway.app
```
Redeploy the backend.

---

## 🔑 Features

| Feature | Description |
|---|---|
| **Auth** | JWT-based signup/login with bcrypt password hashing |
| **Projects** | Create, view, update, delete projects |
| **Role-Based Access** | Admin can manage members & delete tasks; Members can create/edit |
| **Tasks** | Create tasks with title, description, priority, status, assignee, due date |
| **Kanban Board** | Visual drag-to-update board with 4 columns |
| **Dashboard** | Summary stats: total tasks, overdue, in-progress, my tasks |
| **Members** | Add/remove members by email, assign Admin/Member roles |
| **Overdue Detection** | Tasks past due date highlighted in red |

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt  
**Frontend:** React 18, React Router v6, Axios, React Hot Toast  
**Deployment:** Railway  

---

## 📡 API Endpoints

```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login
GET    /api/auth/me              Get current user

GET    /api/projects             Get all user projects
POST   /api/projects             Create project
GET    /api/projects/:id         Get project details
PUT    /api/projects/:id         Update project (Admin)
DELETE /api/projects/:id         Delete project (Admin)
POST   /api/projects/:id/members Add member (Admin)
DELETE /api/projects/:id/members/:userId Remove member (Admin)
GET    /api/projects/:id/stats   Project task statistics

GET    /api/tasks                Get tasks (with filters)
POST   /api/tasks                Create task
GET    /api/tasks/:id            Get task
PUT    /api/tasks/:id            Update task
DELETE /api/tasks/:id            Delete task
GET    /api/tasks/dashboard/summary Dashboard stats

GET    /api/users/search         Search users by email
PUT    /api/users/profile        Update profile
```
