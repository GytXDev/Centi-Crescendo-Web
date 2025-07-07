# Guide du Système de Coupons et Parrainage - Centi Crescendo

## 🎫 Vue d'ensemble

Le système de coupons et parrainage permet aux utilisateurs de créer des codes de réduction personnalisés et de gagner des commissions sur les ventes générées par leurs parrainages.

## 📋 Fonctionnalités principales

### 1. Création de Coupons
- **Génération automatique** : Les codes sont générés automatiquement basés sur le nom du créateur
- **Format** : `NOM123` (6 premiers caractères du nom + 2 chiffres aléatoires)
- **Réduction** : 10% par défaut sur le prix du ticket
- **Validité** : Uniquement pendant la période active de la tombola

### 2. Utilisation des Coupons
- **Saisie manuelle** : Les utilisateurs peuvent saisir un code coupon lors du paiement
- **Validation en temps réel** : Vérification automatique de la validité
- **Restrictions** :
  - Un utilisateur ne peut pas utiliser son propre coupon
  - Le coupon doit être actif et valide pour la tombola en cours
  - Les participations doivent être ouvertes

### 3. Système de Commissions
- **Paliers de commission** :
  - Bronze (50 tickets) : 3% de commission
  - Argent (100 tickets) : 5% de commission
  - Or (200 tickets) : 10% de commission
  - Platine (500 tickets) : 15% de commission

- **Calcul automatique** : Les commissions sont calculées automatiquement selon les paliers atteints
- **Suivi en temps réel** : Statistiques mises à jour instantanément

## 🚀 Comment utiliser le système

### Pour les créateurs de coupons

1. **Créer un coupon** :
   - Allez sur la page d'accueil
   - Cliquez sur "Créer mon Coupon" dans la section parrainage
   - Remplissez vos informations (nom et numéro de téléphone)
   - Recevez votre code unique

2. **Partager votre coupon** :
   - Copiez le code généré
   - Partagez-le avec vos amis via WhatsApp, SMS, etc.
   - Utilisez le bouton de partage intégré

3. **Suivre vos performances** :
   - Allez sur "Mes Coupons" dans la navigation
   - Entrez votre numéro de téléphone
   - Consultez vos statistiques et commissions

### Pour les utilisateurs de coupons

1. **Participer avec un coupon** :
   - Cliquez sur "Participer maintenant" sur la page d'accueil
   - Remplissez le formulaire de participation
   - Saisissez le code coupon dans le champ dédié
   - La réduction sera appliquée automatiquement

2. **Vérification** :
   - Le système valide le coupon en temps réel
   - Un indicateur visuel confirme la validité
   - Le prix final est recalculé automatiquement

## 📊 Dashboard des Coupons

### Accès
- Navigation : "Mes Coupons"
- URL : `/coupons`

### Fonctionnalités
- **Authentification** : Entrée du numéro de téléphone
- **Statistiques globales** :
  - Total des utilisations
  - Revenus générés
  - Commissions gagnées

- **Liste des coupons** :
  - Code et informations
  - Nombre d'utilisations
  - Revenus et commissions
  - Progression des paliers

- **Actions** :
  - Copier le code
  - Partager le coupon
  - Créer un nouveau coupon

## 🔧 Configuration technique

### Base de données
Le système utilise 4 nouvelles tables :
- `coupons` : Informations des coupons créés
- `coupon_uses` : Historique des utilisations
- `commission_tiers` : Paliers de commission par tombola
- `commission_payments` : Paiements de commission

### Fonctions PostgreSQL
- `generate_coupon_code()` : Génération de codes uniques
- `calculate_coupon_commission()` : Calcul des commissions
- `update_coupon_stats()` : Mise à jour des statistiques

### Triggers automatiques
- Mise à jour des statistiques lors de l'utilisation d'un coupon
- Calcul automatique des commissions selon les paliers

## 🎯 Exemples d'utilisation

### Scénario 1 : Création et partage
1. Julien crée un coupon "JULIEN10"
2. Il partage le code avec ses amis
3. 5 amis utilisent le code et obtiennent 10% de réduction
4. Julien atteint le palier Bronze (3% de commission)

### Scénario 2 : Utilisation d'un coupon
1. Marie veut participer à la tombola
2. Elle saisit le code "JULIEN10" dans le formulaire
3. Le système valide le coupon et applique la réduction
4. Marie paie le prix réduit et reçoit son ticket

### Scénario 3 : Suivi des performances
1. Julien consulte son dashboard
2. Il voit qu'il a 5 utilisations et 15 000 FCFA de revenus
3. Il est au palier Bronze avec 3% de commission
4. Il a gagné 450 FCFA de commission

## ⚠️ Points importants

### Restrictions
- Un utilisateur ne peut pas utiliser son propre coupon
- Les coupons ne sont valides que pour la tombola en cours
- Les participations doivent être ouvertes (avant la date de tirage)

### Sécurité
- Validation en temps réel des coupons
- Vérification des restrictions
- Traçabilité complète des utilisations

### Performance
- Index optimisés sur les tables de coupons
- Calculs automatiques via triggers PostgreSQL
- Mise à jour en temps réel des statistiques

## 🔄 Maintenance

### Paliers de commission
Les paliers peuvent être modifiés par tombola dans l'interface d'administration :
- Nombre minimum de tickets
- Pourcentage de commission
- Nom du palier

### Statistiques
- Les statistiques sont calculées automatiquement
- Pas d'intervention manuelle nécessaire
- Historique complet des utilisations

## 📞 Support

Pour toute question sur le système de coupons :
- Contact : Utilisez la section support en bas de page
- WhatsApp : Rejoignez notre chaîne officielle
- Documentation : Ce guide et les commentaires dans le code 