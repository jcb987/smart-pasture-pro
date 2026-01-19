-- =====================================================
-- ÍNDICES DE RENDIMIENTO PARA ESCALABILIDAD
-- Optimiza consultas con +100,000 registros
-- =====================================================

-- ANIMALES - Tabla más consultada
CREATE INDEX IF NOT EXISTS idx_animals_organization_status 
ON public.animals(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_animals_organization_category 
ON public.animals(organization_id, category);

CREATE INDEX IF NOT EXISTS idx_animals_organization_sex 
ON public.animals(organization_id, sex);

CREATE INDEX IF NOT EXISTS idx_animals_tag_id_search 
ON public.animals(organization_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_animals_lot_name 
ON public.animals(organization_id, lot_name) WHERE lot_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_animals_reproductive_status 
ON public.animals(organization_id, reproductive_status) WHERE reproductive_status IS NOT NULL;

-- EVENTOS DE SALUD
CREATE INDEX IF NOT EXISTS idx_health_events_animal_date 
ON public.health_events(animal_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_health_events_organization_date 
ON public.health_events(organization_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_health_events_type 
ON public.health_events(organization_id, event_type);

-- EVENTOS REPRODUCTIVOS
CREATE INDEX IF NOT EXISTS idx_reproductive_events_animal_date 
ON public.reproductive_events(animal_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_reproductive_events_organization_date 
ON public.reproductive_events(organization_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_reproductive_events_type 
ON public.reproductive_events(organization_id, event_type);

-- PRODUCCIÓN DE LECHE
CREATE INDEX IF NOT EXISTS idx_milk_production_animal_date 
ON public.milk_production(animal_id, production_date DESC);

CREATE INDEX IF NOT EXISTS idx_milk_production_organization_date 
ON public.milk_production(organization_id, production_date DESC);

-- REGISTROS DE PESO (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_records') THEN
        CREATE INDEX IF NOT EXISTS idx_weight_records_animal_date 
        ON public.weight_records(animal_id, weight_date DESC);
        
        CREATE INDEX IF NOT EXISTS idx_weight_records_organization_date 
        ON public.weight_records(organization_id, weight_date DESC);
    END IF;
END $$;

-- TRANSACCIONES FINANCIERAS
CREATE INDEX IF NOT EXISTS idx_financial_transactions_organization_date 
ON public.financial_transactions(organization_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_category 
ON public.financial_transactions(organization_id, category);

-- PALPACIONES
CREATE INDEX IF NOT EXISTS idx_palpation_records_animal_date 
ON public.palpation_records(animal_id, palpation_date DESC);

CREATE INDEX IF NOT EXISTS idx_palpation_records_organization 
ON public.palpation_records(organization_id, palpation_date DESC);

-- INVENTARIO DE ALIMENTOS
CREATE INDEX IF NOT EXISTS idx_feed_inventory_organization 
ON public.feed_inventory(organization_id);

CREATE INDEX IF NOT EXISTS idx_feed_consumption_date 
ON public.feed_consumption(organization_id, consumption_date DESC);

-- POTREROS
CREATE INDEX IF NOT EXISTS idx_paddocks_organization 
ON public.paddocks(organization_id);

CREATE INDEX IF NOT EXISTS idx_paddock_rotations_date 
ON public.paddock_rotations(organization_id, entry_date DESC);

-- INSUMOS
CREATE INDEX IF NOT EXISTS idx_supplies_organization_category 
ON public.supplies(organization_id, category);

CREATE INDEX IF NOT EXISTS idx_supply_movements_date 
ON public.supply_movements(organization_id, movement_date DESC);

-- PERFILES Y USUARIOS
CREATE INDEX IF NOT EXISTS idx_profiles_organization 
ON public.profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date 
ON public.activity_logs(user_id, created_at DESC);

-- =====================================================
-- ESTADÍSTICAS PARA EL QUERY PLANNER
-- =====================================================
ANALYZE public.animals;
ANALYZE public.health_events;
ANALYZE public.reproductive_events;
ANALYZE public.milk_production;
ANALYZE public.financial_transactions;
ANALYZE public.palpation_records;