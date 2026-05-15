-- ============================================
-- Vertex Database — PostgreSQL Migration Script
-- Run this once to create all tables
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ai_history CASCADE;
DROP TABLE IF EXISTS project_files CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(500) DEFAULT '',
    role            VARCHAR(20) NOT NULL DEFAULT 'member',        -- member | lecturer | admin (system-level)
    status          VARCHAR(20) NOT NULL DEFAULT 'active',        -- active | banned
    title           VARCHAR(100) DEFAULT '',
    bio             TEXT DEFAULT '',
    availability    VARCHAR(20) NOT NULL DEFAULT 'available',     -- available | busy | away
    ai_quota        INT NOT NULL DEFAULT 20,
    ai_used         INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. USER SKILLS
-- ─────────────────────────────────────────────
CREATE TABLE user_skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name      VARCHAR(50) NOT NULL,
    UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);

-- ─────────────────────────────────────────────
-- 3. ORGANIZATIONS
-- ─────────────────────────────────────────────
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE,                           -- url-friendly identifier
    plan            VARCHAR(20) NOT NULL DEFAULT 'free',           -- free | pro | business | enterprise
    max_members     INT NOT NULL DEFAULT 5,
    ai_quota        INT NOT NULL DEFAULT 20,
    storage_limit   BIGINT NOT NULL DEFAULT 1073741824,            -- 1 GB in bytes
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. ORGANIZATION MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member',         -- owner | admin | lecturer | member
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(org_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ─────────────────────────────────────────────
-- 5. WORKSPACES
-- ─────────────────────────────────────────────
CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    owner_id        UUID NOT NULL REFERENCES users(id),
    org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL, -- nullable for personal workspaces
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. WORKSPACE MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE workspace_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- ─────────────────────────────────────────────
-- 5. PROJECTS
-- ─────────────────────────────────────────────
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    deadline        DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);

-- ─────────────────────────────────────────────
-- 6. PROJECT MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'Member',        -- Leader | Member | Guest
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ─────────────────────────────────────────────
-- 7. TASKS
-- ─────────────────────────────────────────────
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'todo',           -- todo | in-progress | ready-for-review | done
    priority        VARCHAR(10) NOT NULL DEFAULT 'medium',         -- low | medium | high
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    position        INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);

-- ─────────────────────────────────────────────
-- 8. SUBTASKS
-- ─────────────────────────────────────────────
CREATE TABLE subtasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    position        INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id);

-- ─────────────────────────────────────────────
-- 9. TASK COMMENTS
-- ─────────────────────────────────────────────
CREATE TABLE task_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- ─────────────────────────────────────────────
-- 10. PROJECT FILES
-- ─────────────────────────────────────────────
CREATE TABLE project_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    file_name       VARCHAR(300) NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    mime_type       VARCHAR(100),
    storage_path    VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_files_project ON project_files(project_id);

-- ─────────────────────────────────────────────
-- 11. AI HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE ai_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt          TEXT NOT NULL,
    plan_summary    TEXT,
    plan_data       JSONB,                                         -- GeneratedPlanStep[] 
    tokens_used     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_history_user ON ai_history(user_id);

-- ─────────────────────────────────────────────
-- 12. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL DEFAULT 'info',           -- info | warning | error | invite
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ─────────────────────────────────────────────
-- 13. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(30) NOT NULL,                           -- ban_user | unban_user | change_quota | change_price | ...
    target_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    detail          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- AUTO UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- SEED DATA (mock data từ FE)
-- ─────────────────────────────────────────────

-- Password: "password123" hashed with BCrypt
-- Trong .NET dùng BCrypt.Net: BCrypt.HashPassword("password123")
-- Hash dưới đây là placeholder, thay bằng hash thật khi chạy

