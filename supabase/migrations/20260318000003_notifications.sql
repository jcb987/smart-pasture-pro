-- Notifications table for F7 (Centro de Notificaciones)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT,
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_notifications" ON notifications
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_update_notifications" ON notifications
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "org_delete_notifications" ON notifications
  FOR DELETE USING (organization_id = get_user_organization_id());

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_org_unread ON notifications(organization_id, is_read, created_at DESC);
