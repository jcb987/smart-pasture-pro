ALTER TABLE public.milk_production 
ADD CONSTRAINT milk_production_animal_date_unique UNIQUE (animal_id, production_date);