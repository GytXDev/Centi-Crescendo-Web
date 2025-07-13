# Guide de Migration - Nouvelles Fonctionnalités Administratives

## Vue d'ensemble

Ce guide décrit les nouvelles fonctionnalités ajoutées à l'interface d'administration pour améliorer la gestion des tombolas, des coupons et des commissions.

## Nouvelles Fonctionnalités

### 1. Suppression Automatique des Coupons Non Utilisés

**Fonctionnalité :** Lorsqu'une tombola n'est plus active, tous les coupons n'ayant eu aucune utilisation sont automatiquement supprimés.

**Implémentation :**
- Nouveau bouton "Nettoyer [Nom de la tombola]" dans la section "Gestion des Coupons"
- Fonction `deleteUnusedCouponsForInactiveTombola()` dans les services Supabase
- Vérification que la tombola est inactive avant suppression

**Utilisation :**
1. Aller dans la section "Gestion des Coupons"
2. Cliquer sur le bouton "Nettoyer [Nom de la tombola]" pour les tombolas inactives
3. Confirmation automatique de la suppression

### 2. Suppression Sécurisée des Tombolas

**Fonctionnalité :** Pour supprimer une tombola, l'administrateur doit :
- Renseigner le mot de passe administrateur
- Écrire exactement "oui je souhaite supprimer [nom de la tombola]"

**Implémentation :**
- Modal de confirmation sécurisée avec champs mot de passe et texte de confirmation
- Fonction `deleteTombolaWithConfirmation()` dans les services Supabase
- Vérification du mot de passe et du texte de confirmation

**Utilisation :**
1. Cliquer sur le bouton de suppression d'une tombola
2. Entrer le mot de passe administrateur
3. Écrire exactement le texte de confirmation demandé
4. Confirmer la suppression

### 3. Paiement des Commissions avec Reçu

**Fonctionnalité :** Pour les tombolas terminées, chaque parrain a un bouton "Payer" qui :
- Enregistre le paiement de commission
- Génère automatiquement un reçu PDF
- Marque le paiement comme effectué

**Implémentation :**
- Nouvelle table `sponsor_payments` dans la base de données
- Composant `CommissionPaymentButton` pour gérer les paiements
- Fonction `generateReceiptPDF()` pour créer les reçus
- Boutons de paiement dans le récapitulatif des commissions

**Utilisation :**
1. Aller dans la section "Récapitulatif des Commissions"
2. Pour chaque parrain, cliquer sur le bouton "Payer [montant] FCFA"
3. Le reçu PDF se télécharge automatiquement
4. Le bouton devient "Payé" après traitement

## Modifications de la Base de Données

### Nouvelle Table : sponsor_payments

```sql
CREATE TABLE sponsor_payments (
    id UUID PRIMARY KEY,
    sponsor_id UUID NOT NULL,
    tombola_id UUID NOT NULL REFERENCES tombolas(id),
    amount DECIMAL(10,2) NOT NULL,
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_phone VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Nouvelles Fonctions Supabase

1. `deleteUnusedCouponsForInactiveTombola(tombolaId)`
2. `deleteTombolaWithConfirmation(id, password, confirmationText)`
3. `createSponsorPayment(sponsorId, tombolaId, amount, sponsorName, sponsorPhone)`
4. `getSponsorPaymentsForTombola(tombolaId)`
5. `generatePaymentReceipt(paymentId)`

## Nouveaux Composants

1. **CommissionPaymentButton** : Gère les boutons de paiement des commissions
2. **ConfirmModal** (modifié) : Supporte la suppression sécurisée avec mot de passe

## Nouveaux Utilitaires

1. **generateReceiptPDF()** : Génère des reçus de paiement en PDF

## Migration Requise

### Étape 1 : Exécuter le script SQL

```bash
# Exécuter le script de migration
psql -d votre_base_de_donnees -f database_migration_add_sponsor_payments.sql
```

### Étape 2 : Vérifier les nouvelles fonctionnalités

1. **Test de suppression sécurisée :**
   - Essayer de supprimer une tombola
   - Vérifier que le mot de passe et le texte de confirmation sont requis

2. **Test de nettoyage des coupons :**
   - Créer une tombola inactive avec des coupons non utilisés
   - Utiliser le bouton de nettoyage
   - Vérifier que seuls les coupons non utilisés sont supprimés

3. **Test de paiement des commissions :**
   - Créer une tombola avec des parrains
   - Effectuer le tirage
   - Tester les boutons de paiement
   - Vérifier la génération des reçus PDF

## Sécurité

- **Suppression sécurisée :** Double vérification (mot de passe + texte de confirmation)
- **Paiements tracés :** Chaque paiement est enregistré avec un numéro de reçu unique
- **Audit trail :** Tous les paiements sont horodatés et tracés

## Support

En cas de problème avec les nouvelles fonctionnalités :

1. Vérifier que la migration SQL a été exécutée correctement
2. Contrôler les logs de la console pour les erreurs JavaScript
3. Vérifier les permissions Supabase pour la nouvelle table
4. Tester les fonctionnalités une par une pour isoler les problèmes 