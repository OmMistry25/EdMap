-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  code TEXT,
  term TEXT,
  instructor TEXT,
  color_hex TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sources table
CREATE TABLE sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('canvas', 'gradescope', 'prairielearn', 'prairietest', 'manual')),
  display_name TEXT NOT NULL,
  external_course_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'quiz', 'exam', 'project', 'lab', 'reading', 'survey', 'discussion')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'submitted', 'graded', 'missed', 'cancelled')),
  due_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  points_possible NUMERIC,
  url TEXT,
  estimated_minutes INTEGER,
  labels TEXT[],
  raw_ref JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_courses_owner_id ON courses(owner_id);
CREATE INDEX idx_sources_course_id ON sources(course_id);
CREATE INDEX idx_items_course_id ON items(course_id);
CREATE INDEX idx_items_source_id ON items(source_id);
CREATE INDEX idx_items_due_at ON items(due_at);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_type ON items(type);

-- Create unique constraint for items to avoid duplicates
CREATE UNIQUE INDEX idx_items_source_url ON items(source_id, url) WHERE url IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for sources
CREATE POLICY "Users can view sources for own courses" ON sources
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert sources for own courses" ON sources
  FOR INSERT WITH CHECK (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update sources for own courses" ON sources
  FOR UPDATE USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete sources for own courses" ON sources
  FOR DELETE USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

-- RLS Policies for items
CREATE POLICY "Users can view items for own courses" ON items
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert items for own courses" ON items
  FOR INSERT WITH CHECK (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update items for own courses" ON items
  FOR UPDATE USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete items for own courses" ON items
  FOR DELETE USING (
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
  );

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
