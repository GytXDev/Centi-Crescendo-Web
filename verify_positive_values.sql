-- ===== VÉRIFICATION DES VALEURS POSITIVES =====
-- Ce script vérifie et corrige les valeurs négatives dans les coupons

-- 1. Vérifier les valeurs négatives existantes
SELECT 
    'Valeurs négatives trouvées' as status,
    id,
    code,
    total_uses,
    total_revenue,
    total_commission
FROM coupons 
WHERE total_uses < 0 OR total_revenue < 0 OR total_commission < 0;

-- 2. Corriger les valeurs négatives existantes
UPDATE coupons 
SET 
    total_uses = GREATEST(total_uses, 0),
    total_revenue = GREATEST(total_revenue, 0),
    total_commission = GREATEST(total_commission, 0)
WHERE total_uses < 0 OR total_revenue < 0 OR total_commission < 0;

-- 3. Vérifier que toutes les valeurs sont maintenant positives
SELECT 
    'Vérification après correction' as status,
    COUNT(*) as total_coupons,
    COUNT(CASE WHEN total_uses < 0 THEN 1 END) as negative_uses,
    COUNT(CASE WHEN total_revenue < 0 THEN 1 END) as negative_revenue,
    COUNT(CASE WHEN total_commission < 0 THEN 1 END) as negative_commission
FROM coupons;

-- 4. Afficher un résumé des statistiques
SELECT 
    'Résumé des statistiques' as status,
    SUM(total_uses) as total_uses_all_coupons,
    SUM(total_revenue) as total_revenue_all_coupons,
    SUM(total_commission) as total_commission_all_coupons,
    AVG(total_uses) as avg_uses_per_coupon,
    AVG(total_revenue) as avg_revenue_per_coupon,
    AVG(total_commission) as avg_commission_per_coupon
FROM coupons;

-- 5. Vérifier la cohérence des données
SELECT 
    'Cohérence des données' as status,
    c.id,
    c.code,
    c.total_uses as stored_uses,
    COUNT(cu.id) as actual_uses,
    c.total_revenue as stored_revenue,
    COALESCE(SUM(cu.final_price), 0) as actual_revenue,
    CASE 
        WHEN c.total_uses = COUNT(cu.id) AND c.total_revenue = COALESCE(SUM(cu.final_price), 0) THEN 'OK'
        ELSE 'INCONSISTENT'
    END as consistency_status
FROM coupons c
LEFT JOIN coupon_uses cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.total_uses, c.total_revenue
HAVING c.total_uses != COUNT(cu.id) OR c.total_revenue != COALESCE(SUM(cu.final_price), 0)
ORDER BY c.id; 