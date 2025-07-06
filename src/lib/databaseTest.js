import { supabase } from './customSupabaseClient.js';

/**
 * Test de connexion à la base de données Supabase
 */
export async function testSupabaseConnection() {
    try {
        console.log('🔍 Test de connexion à Supabase...');

        // Test simple de connexion en récupérant la version de la base de données
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);

        if (error) {
            console.error('❌ Erreur de connexion Supabase:', error);
            return { success: false, error };
        }

        console.log('✅ Connexion Supabase réussie!');
        console.log('📊 Données récupérées:', data);

        return { success: true, data };
    } catch (error) {
        console.error('❌ Erreur lors du test de connexion:', error);
        return { success: false, error };
    }
}

/**
 * Test de connexion directe PostgreSQL (nécessite pg package)
 */
export async function testPostgresConnection() {
    try {
        console.log('🔍 Test de connexion PostgreSQL directe...');

        // Note: Pour une connexion directe PostgreSQL, vous devrez installer le package 'pg'
        // npm install pg

        // Exemple de code pour connexion directe (décommentez si vous installez pg)
        /*
        import pkg from 'pg';
        const { Client } = pkg;
        
        const client = new Client({
          host: 'db.nadoysapfjspcuygnuza.supabase.co',
          port: 5432,
          database: 'postgres',
          user: 'postgres',
          password: 'zt7ik&eNfDuq+L#'
        });
        
        await client.connect();
        const result = await client.query('SELECT version()');
        await client.end();
        
        console.log('✅ Connexion PostgreSQL directe réussie!');
        console.log('📊 Version PostgreSQL:', result.rows[0]);
        
        return { success: true, data: result.rows[0] };
        */

        console.log('ℹ️ Connexion PostgreSQL directe non configurée. Utilisez Supabase client.');
        return { success: false, message: 'PostgreSQL direct non configuré' };
    } catch (error) {
        console.error('❌ Erreur lors du test PostgreSQL:', error);
        return { success: false, error };
    }
}

/**
 * Fonction pour tester toutes les connexions
 */
export async function testAllConnections() {
    console.log('🚀 Démarrage des tests de connexion...\n');

    const supabaseResult = await testSupabaseConnection();
    console.log('\n' + '='.repeat(50) + '\n');

    const postgresResult = await testPostgresConnection();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📋 Résumé des tests:');
    console.log(`Supabase: ${supabaseResult.success ? '✅' : '❌'}`);
    console.log(`PostgreSQL direct: ${postgresResult.success ? '✅' : '❌'}`);

    return { supabase: supabaseResult, postgres: postgresResult };
} 