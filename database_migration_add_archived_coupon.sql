-- Migration : Ajout du champ is_archived à la table coupons
ALTER TABLE coupons
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false; 