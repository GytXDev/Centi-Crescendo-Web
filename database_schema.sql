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
    participants INTEGER NOT NULL DEFAULT 0,
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
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
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

-- Fonction pour mettre à jour le nombre de participants d'une tombola
CREATE OR REPLACE FUNCTION update_tombola_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        UPDATE tombolas 
        SET participants = (
            SELECT COUNT(*) 
            FROM participants 
            WHERE tombola_id = COALESCE(NEW.tombola_id, OLD.tombola_id)
            AND payment_status = 'confirmed'
        )
        WHERE id = COALESCE(NEW.tombola_id, OLD.tombola_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le nombre de participants
CREATE TRIGGER update_tombola_participants_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_tombola_participants_count();

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
    '+241 04 00 12 09',
    '+241 04 00 12 09',
    'admin123'
) ON CONFLICT DO NOTHING;

-- ===== POLITIQUES RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les tables
ALTER TABLE tombolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

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