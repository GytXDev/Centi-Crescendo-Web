# Test de la Correction du Trigger des Coupons

## Problème résolu

### Erreur originale
```
column reference "total_revenue" is ambiguous
```

### Cause
Dans la fonction `update_coupon_stats()`, la référence à `total_revenue` était ambiguë car elle pouvait se référer à :
- La colonne de la table `coupons`
- Une variable PL/pgSQL

### Solution
- Ajout d'une variable locale `coupon_revenue` pour stocker la valeur actuelle
- Utilisation de `COALESCE` pour gérer les valeurs NULL
- Clarification des références de colonnes

## Étapes de correction

### 1. Exécuter le script de correction
```sql
-- Exécuter le fichier fix_coupon_trigger.sql
```

### 2. Vérifier que la correction a été appliquée
```sql
-- Vérifier que le trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_coupon_stats_trigger';
```

## Tests à effectuer

### Test 1 : Création d'un coupon
1. Créer un nouveau coupon via l'interface admin
2. Vérifier qu'il est créé avec les valeurs par défaut :
   - `total_uses = 0`
   - `total_revenue = 0`
   - `total_commission = 0`

### Test 2 : Utilisation d'un coupon
1. Effectuer un paiement avec un coupon valide
2. Vérifier que :
   - L'entrée est créée dans `coupon_uses`
   - Les statistiques du coupon sont mises à jour :
     - `total_uses` augmente de 1
     - `total_revenue` augmente du montant final
     - `total_commission` est recalculé

### Test 3 : Utilisations multiples
1. Effectuer plusieurs paiements avec le même coupon
2. Vérifier que les statistiques s'accumulent correctement

## Requêtes de vérification

### Vérifier les statistiques d'un coupon
```sql
SELECT 
    c.id,
    c.code,
    c.creator_name,
    c.total_uses,
    c.total_revenue,
    c.total_commission,
    COUNT(cu.id) as actual_uses,
    SUM(cu.final_price) as actual_revenue
FROM coupons c
LEFT JOIN coupon_uses cu ON c.id = cu.coupon_id
WHERE c.id = [COUPON_ID]
GROUP BY c.id, c.code, c.creator_name, c.total_uses, c.total_revenue, c.total_commission;
```

### Vérifier toutes les utilisations d'un coupon
```sql
SELECT 
    cu.id,
    cu.final_price,
    cu.used_at,
    p.name as participant_name,
    p.phone as participant_phone
FROM coupon_uses cu
JOIN participants p ON cu.participant_id = p.id
WHERE cu.coupon_id = [COUPON_ID]
ORDER BY cu.used_at DESC;
```

### Vérifier la cohérence des données
```sql
-- Vérifier que total_uses correspond au nombre réel d'utilisations
SELECT 
    c.id,
    c.code,
    c.total_uses as stored_uses,
    COUNT(cu.id) as actual_uses,
    CASE 
        WHEN c.total_uses = COUNT(cu.id) THEN 'OK'
        ELSE 'INCONSISTENT'
    END as status
FROM coupons c
LEFT JOIN coupon_uses cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.total_uses
HAVING c.total_uses != COUNT(cu.id);
```

## Points d'attention

### 1. Gestion des valeurs NULL
- `COALESCE(coupon_revenue, 0)` garantit qu'on n'ajoute pas à NULL
- Important pour les nouveaux coupons

### 2. Performance
- La fonction récupère d'abord la valeur actuelle
- Puis met à jour avec la nouvelle valeur
- Impact minimal sur les performances

### 3. Cohérence
- Le trigger s'exécute automatiquement après chaque insertion
- Garantit que les statistiques sont toujours à jour

## Dépannage

### Si l'erreur persiste
1. Vérifier que le script de correction a été exécuté
2. Vérifier que l'ancien trigger a été supprimé
3. Vérifier que le nouveau trigger a été créé

### Si les statistiques sont incorrectes
1. Vérifier la fonction `calculate_coupon_commission`
2. Vérifier les paliers de commission
3. Recalculer manuellement si nécessaire

### Si le trigger ne s'exécute pas
1. Vérifier les permissions RLS
2. Vérifier que l'insertion dans `coupon_uses` fonctionne
3. Vérifier les logs d'erreur PostgreSQL 