INSERT INTO users (id, name, email, password_hash, avatar_url, role, status, title, ai_quota, ai_used, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'Minh',  'minh@university.edu',  '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u1', 'member',   'active', 'Designer',   100, 67, '2025-11-10'),
('a1000000-0000-0000-0000-000000000002', 'Lan',   'lan@university.edu',   '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u2', 'member',   'active', 'Researcher', 20,  18, '2026-01-05'),
('a1000000-0000-0000-0000-000000000003', 'Hung',  'hung@university.edu',  '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u3', 'member',   'active', 'Designer',   100, 34, '2025-12-20'),
('a1000000-0000-0000-0000-000000000004', 'Trang', 'trang@university.edu', '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u4', 'member',   'banned', 'Researcher', 20,  20, '2026-02-01'),
('a1000000-0000-0000-0000-000000000005', 'Duc',   'duc@gmail.com',        '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u5', 'member',   'active', '',           20,  3,  '2026-02-15'),
('a1000000-0000-0000-0000-000000000006', 'Hanh',  'hanh@outlook.com',     '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u6', 'member',   'active', '',           100, 89, '2025-10-01'),
('a1000000-0000-0000-0000-000000000007', 'Phong', 'phong@university.edu', '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=u7', 'member',   'active', '',           20,  0,  '2026-02-27'),
('a1000000-0000-0000-0000-000000000008', 'Dr. Tran Van Minh', 'minh.tv@university.edu', '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=lecturer1', 'member', 'active', 'Lecturer', 200, 12, '2025-06-01'),
('a1000000-0000-0000-0000-000000000099', 'Admin', 'admin@vertex.io',      '$2a$11$placeholder', 'https://i.pravatar.cc/150?u=admin1', 'admin', 'active', 'System Admin', 9999, 0, '2025-01-01');

-- Organizations
INSERT INTO organizations (id, name, slug, plan, max_members, ai_quota, storage_limit) VALUES
('e1000000-0000-0000-0000-000000000001', 'FPT University',     'fpt-university',   'business',   200, 1000, 53687091200),
('e1000000-0000-0000-0000-000000000002', 'Startup XYZ',        'startup-xyz',      'pro',        20,  200,  10737418240),
('e1000000-0000-0000-0000-000000000003', 'Personal (Duc)',     'personal-duc',     'free',       5,   20,   1073741824);

-- Organization members (role = role within org)
INSERT INTO organization_members (org_id, user_id, role) VALUES
-- FPT University: lecturer + students
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 'lecturer'),
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'member'),
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'member'),
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'member'),
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'member'),
-- Startup XYZ
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'owner'),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'member'),
-- Personal
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'owner');

-- Skills
INSERT INTO user_skills (user_id, skill_name) VALUES
('a1000000-0000-0000-0000-000000000001', 'UI'),
('a1000000-0000-0000-0000-000000000001', 'Motion'),
('a1000000-0000-0000-0000-000000000002', 'Research'),
('a1000000-0000-0000-0000-000000000002', 'Writing'),
('a1000000-0000-0000-0000-000000000003', 'UI'),
('a1000000-0000-0000-0000-000000000003', 'Motion'),
('a1000000-0000-0000-0000-000000000004', 'Research'),
('a1000000-0000-0000-0000-000000000004', 'Writing');

-- Workspace
INSERT INTO workspaces (id, name, owner_id, org_id) VALUES
('b1000000-0000-0000-0000-000000000001', 'Design Studio Workspace', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');

-- Workspace members
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'owner'),
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'member'),
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'member'),
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'member');

-- Projects
INSERT INTO projects (id, workspace_id, name, description, deadline) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Poster Project',    'Design poster for Tech Day 2026 event',        '2026-03-01'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Short Animation',   '30s animated video introducing the club',       '2026-03-15');

-- Project members
INSERT INTO project_members (project_id, user_id, role) VALUES
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Leader'),
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Member'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Member'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Member'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'Leader'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Member');

-- Tasks — Poster Project
INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, start_date, end_date, position) VALUES
('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sketch ideas',         'Create 3 main concept sketches.',                  'done',             'high',   'a1000000-0000-0000-0000-000000000001', '2026-02-20', '2026-02-21', 0),
('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Choose color scheme',   NULL,                                               'done',             'medium', 'a1000000-0000-0000-0000-000000000002', '2026-02-21', '2026-02-22', 1),
('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Design main layout',   'Main layout draft for approval before final export.','ready-for-review', 'high',   'a1000000-0000-0000-0000-000000000001', '2026-02-23', '2026-02-25', 0),
('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Review text content',  NULL,                                               'todo',             'low',    'a1000000-0000-0000-0000-000000000002', '2026-02-26', '2026-02-27', 0),
('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Export for print',     NULL,                                               'todo',             'medium', 'a1000000-0000-0000-0000-000000000001', '2026-02-28', '2026-03-01', 1);

