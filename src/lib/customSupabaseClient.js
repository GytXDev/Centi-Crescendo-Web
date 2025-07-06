import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification de la configuration
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Supabase URL ou clé Anon manquante. Vérifie ton fichier .env');
}

// Initialisation du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);