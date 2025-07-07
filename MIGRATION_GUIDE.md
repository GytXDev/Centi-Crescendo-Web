# Guide de Migration - Calcul Dynamique des Participants

## Vue d'ensemble

Ce guide décrit les modifications apportées au système pour remplacer le champ `participants` stocké dans la table `tombolas` par un calcul dynamique basé sur les participants confirmés.

## Changements apportés

### 1. Base de données

#### Suppression du champ `participants`
- Le champ `participants INTEGER NOT NULL DEFAULT 0` a été supprimé de la table `tombolas`
- Les triggers et fonctions associés ont été supprimés

#### Calcul dynamique
- Le nombre de participants est maintenant calculé via des requêtes SQL
- Seuls les participants avec `payment_status = 'confirmed'` sont comptés
- Les calculs sont effectués en temps réel

### 2. Services (supabaseServices.js)

#### Fonctions modifiées
- `getAllTombolas()` - Calcule maintenant le nombre de participants pour chaque tombola
- `getCurrentTombola()` - Calcule dynamiquement le nombre de participants
- `getGlobalStats()` - Calcule les revenus basés sur les participants confirmés

#### Nouvelles fonctions
- `getTombolaParticipantsCount(tombolaId)` - Calcule le nombre de participants d'une tombola
- `updateTombolaParticipants(tombolaId)` - Fonction legacy dépréciée

### 3. Composants

#### ParticipationModal.jsx
- Suppression de l'appel à `updateTombolaParticipants()`
- Le nombre de participants est maintenant mis à jour automatiquement

#### Autres composants
- Tous les composants utilisent maintenant le champ `participants` calculé dynamiquement
- Aucun changement visible pour l'utilisateur final

## Migration de la base de données

### Étape 1: Exécuter le script de migration

```sql
-- Exécuter le fichier database_migration_remove_participants_field.sql
```

### Étape 2: Vérifier la migration

```sql
-- Vérifier que le champ participants a été supprimé
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tombolas' 
ORDER BY ordinal_position;
```

## Avantages du nouveau système

### 1. Cohérence des données
- Le nombre de participants est toujours à jour
- Pas de risque de désynchronisation entre les tables

### 2. Performance
- Élimination des triggers qui ralentissaient les insertions
- Calculs optimisés avec des requêtes SQL efficaces

### 3. Maintenance
- Moins de code à maintenir
- Pas de risque d'oubli de mise à jour du champ

## Impact sur les performances

### Avantages
- Suppression des triggers qui ralentissaient les insertions de participants
- Requêtes optimisées avec des index appropriés

### Considérations
- Les requêtes de liste de tombolas sont légèrement plus lentes
- Impact négligeable grâce aux index sur `participants.tombola_id` et `participants.payment_status`

## Tests recommandés

### 1. Test de création de participant
- Vérifier que le nombre de participants s'affiche correctement après création
- Tester avec différents statuts de paiement

### 2. Test de liste des tombolas
- Vérifier que le nombre de participants s'affiche correctement
- Tester avec des tombolas vides et pleines

### 3. Test des statistiques
- Vérifier que les statistiques globales sont correctes
- Tester le calcul des revenus

## Rollback (si nécessaire)

Si un rollback est nécessaire, exécuter :

```sql
-- Recréer le champ participants
ALTER TABLE tombolas ADD COLUMN participants INTEGER NOT NULL DEFAULT 0;

-- Recréer la fonction et le trigger
-- (voir le fichier database_schema.sql original)
```

## Support

Pour toute question ou problème lié à cette migration, consultez :
- Le fichier `supabaseServices.js` pour les détails d'implémentation
- Les logs de la console pour les erreurs éventuelles
- Le guide de démarrage pour l'utilisation des nouvelles fonctions 