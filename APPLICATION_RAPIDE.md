# Guide d'Application Rapide - Correction des Coupons

## Problème à résoudre
Erreur : `column reference "total_revenue" is ambiguous` lors de l'utilisation de coupons.

## Solution en 3 étapes

### Étape 1 : Appliquer la correction complète
Exécuter le script `fix_all_coupon_functions.sql` dans votre base de données Supabase :

1. Allez dans le **Dashboard Supabase**
2. Cliquez sur **SQL Editor**
3. Copiez-collez le contenu de `fix_all_coupon_functions.sql`
4. Cliquez sur **Run**

### Étape 2 : Vérifier les valeurs négatives (optionnel)
Exécuter le script `verify_positive_values.sql` pour corriger les valeurs négatives existantes.

### Étape 3 : Tester
1. Créer un coupon dans l'interface admin
2. Effectuer un paiement avec ce coupon
3. Vérifier que l'erreur ne se produit plus

## Vérification rapide

### Requête pour vérifier que les fonctions existent :
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('calculate_coupon_commission', 'update_coupon_stats');
```

### Requête pour vérifier que le trigger existe :
```sql
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'update_coupon_stats_trigger';
```

## Protection contre les valeurs négatives

Les fonctions ont été modifiées pour utiliser `GREATEST()` qui garantit que :
- `total_uses` ne peut jamais être négatif
- `total_revenue` ne peut jamais être négatif
- `total_commission` ne peut jamais être négatif

## En cas de problème

### Si l'erreur persiste :
1. Vérifiez que le script a été exécuté complètement
2. Vérifiez les logs d'erreur dans la console
3. Contactez le support avec les messages d'erreur

### Si les statistiques sont incorrectes :
1. Exécutez `verify_positive_values.sql`
2. Vérifiez la cohérence des données
3. Recalculez manuellement si nécessaire

## Résumé des corrections

✅ **Ambiguïté de colonnes résolue** : Variables locales utilisées
✅ **Protection contre les valeurs négatives** : `GREATEST()` appliqué
✅ **Gestion des valeurs NULL** : `COALESCE()` utilisé
✅ **Cohérence des données** : Vérifications ajoutées

## Test recommandé

Après application, testez avec :
1. Un coupon sans utilisation
2. Un coupon avec plusieurs utilisations
3. Un coupon avec des montants différents

Le système devrait maintenant fonctionner sans erreur ! 🎉 