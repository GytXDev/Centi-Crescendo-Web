-- Migration pour empêcher les paiements multiples
-- Ajouter une contrainte unique sur sponsor_id + tombola_id

-- Vérifier s'il y a des doublons existants
SELECT 
    sponsor_id, 
    tombola_id, 
    COUNT(*) as duplicate_count
FROM sponsor_payments 
WHERE payment_status = 'paid'
GROUP BY sponsor_id, tombola_id 
HAVING COUNT(*) > 1;

-- Si des doublons existent, garder seulement le plus récent
DELETE FROM sponsor_payments 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY sponsor_id, tombola_id 
                   ORDER BY payment_date DESC
               ) as rn
        FROM sponsor_payments 
        WHERE payment_status = 'paid'
    ) t 
    WHERE t.rn > 1
);

-- Ajouter la contrainte unique
ALTER TABLE sponsor_payments 
ADD CONSTRAINT unique_sponsor_tombola_payment 
UNIQUE (sponsor_id, tombola_id, payment_status);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_sponsor_tombola 
ON sponsor_payments (sponsor_id, tombola_id, payment_status);

-- Ajouter un trigger pour empêcher les insertions multiples
CREATE OR REPLACE FUNCTION prevent_duplicate_payments()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier s'il existe déjà un paiement pour ce parrain et cette tombola
    IF EXISTS (
        SELECT 1 FROM sponsor_payments 
        WHERE sponsor_id = NEW.sponsor_id 
        AND tombola_id = NEW.tombola_id 
        AND payment_status = 'paid'
    ) THEN
        RAISE EXCEPTION 'Un paiement existe déjà pour ce parrain et cette tombola';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_payments ON sponsor_payments;
CREATE TRIGGER trigger_prevent_duplicate_payments
    BEFORE INSERT ON sponsor_payments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_payments();

-- Vérifier que la contrainte fonctionne
SELECT 
    'Contrainte unique ajoutée avec succès' as status,
    COUNT(*) as total_payments,
    COUNT(DISTINCT (sponsor_id, tombola_id)) as unique_sponsor_tombola_combinations
FROM sponsor_payments 
WHERE payment_status = 'paid'; 