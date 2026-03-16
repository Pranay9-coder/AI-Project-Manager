# AI-Powered Project Management Platform

A modern, scalable project management platform featuring **AI-generated tasks**, **smart workload distribution**, and **real-time role-based team management**. Built for managers to effortlessly bootstrap projects and developers to efficiently execute them.

## 🚀 Features

### 👔 For Managers
- **AI Task Generation**: Simply describe your project, and Gemini 2.0 Flash instantly breaks it down into structured tasks (priorities, required roles)
- **Smart Assignment Engine**: Automatically delegates AI-generated tasks to team members based on their specialization, skills array, and current overall workload
- **Team Organization**: Create custom teams and browse a global developer directory
- **Invitation System**: Send invites to qualified devs right from the dashboard
- **Real-Time Overview**: Live statistics un-siloing teams, tasks, and project completions

### 💻 For Developers
- **Personalized Dashboard**: See active assigned tasks, pending invitations, and progress at a glance
- **Role Control**: Define your custom specialization and exact tech stack skills
- **Interactive Workbench**: Accept/reject manager invitations and update task status inline
- **Real-Time Notifier**: Get pinged securely via WebSocket instantly when assigned new tasks or invites

---

## 🛠️ Tech Stack 

### Frontend
- **React 19** + **Vite 6**
- **TypeScript**
- **TailwindCSS 4** (Modern UI scaling)
- **React Router v7**

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **WebSocket** (`ws`) for live event emitting

### Infrastructure & External Services
- **Supabase** (PostgreSQL Database + JWT Authentication + Row Level Security)
- **Gemini 2.0 Flash API** (Generative AI Engine)

---

## 🏁 Setup & Installation

### 1. Supabase Initialization
1. Create a [Supabase](https://supabase.com/) project.
2. Go to the SQL Editor and run the raw SQL file located at `server/supabase-schema.sql`. This sets up 6 tables and 12 Row Level Security (RLS) policies.
3. Keep your **Project URL**, **Anon Key**, **Service Role Key**, and **JWT Secret** handy.

### 2. Backend Server Setup
Navigate to the `server/` directory and create your `.env` file from the example:
```bash
cd server
cp .env.example .env
```
Fill out the variables:
```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
CLIENT_URL=http://localhost:5173
```
Install dependencies & Run:
```bash
npm install
npm run dev
```

### 3. Frontend Client Setup
Navigate to the `client/` directory and configure the environment:
```bash
cd client
cp .env.example .env
```
(No major secrets needed on the frontend as the backend handles auth logic securely).

Install dependencies & Run:
```bash
npm install
npm run dev
```

### 4. Experience It!
1. Sign up on `localhost:5173` as a **Manager** and create a team.
2. In an incognito window, sign up as a **Developer** (ex: specialize in "Frontend", add "React").
3. As the Manager, invite the developer to your team in the Directory.
4. As the Developer, accept the invite!
5. As the Manager, click "New Project", describe what you want built, and watch the AI intelligently generate and auto-assign tasks directly to that Developer in real time!

---

## 🔐 Security 

This platform uses robust security paradigms preventing unauthorized manipulation:
- **Middleware**: Backend Express routes heavily utilize `verifyToken` and `requireRole` middleware.
- **Row Level Security (RLS)**: Not just protected in code, the database uses PostgreSQL RLS so developers physically cannot run `INSERT` on projects even if they hijack an API call.
- **Localized JWT Parsing**: Backend strictly parses signatures localized per-request to prevent singleton poisoning across concurrent users.

## 🤝 License
MIT
