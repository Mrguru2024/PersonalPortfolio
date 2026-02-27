-- Create all tables for the portfolio database

-- Session table (required by connect-pg-simple; avoids ENOENT table.sql error)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

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
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  project_type TEXT,
  budget TEXT,
  timeframe TEXT,
  newsletter BOOLEAN DEFAULT false,
  pricing_estimate JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address TEXT
);

-- Resume requests table
CREATE TABLE IF NOT EXISTS resume_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  purpose TEXT NOT NULL DEFAULT '',
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

-- Client Quotes table (customer dashboard)
CREATE TABLE IF NOT EXISTS client_quotes (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES project_assessments(id),
  user_id INTEGER REFERENCES users(id),
  quote_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  proposal_data JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Client Invoices table (customer dashboard)
CREATE TABLE IF NOT EXISTS client_invoices (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER REFERENCES client_quotes(id),
  user_id INTEGER REFERENCES users(id),
  invoice_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  recipient_email TEXT,
  host_invoice_url TEXT,
  line_items JSONB,
  last_reminder_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Client Announcements table (customer dashboard)
CREATE TABLE IF NOT EXISTS client_announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  target_user_ids JSONB,
  target_project_ids JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);

-- Client Feedback table (customer dashboard)
CREATE TABLE IF NOT EXISTS client_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  assessment_id INTEGER REFERENCES project_assessments(id),
  quote_id INTEGER REFERENCES client_quotes(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'new',
  admin_response TEXT,
  responded_at TIMESTAMP,
  responded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed BOOLEAN DEFAULT true NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  unsubscribed_at TIMESTAMP,
  source TEXT,
  tags JSONB,
  metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed ON newsletter_subscribers(subscribed);

-- Newsletters (campaigns)
CREATE TABLE IF NOT EXISTS newsletters (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  plain_text TEXT,
  preview_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  recipient_filter JSONB,
  images JSONB
);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);

-- Newsletter send logs
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id SERIAL PRIMARY KEY,
  newsletter_id INTEGER NOT NULL,
  subscriber_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  brevo_message_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber_id ON newsletter_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status ON newsletter_sends(status);

-- CRM: contacts/leads with high-value fields
CREATE TABLE IF NOT EXISTS crm_contacts (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'lead',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  industry TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  estimated_value INTEGER,
  notes TEXT,
  tags JSONB,
  custom_fields JSONB,
  contact_id INTEGER,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);

-- CRM: deals pipeline
CREATE TABLE IF NOT EXISTS crm_deals (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  value INTEGER NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualification',
  expected_close_at TIMESTAMP,
  closed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);

-- CRM: activity/communication log
CREATE TABLE IF NOT EXISTS crm_activities (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  deal_id INTEGER,
  type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities(contact_id);

-- Newsletter: optional explicit recipient list (emails); when set, send to these instead of subscriber filter
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS recipient_emails JSONB;
