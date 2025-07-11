-- Migration : Ajout du champ bonus_commission à la table winners
ALTER TABLE winners
ADD COLUMN bonus_commission DECIMAL(10,2) NULL; 