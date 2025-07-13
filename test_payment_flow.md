# Test du Système de Paiement des Commissions

## Fonctionnalités à Tester

### 1. Date de Génération Automatique
- **Objectif** : Vérifier que la date dans le reçu PDF correspond à la date de paiement enregistrée en base
- **Test** :
  1. Aller dans AdminPage → Section "Récapitulatif des Commissions"
  2. Cliquer sur "Payer [montant] FCFA" pour un parrain
  3. Vérifier que le reçu PDF téléchargé affiche la date actuelle
  4. Vérifier que cette date correspond à `payment_date` dans la table `sponsor_payments`

### 2. Affichage de l'Icône de Téléchargement
- **Objectif** : Vérifier que le bouton "Payer" est remplacé par "Télécharger Reçu" après paiement
- **Test** :
  1. Effectuer un paiement de commission
  2. Vérifier que le bouton devient "Télécharger Reçu" avec icône PDF
  3. Recharger la page et vérifier que l'état persiste
  4. Cliquer sur "Télécharger Reçu" et vérifier que le PDF se télécharge

### 3. Données de Paiement dans le Reçu
- **Objectif** : Vérifier que le reçu contient les bonnes données de paiement
- **Test** :
  1. Effectuer un paiement
  2. Télécharger le reçu
  3. Vérifier que le reçu contient :
     - Numéro de reçu correct
     - Date de paiement correcte
     - Nom et téléphone du parrain
     - Montant total
     - Détails des commissions

### 4. CouponDashboard - Affichage des Paiements
- **Objectif** : Vérifier que les parrains voient leurs paiements dans leur dashboard
- **Test** :
  1. Se connecter en tant que parrain
  2. Aller dans la section "Mes Coupons"
  3. Vérifier que les commissions payées affichent le bouton "Reçu"
  4. Télécharger le reçu et vérifier les données

### 5. Prévention des Paiements Multiples ⭐ NOUVEAU
- **Objectif** : Vérifier qu'il est impossible de créer plusieurs paiements pour la même commission
- **Test** :
  1. Effectuer un paiement de commission
  2. Essayer de cliquer à nouveau sur "Payer" immédiatement
  3. Vérifier que le bouton est désactivé pendant le traitement
  4. Vérifier qu'un message d'erreur s'affiche si on essaie de payer à nouveau
  5. Recharger la page et vérifier que le bouton reste "Télécharger Reçu"
  6. Vérifier en base qu'il n'y a qu'un seul paiement pour ce parrain/tombola

## Points de Vérification

### Base de Données
```sql
-- Vérifier les paiements enregistrés
SELECT * FROM sponsor_payments ORDER BY payment_date DESC;

-- Vérifier qu'un parrain spécifique a été payé
SELECT * FROM sponsor_payments 
WHERE sponsor_id = [ID_DU_COUPON] 
AND tombola_id = [ID_TOMBOLA];

-- Vérifier qu'il n'y a pas de doublons
SELECT 
    sponsor_id, 
    tombola_id, 
    COUNT(*) as payment_count
FROM sponsor_payments 
WHERE payment_status = 'paid'
GROUP BY sponsor_id, tombola_id 
HAVING COUNT(*) > 1;
```

### Interface Admin
- [ ] Bouton "Payer" visible pour les commissions non payées
- [ ] Bouton "Télécharger Reçu" visible pour les commissions payées
- [ ] Date de paiement correcte dans le reçu
- [ ] Numéro de reçu unique généré
- [ ] Bouton désactivé pendant le traitement
- [ ] Prévention des clics multiples

### Interface Parrain
- [ ] Statut de paiement affiché correctement
- [ ] Bouton "Reçu" disponible pour les paiements effectués
- [ ] Reçu téléchargeable avec données correctes

## Correction des Problèmes

### Si la date est incorrecte
1. Vérifier que `createSponsorPayment` utilise `new Date().toISOString()`
2. Vérifier que `generateReceiptPDF` utilise `receiptData.paymentDate`
3. Vérifier le format de date dans la base de données

### Si l'icône ne s'affiche pas
1. Vérifier que `checkSponsorPaymentStatus` retourne les bonnes données
2. Vérifier que `isPaid={!!paymentStatuses[sponsor.id]}` fonctionne
3. Vérifier que `CommissionPaymentButton` reçoit les bonnes props

### Si le reçu ne se télécharge pas
1. Vérifier que `paymentData` est passé correctement
2. Vérifier que `generateReceiptPDF` reçoit toutes les données nécessaires
3. Vérifier les erreurs dans la console du navigateur

### Si des paiements multiples sont créés ⭐ NOUVEAU
1. Exécuter le script de migration `database_migration_prevent_duplicate_payments.sql`
2. Vérifier que la contrainte unique est bien ajoutée
3. Vérifier que le trigger fonctionne
4. Nettoyer les doublons existants si nécessaire

## Migration Requise

### Exécuter le script de prévention des doublons
```bash
# Exécuter le script de migration
psql -d votre_base_de_donnees -f database_migration_prevent_duplicate_payments.sql
```

### Vérifications post-migration
```sql
-- Vérifier que la contrainte est bien ajoutée
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'sponsor_payments' 
AND constraint_name = 'unique_sponsor_tombola_payment';

-- Vérifier que le trigger existe
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'sponsor_payments' 
AND trigger_name = 'trigger_prevent_duplicate_payments';
``` 