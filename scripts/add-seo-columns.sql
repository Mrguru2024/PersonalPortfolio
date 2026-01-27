-- Add SEO columns to blog_posts table if they don't exist
DO $$ 
BEGIN
  -- Meta tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='meta_title') THEN
    ALTER TABLE blog_posts ADD COLUMN meta_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='meta_description') THEN
    ALTER TABLE blog_posts ADD COLUMN meta_description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='keywords') THEN
    ALTER TABLE blog_posts ADD COLUMN keywords JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='canonical_url') THEN
    ALTER TABLE blog_posts ADD COLUMN canonical_url TEXT;
  END IF;
  
  -- Backlinking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='internal_links') THEN
    ALTER TABLE blog_posts ADD COLUMN internal_links JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='external_links') THEN
    ALTER TABLE blog_posts ADD COLUMN external_links JSONB;
  END IF;
  
  -- Social sharing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='og_title') THEN
    ALTER TABLE blog_posts ADD COLUMN og_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='og_description') THEN
    ALTER TABLE blog_posts ADD COLUMN og_description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='og_image') THEN
    ALTER TABLE blog_posts ADD COLUMN og_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='twitter_card') THEN
    ALTER TABLE blog_posts ADD COLUMN twitter_card TEXT DEFAULT 'summary_large_image';
  END IF;
  
  -- Authority building
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='related_posts') THEN
    ALTER TABLE blog_posts ADD COLUMN related_posts JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blog_posts' AND column_name='reading_time') THEN
    ALTER TABLE blog_posts ADD COLUMN reading_time INTEGER;
  END IF;
END $$;
