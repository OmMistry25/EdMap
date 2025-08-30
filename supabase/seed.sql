-- EdMap Seed Script
-- This script creates realistic demo data for testing the academic graph
-- Run this after creating the core tables and having at least one user

-- ============================================================================
-- DEMO COURSES
-- ============================================================================

-- Note: Replace 'USER_ID_HERE' with your actual user ID from auth.users
-- To get your user ID, run: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Computer Science Course
INSERT INTO courses (owner_id, title, code, term, instructor, color_hex) VALUES
  ('USER_ID_HERE', 'Introduction to Computer Science', 'CS101', 'Fall 2024', 'Dr. Sarah Smith', '#3B82F6')
  ON CONFLICT DO NOTHING;

-- Mathematics Course  
INSERT INTO courses (owner_id, title, code, term, instructor, color_hex) VALUES
  ('USER_ID_HERE', 'Calculus I', 'MATH201', 'Fall 2024', 'Prof. Michael Johnson', '#10B981')
  ON CONFLICT DO NOTHING;

-- Physics Course
INSERT INTO courses (owner_id, title, code, term, instructor, color_hex) VALUES
  ('USER_ID_HERE', 'Physics Lab', 'PHYS101L', 'Fall 2024', 'Dr. Emily Brown', '#F59E0B')
  ON CONFLICT DO NOTHING;

-- English Course
INSERT INTO courses (owner_id, title, code, term, instructor, color_hex) VALUES
  ('USER_ID_HERE', 'Academic Writing', 'ENG101', 'Fall 2024', 'Prof. David Wilson', '#8B5CF6')
  ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO SOURCES
-- ============================================================================

-- Computer Science Sources
INSERT INTO sources (course_id, provider, display_name, external_course_id, status) VALUES
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'canvas', 'Canvas Course', 'canvas_cs101_fall2024', 'active'),
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'gradescope', 'Gradescope Assignments', 'gradescope_cs101_fall2024', 'active')
  ON CONFLICT DO NOTHING;

-- Mathematics Sources
INSERT INTO sources (course_id, provider, display_name, external_course_id, status) VALUES
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'canvas', 'Canvas Course', 'canvas_math201_fall2024', 'active'),
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'prairielearn', 'PrairieLearn Homework', 'prairielearn_math201_fall2024', 'active')
  ON CONFLICT DO NOTHING;

-- Physics Sources
INSERT INTO sources (course_id, provider, display_name, external_course_id, status) VALUES
  ((SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'canvas', 'Canvas Course', 'canvas_phys101l_fall2024', 'active'),
  ((SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'manual', 'Lab Manual', NULL, 'active')
  ON CONFLICT DO NOTHING;

-- English Sources
INSERT INTO sources (course_id, provider, display_name, external_course_id, status) VALUES
  ((SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1), 'canvas', 'Canvas Course', 'canvas_eng101_fall2024', 'active')
  ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO ITEMS
-- ============================================================================

-- Computer Science Items (Canvas)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Assignment 1: Hello World Program', 'assignment', 'upcoming', 
   (CURRENT_DATE + INTERVAL '7 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '7 days')::timestamp with time zone, 
   100, 120, ARRAY['programming', 'python']),
   
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Quiz 1: Programming Basics', 'quiz', 'upcoming', 
   (CURRENT_DATE + INTERVAL '3 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '1 day')::timestamp with time zone, 
   50, 60, ARRAY['quiz', 'basics']),
   
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Midterm Exam', 'exam', 'upcoming', 
   (CURRENT_DATE + INTERVAL '21 days')::timestamp with time zone, 
   (CURRENT_DATE + INTERVAL '20 days')::timestamp with time zone, 
   200, 120, ARRAY['exam', 'midterm'])
  ON CONFLICT DO NOTHING;

-- Computer Science Items (Gradescope)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Gradescope Assignments' AND course_id = (SELECT id FROM courses WHERE title = 'Introduction to Computer Science' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Programming Project: Calculator', 'project', 'upcoming', 
   (CURRENT_DATE + INTERVAL '14 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '3 days')::timestamp with time zone, 
   150, 300, ARRAY['project', 'calculator', 'advanced'])
  ON CONFLICT DO NOTHING;

-- Mathematics Items (Canvas)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Homework 1: Limits and Continuity', 'assignment', 'submitted', 
   (CURRENT_DATE - INTERVAL '2 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '9 days')::timestamp with time zone, 
   100, 90, ARRAY['homework', 'limits']),
   
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Quiz 1: Derivatives', 'quiz', 'upcoming', 
   (CURRENT_DATE + INTERVAL '5 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '2 days')::timestamp with time zone, 
   75, 45, ARRAY['quiz', 'derivatives']),
   
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Final Exam', 'exam', 'upcoming', 
   (CURRENT_DATE + INTERVAL '35 days')::timestamp with time zone, 
   (CURRENT_DATE + INTERVAL '34 days')::timestamp with time zone, 
   300, 180, ARRAY['exam', 'final'])
  ON CONFLICT DO NOTHING;

