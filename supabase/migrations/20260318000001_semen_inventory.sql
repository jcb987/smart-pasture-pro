-- Semen inventory table for F10 (Inventario de Semen)
CREATE TABLE IF NOT EXISTS semen_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bull_name TEXT NOT NULL,
  bull_registration TEXT,
  breed TEXT,
  doses_available INTEGER NOT NULL DEFAULT 0,
  doses_total INTEGER NOT NULL DEFAULT 0,
  cost_per_dose NUMERIC,
  expiration_date DATE,
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE semen_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_semen_inventory" ON semen_inventory
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_insert_semen_inventory" ON semen_inventory
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_update_semen_inventory" ON semen_inventory
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "org_delete_semen_inventory" ON semen_inventory
  FOR DELETE USING (organization_id = get_user_organization_id());
