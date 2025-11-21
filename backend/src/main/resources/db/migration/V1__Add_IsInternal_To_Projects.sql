-- Migration: Add is_internal column to projects table
-- Description: Adds a boolean column to mark projects as internal (available to all employees)
-- Purpose: Internal projects don't require explicit assignment by managers

ALTER TABLE projects 
ADD COLUMN is_internal BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries filtering internal projects
CREATE INDEX idx_projects_is_internal ON projects(is_internal);

-- OPTIONAL: Mark existing training/administrative projects as internal (if they exist)
-- Uncomment if you have specific projects to mark as internal:
-- UPDATE projects SET is_internal = TRUE WHERE name ILIKE '%training%' OR name ILIKE '%administrative%' OR name ILIKE '%internal%';