-- Mathematics Items (PrairieLearn)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'PrairieLearn Homework' AND course_id = (SELECT id FROM courses WHERE title = 'Calculus I' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Practice Problems: Integration', 'assignment', 'upcoming', 
   (CURRENT_DATE + INTERVAL '10 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '5 days')::timestamp with time zone, 
   50, 60, ARRAY['practice', 'integration'])
  ON CONFLICT DO NOTHING;

-- Physics Items (Canvas)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Lab Safety Quiz', 'quiz', 'graded', 
   (CURRENT_DATE - INTERVAL '7 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '14 days')::timestamp with time zone, 
   25, 30, ARRAY['safety', 'quiz'])
  ON CONFLICT DO NOTHING;

-- Physics Items (Manual)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Lab Manual' AND course_id = (SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Lab Report 1: Motion', 'lab', 'upcoming', 
   (CURRENT_DATE + INTERVAL '4 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '3 days')::timestamp with time zone, 
   80, 120, ARRAY['lab', 'motion', 'report']),
   
  ((SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Lab Manual' AND course_id = (SELECT id FROM courses WHERE title = 'Physics Lab' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Lab Report 2: Forces', 'lab', 'upcoming', 
   (CURRENT_DATE + INTERVAL '11 days')::timestamp with time zone, 
   (CURRENT_DATE + INTERVAL '4 days')::timestamp with time zone, 
   80, 120, ARRAY['lab', 'forces', 'report'])
  ON CONFLICT DO NOTHING;

-- English Items (Canvas)
INSERT INTO items (course_id, source_id, title, type, status, due_at, available_at, points_possible, estimated_minutes, labels) VALUES
  ((SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Essay 1: Argumentative Writing', 'assignment', 'upcoming', 
   (CURRENT_DATE + INTERVAL '6 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '7 days')::timestamp with time zone, 
   150, 240, ARRAY['essay', 'argumentative']),
   
  ((SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Reading Response: Academic Articles', 'reading', 'upcoming', 
   (CURRENT_DATE + INTERVAL '2 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '5 days')::timestamp with time zone, 
   30, 45, ARRAY['reading', 'response']),
   
  ((SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1),
   (SELECT id FROM sources WHERE display_name = 'Canvas Course' AND course_id = (SELECT id FROM courses WHERE title = 'Academic Writing' AND owner_id = 'USER_ID_HERE' LIMIT 1) LIMIT 1),
   'Final Research Paper', 'project', 'upcoming', 
   (CURRENT_DATE + INTERVAL '28 days')::timestamp with time zone, 
   (CURRENT_DATE - INTERVAL '7 days')::timestamp with time zone, 
   300, 600, ARRAY['research', 'paper', 'final'])
  ON CONFLICT DO NOTHING;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
TO USE THIS SEED SCRIPT:

1. First, get your user ID:
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';

2. Replace 'USER_ID_HERE' with your actual user ID in all the INSERT statements above

3. Run this script in your Supabase SQL Editor

4. The script will create:
   - 4 courses (CS101, MATH201, PHYS101L, ENG101)
   - 7 sources (Canvas, Gradescope, PrairieLearn, Manual)
   - 15 items with realistic due dates, point values, and labels

5. Test the data by:
   - Going to your EdMap dashboard
   - Using the "Core Tables Test" component
   - Clicking "Fetch Courses" to see all the demo courses
   - Testing the graph visualization (in upcoming tasks)

This creates a realistic academic scenario with:
- Items due at different times (past, present, future)
- Different item types (assignment, quiz, exam, project, lab, reading)
- Different statuses (upcoming, submitted, graded)
- Realistic point values and time estimates
- Proper labels for filtering and categorization
*/