-- Tasks — Short Animation
INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, start_date, end_date, position) VALUES
('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Write script',         'Finalize final narration and scene order for 30-second cut.', 'done',        'high',   'a1000000-0000-0000-0000-000000000003', '2026-02-20', '2026-02-22', 0),
('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'Draw storyboard',      'Storyboard panels for all 6 scenes.',                         'in-progress', 'high',   'a1000000-0000-0000-0000-000000000004', '2026-02-23', '2026-02-26', 0),
('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'Design characters',    'Character poses and color pass for review.',                  'ready-for-review','medium','a1000000-0000-0000-0000-000000000001', '2026-02-25', '2026-03-01', 0),
('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000002', 'Record voice-over',    'Record clean voice-over for all approved script lines.',      'todo',        'low',    'a1000000-0000-0000-0000-000000000002', '2026-03-02', '2026-03-03', 0),
('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000002', 'Film & effects',       'Animate key scenes and apply transition/effects package.',    'todo',        'high',   'a1000000-0000-0000-0000-000000000003', '2026-03-04', '2026-03-10', 1),
('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000002', 'Audio editing',        'Mix voice-over, music bed, and SFX to final loudness target.','todo',        'medium', 'a1000000-0000-0000-0000-000000000004', '2026-03-11', '2026-03-12', 2);

-- AI History
INSERT INTO ai_history (user_id, prompt, plan_summary, tokens_used, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'Plan a 2-week poster project for 4 members',           'Generated 5 tasks across 3 phases: Research (2d), Design (7d), Review (5d)',  1250, '2026-02-27 09:30:00+07'),
('a1000000-0000-0000-0000-000000000002', 'Break down a UI/UX design sprint for mobile app',      'Generated 8 tasks: User research, wireframes, prototyping, usability testing', 1800, '2026-02-27 08:15:00+07'),
('a1000000-0000-0000-0000-000000000003', 'Create schedule for 30s animation project',            'Generated 6 tasks: Scripting, storyboard, animation, voiceover, editing, export', 1100, '2026-02-26 16:45:00+07'),
('a1000000-0000-0000-0000-000000000001', 'Suggest deadlines for capstone project final phase',   'Adjusted 4 deadlines based on team velocity and remaining scope',              850, '2026-02-26 14:20:00+07');

-- Notifications
INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'info',    'Task "Design Main Layout" is due tomorrow',  FALSE, '2026-02-27 10:00:00+07'),
('a1000000-0000-0000-0000-000000000001', 'info',    'Lan completed "Choose Color Palette"',       FALSE, '2026-02-27 07:00:00+07'),
('a1000000-0000-0000-0000-000000000001', 'info',    'New comment on "Sketch Ideas"',              TRUE,  '2026-02-26 10:00:00+07'),
('a1000000-0000-0000-0000-000000000099', 'warning', 'API cost exceeded $100 this month!',         FALSE, '2026-02-27 10:00:00+07'),
('a1000000-0000-0000-0000-000000000099', 'info',    'New user Phong just registered.',             FALSE, '2026-02-27 08:30:00+07'),
('a1000000-0000-0000-0000-000000000099', 'error',   'AI API returned 3 errors in the last hour.', TRUE,  '2026-02-26 22:30:00+07');

-- Audit logs
INSERT INTO audit_logs (admin_id, action, target_user_id, detail, created_at) VALUES
('a1000000-0000-0000-0000-000000000099', 'ban_user',     'a1000000-0000-0000-0000-000000000004', 'Banned user Trang for violating terms',  '2026-02-27 14:30:00+07'),
('a1000000-0000-0000-0000-000000000099', 'change_quota', 'a1000000-0000-0000-0000-000000000001', 'Changed AI quota from 50 to 100',        '2026-02-27 12:15:00+07'),
('a1000000-0000-0000-0000-000000000099', 'change_price', NULL,                                   'Updated Student Pro price from $5 to $7','2026-02-26 18:00:00+07');

-- ─────────────────────────────────────────────
-- DONE! Database ready.
-- ─────────────────────────────────────────────
