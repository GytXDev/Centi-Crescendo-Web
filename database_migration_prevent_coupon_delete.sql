-- Empêcher la suppression d'un coupon déjà utilisé
CREATE OR REPLACE FUNCTION prevent_coupon_delete_if_used()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.total_uses > 0 THEN
        RAISE EXCEPTION 'Impossible de supprimer un coupon déjà utilisé';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_coupon_delete ON coupons;
CREATE TRIGGER prevent_coupon_delete
BEFORE DELETE ON coupons
FOR EACH ROW EXECUTE FUNCTION prevent_coupon_delete_if_used(); 