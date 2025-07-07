-- ===== CORRECTION COMPLÈTE DES FONCTIONS DE COUPONS =====
-- Ce script corrige toutes les ambiguïtés de colonnes dans les fonctions de coupons

-- 1. Supprimer tous les triggers existants
DROP TRIGGER IF EXISTS update_coupon_stats_trigger ON coupon_uses;

-- 2. Supprimer toutes les fonctions existantes
DROP FUNCTION IF EXISTS update_coupon_stats();
DROP FUNCTION IF EXISTS calculate_coupon_commission(BIGINT);

-- 3. Recréer la fonction calculate_coupon_commission corrigée
CREATE OR REPLACE FUNCTION calculate_coupon_commission(coupon_id BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_tickets INTEGER;
    commission_percentage INTEGER;
    coupon_total_revenue DECIMAL(10,2);
    commission_amount DECIMAL(10,2) := 0;
BEGIN
    -- Récupérer le nombre total de tickets vendus avec ce coupon
    SELECT total_uses INTO total_tickets FROM coupons WHERE id = coupon_id;
    
    -- Récupérer le revenu total généré par ce coupon
    SELECT total_revenue INTO coupon_total_revenue FROM coupons WHERE id = coupon_id;
    
    -- Déterminer le pourcentage de commission selon les paliers
    SELECT ct.commission_percentage INTO commission_percentage
    FROM commission_tiers ct
    JOIN coupons c ON c.tombola_id = ct.tombola_id
    WHERE c.id = coupon_id 
    AND ct.min_tickets <= total_tickets
    ORDER BY ct.min_tickets DESC
    LIMIT 1;
    
    -- Calculer la commission
    IF commission_percentage IS NOT NULL THEN
        commission_amount := GREATEST((COALESCE(coupon_total_revenue, 0) * commission_percentage) / 100, 0);
    END IF;
    
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer la fonction update_coupon_stats corrigée
CREATE OR REPLACE FUNCTION update_coupon_stats()
RETURNS TRIGGER AS $$
DECLARE
    coupon_revenue DECIMAL(10,2);
    coupon_uses INTEGER;
BEGIN
    -- Récupérer les valeurs actuelles du coupon
    SELECT total_revenue, total_uses INTO coupon_revenue, coupon_uses
    FROM coupons 
    WHERE id = NEW.coupon_id;
    
    -- Mettre à jour les statistiques du coupon
    UPDATE coupons 
    SET 
        total_uses = GREATEST(COALESCE(coupon_uses, 0) + 1, 0),
        total_revenue = GREATEST(COALESCE(coupon_revenue, 0) + NEW.final_price, 0),
        total_commission = GREATEST(calculate_coupon_commission(coupons.id), 0)
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recréer le trigger
CREATE TRIGGER update_coupon_stats_trigger
    AFTER INSERT ON coupon_uses
    FOR EACH ROW EXECUTE FUNCTION update_coupon_stats();

-- 6. Vérifier que tout a été créé correctement
SELECT 
    'Functions' as type,
    proname as name,
    prosrc as source
FROM pg_proc 
WHERE proname IN ('calculate_coupon_commission', 'update_coupon_stats')
ORDER BY proname;

SELECT 
    'Triggers' as type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_coupon_stats_trigger';

-- 7. Test de la fonction calculate_coupon_commission
-- (Cette requête ne s'exécutera que si des coupons existent)
DO $$
DECLARE
    test_coupon_id BIGINT;
    test_commission DECIMAL(10,2);
BEGIN
    -- Trouver un coupon existant pour tester
    SELECT id INTO test_coupon_id FROM coupons LIMIT 1;
    
    IF test_coupon_id IS NOT NULL THEN
        SELECT calculate_coupon_commission(test_coupon_id) INTO test_commission;
        RAISE NOTICE 'Test de calculate_coupon_commission pour coupon %: %', test_coupon_id, test_commission;
    ELSE
        RAISE NOTICE 'Aucun coupon trouvé pour le test';
    END IF;
END $$; 