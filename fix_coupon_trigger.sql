-- ===== CORRECTION DU TRIGGER DES COUPONS =====
-- Ce script corrige l'ambiguïté de la colonne total_revenue dans la fonction update_coupon_stats

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS update_coupon_stats_trigger ON coupon_uses;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_coupon_stats();

-- Recréer la fonction corrigée
CREATE OR REPLACE FUNCTION update_coupon_stats()
RETURNS TRIGGER AS $$
DECLARE
    coupon_revenue DECIMAL(10,2);
BEGIN
    -- Récupérer le revenu total actuel du coupon
    SELECT total_revenue INTO coupon_revenue 
    FROM coupons 
    WHERE id = NEW.coupon_id;
    
    -- Mettre à jour les statistiques du coupon
    UPDATE coupons 
    SET 
        total_uses = total_uses + 1,
        total_revenue = COALESCE(coupon_revenue, 0) + NEW.final_price,
        total_commission = calculate_coupon_commission(coupons.id)
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER update_coupon_stats_trigger
    AFTER INSERT ON coupon_uses
    FOR EACH ROW EXECUTE FUNCTION update_coupon_stats();

-- Vérifier que la correction a été appliquée
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_coupon_stats_trigger'; 