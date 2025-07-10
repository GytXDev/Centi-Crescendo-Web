-- Migration : Ajout du champ parrain_contacte à la table coupons
ALTER TABLE coupons
ADD COLUMN parrain_contacte BOOLEAN NOT NULL DEFAULT false; 