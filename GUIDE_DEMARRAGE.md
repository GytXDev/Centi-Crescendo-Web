# 🚀 Guide de Démarrage Rapide - Centi Crescendo

## ✅ Configuration Terminée

Votre application Centi Crescendo est maintenant entièrement connectée à Supabase ! Toutes les données sont dynamiques et synchronisées avec votre base de données PostgreSQL.

## 📋 Étapes de Configuration

### 1. **Créer la Base de Données et le Storage**

Exécutez le script SQL dans votre dashboard Supabase :

1. Connectez-vous à votre [dashboard Supabase](https://supabase.com/dashboard)
2. Allez dans votre projet `nadoysapfjspcuygnuza`
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Copiez et collez le contenu du fichier `database_schema.sql`
5. Cliquez sur "Run" pour créer toutes les tables

**Configurer le Storage :**
1. Dans le dashboard Supabase, allez dans "Storage"
2. Créez un nouveau bucket nommé `app-files`
3. Configurez les politiques RLS pour permettre l'upload et la lecture publique

### 2. **Configurer les Variables d'Environnement**

Créez un fichier `.env` à la racine de votre projet :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://nadoysapfjspcuygnuza.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase_ici

# Configuration PostgreSQL directe (optionnel)
VITE_POSTGRES_HOST=db.nadoysapfjspcuygnuza.supabase.co
VITE_POSTGRES_PORT=5432
VITE_POSTGRES_DATABASE=postgres
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=zt7ik&eNfDuq+L#
```

### 3. **Obtenir la Clé API Supabase**

1. Dans votre dashboard Supabase, allez dans **Settings > API**
2. Copiez la **"anon public" key**
3. Remplacez `votre_clé_anon_supabase_ici` dans le fichier `.env`

## 🎯 Fonctionnalités Disponibles

### **Page d'Accueil** (`/`)
- ✅ Affichage dynamique de la tombola active
- ✅ Compteur de participants en temps réel
- ✅ Liste des gagnants récents
- ✅ Vidéo des gagnants configurable (upload direct + YouTube supporté)
- ✅ Modal de participation avec paiement Airtel Money

### **Page d'Administration** (`/admin`)
- ✅ Authentification sécurisée par mot de passe
- ✅ Création de nouvelles tombolas
- ✅ Modification des tombolas existantes
- ✅ Suppression de tombolas
- ✅ Statistiques en temps réel
- ✅ Upload direct de vidéos des gagnants (drag & drop)
- ✅ Gestion des participants
- ✅ Accès caché de la navigation publique

### **Page d'Historique** (`/historique`)
- ✅ Historique des tombolas passées
- ✅ Liste complète des gagnants
- ✅ Filtrage par statut

## 🔧 Services Supabase Implémentés

### **Gestion des Tombolas**
- `getAllTombolas()` - Récupère toutes les tombolas
- `getCurrentTombola()` - Récupère la tombola active
- `createTombola()` - Crée une nouvelle tombola
- `updateTombola()` - Met à jour une tombola
- `deleteTombola()` - Supprime une tombola

### **Gestion des Participants**
- `getAllParticipants()` - Récupère tous les participants
- `getParticipantsByTombola()` - Récupère les participants d'une tombola
- `createParticipant()` - Crée un nouveau participant
- `updateParticipantPayment()` - Met à jour le statut de paiement

### **Gestion des Gagnants**
- `getAllWinners()` - Récupère tous les gagnants
- `createWinner()` - Crée un nouveau gagnant

### **Statistiques et Configuration**
- `getGlobalStats()` - Récupère les statistiques globales
- `getAppConfig()` - Récupère la configuration de l'app
- `updateAppConfig()` - Met à jour la configuration

## 🚀 Démarrage de l'Application

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 📊 Structure de la Base de Données

### **Table `tombolas`**
- `id` - Identifiant unique
- `title` - Titre de la tombola
- `description` - Description
- `ticket_price` - Prix du ticket
- `draw_date` - Date du tirage
- `jackpot` - Montant du jackpot
- `max_winners` - Nombre maximum de gagnants
- `prizes` - Liste des prix (JSON)
- `status` - Statut (active/completed/cancelled)
- `participants` - Nombre de participants
- `winner_video_url` - URL de la vidéo des gagnants (uploadée)

### **Table `participants`**
- `id`