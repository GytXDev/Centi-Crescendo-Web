-- ===== SCHEMA DE LA BASE DE DONNÉES CENTI CRESCENDO =====

-- Table des tombolas
CREATE TABLE IF NOT EXISTS tombolas (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ticket_price INTEGER NOT NULL DEFAULT 0,
    draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
    jackpot VARCHAR(100) NOT NULL,
    max_winners INTEGER NOT NULL DEFAULT 1,
    prizes JSONB DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants
CREATE TABLE IF NOT EXISTS participants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    airtel_money_number VARCHAR(50) NOT NULL,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (payment_status IN ('confirmed')),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des gagnants
CREATE TABLE IF NOT EXISTS winners (
    id BIGSERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    prize_amount VARCHAR(100) NOT NULL,
    prize_rank INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de configuration de l'application
CREATE TABLE IF NOT EXISTS app_config (
    id BIGSERIAL PRIMARY KEY,
    winner_video_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    airtel_money_number VARCHAR(50),
    admin_password VARCHAR(255) NOT NULL DEFAULT 'admin123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLES POUR LE SYSTÈME DE COUPONS ET PARRAINAGE =====

-- Table des coupons
CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    creator_name VARCHAR(255) NOT NULL,
    creator_phone VARCHAR(50) NOT NULL,
    discount_percentage INTEGER NOT NULL DEFAULT 10 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_uses INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisations de coupons
CREATE TABLE IF NOT EXISTS coupon_uses (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    original_price INTEGER NOT NULL,
    discount_amount INTEGER NOT NULL,
    final_price INTEGER NOT NULL,
    commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paliers de commission
CREATE TABLE IF NOT EXISTS commission_tiers (
    id BIGSERIAL PRIMARY KEY,
    tombola_id BIGINT NOT NULL REFERENCES tombolas(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    min_tickets INTEGER NOT NULL,
    commission_percentage INTEGER NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements de commission
CREATE TABLE IF NOT EXISTS commission_payments (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    tier_id BIGINT NOT NULL REFERENCES commission_tiers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEXES POUR LES PERFORMANCES =====

-- Index pour les tombolas
CREATE INDEX IF NOT EXISTS idx_tombolas_status ON tombolas(status);
CREATE INDEX IF NOT EXISTS idx_tombolas_draw_date ON tombolas(draw_date);
CREATE INDEX IF NOT EXISTS idx_tombolas_created_at ON tombolas(created_at);

-- Index pour les participants
CREATE INDEX IF NOT EXISTS idx_participants_tombola_id ON participants(tombola_id);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_participants_ticket_number ON participants(ticket_number);
CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);

-- Index pour les gagnants
CREATE INDEX IF NOT EXISTS idx_winners_tombola_id ON winners(tombola_id);
CREATE INDEX IF NOT EXISTS idx_winners_participant_id ON winners(participant_id);
CREATE INDEX IF NOT EXISTS idx_winners_created_at ON winners(created_at);

-- Index pour les coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_tombola_id ON coupons(tombola_id);
CREATE INDEX IF NOT EXISTS idx_coupons_creator_phone ON coupons(creator_phone);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at);

-- Index pour les utilisations de coupons
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_participant_id ON coupon_uses(participant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_tombola_id ON coupon_uses(tombola_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_used_at ON coupon_uses(used_at);

-- Index pour les paliers de commission
CREATE INDEX IF NOT EXISTS idx_commission_tiers_tombola_id ON commission_tiers(tombola_id);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_min_tickets ON commission_tiers(min_tickets);

-- Index pour les paiements de commission
CREATE INDEX IF NOT EXISTS idx_commission_payments_coupon_id ON commission_payments(coupon_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_tier_id ON commission_payments(tier_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_payment_status ON commission_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_created_at ON commission_payments(created_at);

-- ===== TRIGGERS POUR MISE À JOUR AUTOMATIQUE =====

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables appropriées
CREATE TRIGGER update_tombolas_updated_at BEFORE UPDATE ON tombolas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour générer un numéro de ticket unique
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    ticket_number VARCHAR(50);
    counter INTEGER := 0;
BEGIN
    LOOP
        ticket_number := 'TK-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || '-' || 
                        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3);
        
        -- Vérifier si le numéro existe déjà
        IF NOT EXISTS (SELECT 1 FROM participants WHERE ticket_number = ticket_number) THEN
            RETURN ticket_number;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Impossible de générer un numéro de ticket unique après 10 tentatives';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Le nombre de participants est maintenant calculé dynamiquement
-- via des requêtes SQL dans l'application, pas stocké dans la base de données

-- ===== FONCTIONS POUR LE SYSTÈME DE COUPONS =====

-- Fonction pour générer un code coupon unique
CREATE OR REPLACE FUNCTION generate_coupon_code(creator_name VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
    coupon_code VARCHAR(20);
    counter INTEGER := 0;
    name_part VARCHAR(10);
BEGIN
    -- Extraire les 6 premiers caractères du nom et les mettre en majuscules
    name_part := UPPER(SUBSTRING(creator_name FROM 1 FOR 6));
    
    LOOP
        -- Générer un code avec le nom + 2 chiffres aléatoires
        coupon_code := name_part || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
        
        -- Vérifier si le code existe déjà
        IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = coupon_code) THEN
            RETURN coupon_code;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Impossible de générer un code coupon unique après 10 tentatives';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la commission d'un coupon
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

-- Fonction pour mettre à jour les statistiques d'un coupon après utilisation
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

-- Trigger pour mettre à jour automatiquement les statistiques des coupons
CREATE TRIGGER update_coupon_stats_trigger
    AFTER INSERT ON coupon_uses
    FOR EACH ROW EXECUTE FUNCTION update_coupon_stats();

-- ===== CONFIGURATION DU STORAGE =====

-- Créer le bucket pour les fichiers de l'application
-- Note: Ceci doit être fait manuellement dans le dashboard Supabase
-- 1. Allez dans Storage dans le dashboard
-- 2. Créez un nouveau bucket nommé "app-files"
-- 3. Configurez les politiques RLS ci-dessous

-- ===== POLITIQUES RLS POUR LE STORAGE =====

-- Politique pour permettre l'upload de fichiers
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'app-files' AND auth.role() = 'authenticated');

-- Politique pour permettre la lecture publique des fichiers
-- CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'app-files');

-- Politique pour permettre la suppression des fichiers par les utilisateurs authentifiés
-- CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE USING (bucket_id = 'app-files' AND auth.role() = 'authenticated');

-- ===== DONNÉES INITIALES =====

-- Insérer une configuration par défaut
INSERT INTO app_config (winner_video_url, contact_email, contact_phone, airtel_money_number, admin_password)
VALUES (
    NULL,
    'contact@centicrescendo.com',
    '+241 02 34 44 98',
    '+241 04 00 12 09',
    'zt7ik&eNfDuq+L#3'
) ON CONFLICT DO NOTHING;

-- Insérer les paliers de commission par défaut (seront appliqués à toutes les nouvelles tombolas)
-- Ces paliers peuvent être modifiés par tombola dans l'interface admin
-- INSERT INTO commission_tiers (tombola_id, tier_name, min_tickets, commission_percentage)
-- VALUES 
--     (1, 'Bronze', 50, 3),
--     (1, 'Argent', 100, 5),
--     (1, 'Or', 200, 10),
--     (1, 'Platine', 500, 15)
-- ON CONFLICT DO NOTHING;

-- ===== POLITIQUES RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les tables
ALTER TABLE tombolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- Politiques pour tombolas (lecture publique, écriture admin)
CREATE POLICY "Tombolas are viewable by everyone" ON tombolas FOR SELECT USING (true);
CREATE POLICY "Tombolas are insertable by authenticated users" ON tombolas FOR INSERT WITH CHECK (true);
CREATE POLICY "Tombolas are updatable by authenticated users" ON tombolas FOR UPDATE USING (true);
CREATE POLICY "Tombolas are deletable by authenticated users" ON tombolas FOR DELETE USING (true);

-- Politiques pour participants (lecture publique, écriture publique)
CREATE POLICY "Participants are viewable by everyone" ON participants FOR SELECT USING (true);
CREATE POLICY "Participants are insertable by everyone" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants are updatable by authenticated users" ON participants FOR UPDATE USING (true);
CREATE POLICY "Participants are deletable by authenticated users" ON participants FOR DELETE USING (true);

-- Politiques pour winners (lecture publique, écriture admin)
CREATE POLICY "Winners are viewable by everyone" ON winners FOR SELECT USING (true);
CREATE POLICY "Winners are insertable by authenticated users" ON winners FOR INSERT WITH CHECK (true);
CREATE POLICY "Winners are updatable by authenticated users" ON winners FOR UPDATE USING (true);
CREATE POLICY "Winners are deletable by authenticated users" ON winners FOR DELETE USING (true);

-- Politiques pour app_config (lecture publique, écriture admin)
CREATE POLICY "App config is viewable by everyone" ON app_config FOR SELECT USING (true);
CREATE POLICY "App config is insertable by authenticated users" ON app_config FOR INSERT WITH CHECK (true);
CREATE POLICY "App config is updatable by authenticated users" ON app_config FOR UPDATE USING (true);
CREATE POLICY "App config is deletable by authenticated users" ON app_config FOR DELETE USING (true);

-- Politiques pour coupons (lecture publique, écriture publique)
CREATE POLICY "Coupons are viewable by everyone" ON coupons FOR SELECT USING (true);
CREATE POLICY "Coupons are insertable by everyone" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupons are updatable by authenticated users" ON coupons FOR UPDATE USING (true);
CREATE POLICY "Coupons are deletable by authenticated users" ON coupons FOR DELETE USING (true);

-- Politiques pour coupon_uses (lecture publique, écriture publique)
CREATE POLICY "Coupon uses are viewable by everyone" ON coupon_uses FOR SELECT USING (true);
CREATE POLICY "Coupon uses are insertable by everyone" ON coupon_uses FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupon uses are updatable by authenticated users" ON coupon_uses FOR UPDATE USING (true);
CREATE POLICY "Coupon uses are deletable by authenticated users" ON coupon_uses FOR DELETE USING (true);

-- Politiques pour commission_tiers (lecture publique, écriture admin)
CREATE POLICY "Commission tiers are viewable by everyone" ON commission_tiers FOR SELECT USING (true);
CREATE POLICY "Commission tiers are insertable by authenticated users" ON commission_tiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Commission tiers are updatable by authenticated users" ON commission_tiers FOR UPDATE USING (true);
CREATE POLICY "Commission tiers are deletable by authenticated users" ON commission_tiers FOR DELETE USING (true);

-- Politiques pour commission_payments (lecture publique, écriture admin)
CREATE POLICY "Commission payments are viewable by everyone" ON commission_payments FOR SELECT USING (true);
CREATE POLICY "Commission payments are insertable by authenticated users" ON commission_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Commission payments are updatable by authenticated users" ON commission_payments FOR UPDATE USING (true);
CREATE POLICY "Commission payments are deletable by authenticated users" ON commission_payments FOR DELETE USING (true);

-- Mettre à jour les anciens statuts
UPDATE participants SET payment_status = 'confirmed' WHERE payment_status IN ('pending', 'failed');

-- Modifier la contrainte CHECK
ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_payment_status_check,
  ALTER COLUMN payment_status SET DEFAULT 'confirmed';

ALTER TABLE participants
  ADD CONSTRAINT participants_payment_status_check CHECK (payment_status IN ('confirmed')); 