-- Migration pour ajouter la table sponsor_payments
-- Cette table permet de gérer les paiements de commission aux parrains

CREATE TABLE IF NOT EXISTS sponsor_payments (
    id BIGSERIAL PRIMARY KEY,
    sponsor_id BIGINT NOT NULL,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_phone VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_sponsor_id ON sponsor_payments(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_tombola_id ON sponsor_payments(tombola_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_payment_status ON sponsor_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_payment_date ON sponsor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_receipt_number ON sponsor_payments(receipt_number);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_sponsor_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sponsor_payments_updated_at
    BEFORE UPDATE ON sponsor_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_payments_updated_at();

-- Fonction pour générer un numéro de reçu unique
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    receipt_num VARCHAR(50);
    counter INTEGER := 0;
BEGIN
    LOOP
        receipt_num := 'RCP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || counter;
        
        -- Vérifier si le numéro existe déjà
        IF NOT EXISTS (SELECT 1 FROM sponsor_payments WHERE receipt_number = receipt_num) THEN
            RETURN receipt_num;
        END IF;
        
        counter := counter + 1;
        
        -- Éviter une boucle infinie
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Impossible de générer un numéro de reçu unique';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documenter la table
COMMENT ON TABLE sponsor_payments IS 'Table pour gérer les paiements de commission aux parrains';
COMMENT ON COLUMN sponsor_payments.sponsor_id IS 'ID du parrain (coupon_id)';
COMMENT ON COLUMN sponsor_payments.tombola_id IS 'ID de la tombola concernée';
COMMENT ON COLUMN sponsor_payments.amount IS 'Montant du paiement en FCFA';
COMMENT ON COLUMN sponsor_payments.sponsor_name IS 'Nom du parrain au moment du paiement';
COMMENT ON COLUMN sponsor_payments.sponsor_phone IS 'Téléphone du parrain au moment du paiement';
COMMENT ON COLUMN sponsor_payments.payment_status IS 'Statut du paiement: pending, paid, cancelled';
COMMENT ON COLUMN sponsor_payments.payment_date IS 'Date et heure du paiement';
COMMENT ON COLUMN sponsor_payments.receipt_number IS 'Numéro unique du reçu de paiement';