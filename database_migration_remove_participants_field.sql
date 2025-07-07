-- ===== MIGRATION POUR SUPPRIMER LE CHAMP PARTICIPANTS DE LA TABLE TOMBOLAS =====
-- Ce script supprime le champ participants stocké et les triggers associés
-- car le nombre de participants est maintenant calculé dynamiquement

-- 1. Supprimer le trigger qui met à jour automatiquement le nombre de participants
DROP TRIGGER IF EXISTS update_tombola_participants_count_trigger ON participants;

-- 2. Supprimer la fonction qui met à jour le nombre de participants
DROP FUNCTION IF EXISTS update_tombola_participants_count();

-- 3. Supprimer le champ participants de la table tombolas
ALTER TABLE tombolas DROP COLUMN IF EXISTS participants;

-- 4. Vérifier que la migration s'est bien passée
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tombolas' 
ORDER BY ordinal_position; 