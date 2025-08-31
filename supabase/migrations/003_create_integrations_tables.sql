-- Create integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'canvas', 'gradescope', 'prairielearn', etc.
  external_id VARCHAR(255), -- Canvas user ID, etc.
  display_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, provider, external_id)
);

-- Create integration_secrets table for storing encrypted OAuth tokens
CREATE TABLE integration_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  secret_type VARCHAR(50) NOT NULL, -- 'access_token', 'refresh_token', 'api_key', etc.
  encrypted_value TEXT NOT NULL, -- Encrypted token/value
  expires_at TIMESTAMP WITH TIME ZONE, -- When the token expires
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, secret_type)
);

-- Create sync_runs table for tracking sync operations
CREATE TABLE sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  courses_created INTEGER DEFAULT 0,
  courses_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB -- Additional sync metadata
);

-- Create sync_errors table for detailed error tracking
CREATE TABLE sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID NOT NULL REFERENCES sync_runs(id) ON DELETE CASCADE,
  error_type VARCHAR(50) NOT NULL, -- 'auth_error', 'api_error', 'parse_error', etc.
  error_message TEXT NOT NULL,
  external_id VARCHAR(255), -- Canvas assignment ID, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Additional error context
);

-- Add indexes for performance
CREATE INDEX idx_integrations_owner_id ON integrations(owner_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integration_secrets_integration_id ON integration_secrets(integration_id);
CREATE INDEX idx_sync_runs_integration_id ON sync_runs(integration_id);
CREATE INDEX idx_sync_runs_status ON sync_runs(status);
CREATE INDEX idx_sync_errors_sync_run_id ON sync_errors(sync_run_id);

-- Add RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations
CREATE POLICY "Users can view their own integrations" ON integrations
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own integrations" ON integrations
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS policies for integration_secrets
CREATE POLICY "Users can view their own integration secrets" ON integration_secrets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_secrets.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own integration secrets" ON integration_secrets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_secrets.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own integration secrets" ON integration_secrets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_secrets.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own integration secrets" ON integration_secrets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_secrets.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

-- RLS policies for sync_runs
CREATE POLICY "Users can view their own sync runs" ON sync_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = sync_runs.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sync runs" ON sync_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = sync_runs.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sync runs" ON sync_runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = sync_runs.integration_id 
      AND integrations.owner_id = auth.uid()
    )
  );

-- RLS policies for sync_errors
CREATE POLICY "Users can view their own sync errors" ON sync_errors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sync_runs 
      JOIN integrations ON integrations.id = sync_runs.integration_id
      WHERE sync_runs.id = sync_errors.sync_run_id 
      AND integrations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sync errors" ON sync_errors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sync_runs 
      JOIN integrations ON integrations.id = sync_runs.integration_id
      WHERE sync_runs.id = sync_errors.sync_run_id 
      AND integrations.owner_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_secrets_updated_at BEFORE UPDATE ON integration_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
