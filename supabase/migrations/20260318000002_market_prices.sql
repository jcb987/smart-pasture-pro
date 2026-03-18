-- Market prices table for F9 (Precios de Mercado)
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  price_type TEXT NOT NULL CHECK (price_type IN ('leche', 'ganado_pie', 'novillo', 'ternero')),
  value NUMERIC NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT DEFAULT 'COP',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_market_prices" ON market_prices
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_insert_market_prices" ON market_prices
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_update_market_prices" ON market_prices
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "org_delete_market_prices" ON market_prices
  FOR DELETE USING (organization_id = get_user_organization_id());
