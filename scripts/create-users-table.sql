-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create UserRole enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE UserRole AS ENUM ('TENANT', 'LANDLORD', 'AGENT', 'CONTRACTOR', 'PROPERTY_MANAGER', 'ADMIN');
    END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role UserRole NOT NULL DEFAULT 'TENANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create a trigger to update the "updatedAt" column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON "User";
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for the "User" table (example - adjust as needed for your app's logic)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
FOR SELECT USING (auth.uid() = id);

-- Policy for admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON "User";
CREATE POLICY "Admins can view all profiles" ON "User"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Policy for users to insert their own profile (during signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON "User";
CREATE POLICY "Users can insert their own profile" ON "User"
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
CREATE POLICY "Users can update their own profile" ON "User"
FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON "User";
CREATE POLICY "Admins can update any profile" ON "User"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
