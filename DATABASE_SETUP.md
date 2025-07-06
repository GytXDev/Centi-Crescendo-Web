# Configuration Base de Données Supabase

## 📋 Informations de Connexion

Votre application est configurée pour se connecter à Supabase avec les informations suivantes :

- **Host**: `db.nadoysapfjspcuygnuza.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `zt7ik&eNfDuq+L#`

## 🔧 Configuration

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine de votre projet avec le contenu suivant :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://nadoysapfjspcuygnuza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZG95c2FwZmpzcGN1eWdudXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjQ5NTksImV4cCI6MjA2NzMwMDk1OX0.PFBfAOnRdten_i0BNmFfh67iASr7A0XcUEhpII8QYnE

# Configuration PostgreSQL directe (optionnel)
VITE_POSTGRES_HOST=db.nadoysapfjspcuygnuza.supabase.co
VITE_POSTGRES_PORT=5432
VITE_POSTGRES_DATABASE=postgres
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=zt7ik&eNfDuq+L#
```

### 2. Clé API Supabase

Pour obtenir votre clé API Supabase :

1. Connectez-vous à votre dashboard Supabase
2. Allez dans Settings > API
3. Copiez la "anon public" key
4. Remplacez `votre_clé_anon_supabase_ici` dans le fichier `.env`

## 🧪 Test de Connexion

### Test via Supabase Client (Recommandé)

```javascript
import { testSupabaseConnection } from './src/lib/databaseTest.js';

// Test de la connexion
const result = await testSupabaseConnection();
console.log(result);
```

### Test via Connexion Directe PostgreSQL

Si vous souhaitez une connexion directe PostgreSQL, installez le package `pg` :

```bash
npm install pg
```

Puis décommentez le code dans `src/lib/databaseTest.js`.

## 📁 Fichiers de Configuration

- `src/lib/customSupabaseClient.js` - Client Supabase principal
- `src/lib/databaseTest.js` - Utilitaires de test de connexion
- `env.example` - Exemple de variables d'environnement

## 🔒 Sécurité

⚠️ **Important** : 
- Ne committez jamais le fichier `.env` dans Git
- Ajoutez `.env` à votre `.gitignore`
- Utilisez toujours les variables d'environnement pour les informations sensibles

## 🚀 Utilisation

Votre application utilise déjà le client Supabase configuré. Vous pouvez l'importer dans vos composants :

```javascript
import { supabase } from './lib/customSupabaseClient.js';

// Exemple d'utilisation
const { data, error } = await supabase
  .from('votre_table')
  .select('*');
```

## 🆘 Dépannage

### Erreur de Connexion

1. Vérifiez que votre clé API Supabase est correcte
2. Assurez-vous que l'URL Supabase est correcte
3. Vérifiez que votre base de données est active

### Erreur de Permissions

1. Vérifiez les politiques RLS (Row Level Security) dans Supabase
2. Assurez-vous que votre utilisateur a les bonnes permissions

## 📞 Support

Pour toute question concernant la configuration, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Guide de démarrage Supabase](https://supabase.com/docs/guides/getting-started) 