-- =====================================================
-- AI-Powered Project Management Platform
-- Supabase SQL Schema + Row Level Security
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('manager', 'developer')),
  specialization TEXT DEFAULT '',
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TEAMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TEAM MEMBERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, developer_id)
);

-- ─── PROJECTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASKS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  required_role TEXT DEFAULT 'fullstack',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVITATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_dev ON team_members(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_invitations_team ON invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_dev ON invitations(developer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role_type);


-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- ─── Enable RLS on all tables ─────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES POLICIES ───────────────────────────────
-- Users can view all profiles (needed for developer directory)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── TEAMS POLICIES ──────────────────────────────────
-- Managers can see their own teams; developers can see teams they belong to
CREATE POLICY "teams_select"
  ON teams FOR SELECT
  USING (
    manager_id = auth.uid()
    OR id IN (
      SELECT team_id FROM team_members WHERE developer_id = auth.uid()
    )
  );

-- Only managers can create teams
CREATE POLICY "teams_insert_manager"
  ON teams FOR INSERT
  WITH CHECK (manager_id = auth.uid());

-- Only the team manager can update
CREATE POLICY "teams_update_manager"
  ON teams FOR UPDATE
  USING (manager_id = auth.uid());

-- Only the team manager can delete
CREATE POLICY "teams_delete_manager"
  ON teams FOR DELETE
  USING (manager_id = auth.uid());

-- ─── TEAM MEMBERS POLICIES ───────────────────────────
-- Team managers can see members; developers can see their own memberships
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  USING (
    developer_id = auth.uid()
    OR team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- Only team manager can add members
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- Only team manager can remove members
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- ─── PROJECTS POLICIES ───────────────────────────────
-- Managers see own projects; developers see projects of teams they belong to
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (
    manager_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members WHERE developer_id = auth.uid()
    )
  );

-- Only managers can create projects
CREATE POLICY "projects_insert_manager"
  ON projects FOR INSERT
  WITH CHECK (manager_id = auth.uid());

-- Only project manager can update
CREATE POLICY "projects_update_manager"
  ON projects FOR UPDATE
  USING (manager_id = auth.uid());

-- ─── TASKS POLICIES ──────────────────────────────────
-- Developers can only see tasks assigned to them
-- Managers can see tasks in their projects
CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    )
  );

-- Only managers can create tasks (via project creation)
CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    )
  );

-- Developers can update tasks assigned to them (status changes)
-- Managers can update any task in their projects
CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE manager_id = auth.uid()
    )
  );

-- ─── INVITATIONS POLICIES ─────────────────────────────
-- Developers can see their own invitations
-- Managers can see invitations for their teams
CREATE POLICY "invitations_select"
  ON invitations FOR SELECT
  USING (
    developer_id = auth.uid()
    OR team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- Only team manager can create invitations
CREATE POLICY "invitations_insert"
  ON invitations FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE manager_id = auth.uid()
    )
  );

-- Developers can update (accept/reject) their own invitations
  USING (developer_id = auth.uid());

-- =====================================================
-- ADVANCED FEATURES MIGRATION
-- =====================================================

-- ─── ADD GITHUB & ANALYTICS FIELDS ───────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_branch TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_number INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pr_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'needs_fix', 'approved'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─── CODE REVIEWS TABLE ──────────────────────────────
CREATE TABLE IF NOT EXISTS code_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  github_pr_id TEXT,
  review_data JSONB NOT NULL,
  ai_summary JSONB,
  issues_found JSONB DEFAULT '[]'::jsonb,
  resolved_issues JSONB DEFAULT '[]'::jsonb,
  final_status TEXT DEFAULT 'pending' CHECK (final_status IN ('pending', 'needs_fix', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_reviews_task ON code_reviews(task_id);

ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "code_reviews_select"
  ON code_reviews FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE assigned_to = auth.uid()
      OR project_id IN (SELECT id FROM projects WHERE manager_id = auth.uid())
    )
  );