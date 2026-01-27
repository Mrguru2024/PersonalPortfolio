-- Create all tables for the portfolio database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' NOT NULL,
  full_name TEXT,
  github_id TEXT,
  github_username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  tags JSONB NOT NULL,
  category TEXT NOT NULL,
  github_url TEXT,
  live_url TEXT,
  details TEXT,
  demo_type TEXT,
  demo_url TEXT,
  demo_config JSONB,
  repo_owner TEXT,
  repo_name TEXT,
  tech_stack JSONB
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  endorsement_count INTEGER DEFAULT 0 NOT NULL
);

-- Skill endorsements table
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  comment TEXT,
  rating INTEGER DEFAULT 5 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address TEXT
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address TEXT
);

-- Resume requests table
CREATE TABLE IF NOT EXISTS resume_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  position TEXT,
  message TEXT,
  access_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  accessed BOOLEAN DEFAULT false NOT NULL,
  accessed_at TIMESTAMP,
  ip_address TEXT
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  tags JSONB NOT NULL,
  published_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  author_id INTEGER REFERENCES users(id),
  is_published BOOLEAN DEFAULT false NOT NULL,
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  keywords JSONB,
  canonical_url TEXT,
  -- Backlinking fields
  internal_links JSONB,
  external_links JSONB,
  -- Social sharing
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  -- Authority building
  related_posts JSONB,
  reading_time INTEGER
);

-- Blog post contributions table
CREATE TABLE IF NOT EXISTS blog_post_contributions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  tags JSONB NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  is_reviewed BOOLEAN DEFAULT false NOT NULL,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_spam BOOLEAN DEFAULT false NOT NULL,
  review_notes TEXT
);

-- Blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  ip_address TEXT DEFAULT '0.0.0.0',
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_spam BOOLEAN DEFAULT false NOT NULL,
  captcha_token TEXT
);

-- Project Assessments table
CREATE TABLE IF NOT EXISTS project_assessments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  assessment_data JSONB NOT NULL,
  pricing_breakdown JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
