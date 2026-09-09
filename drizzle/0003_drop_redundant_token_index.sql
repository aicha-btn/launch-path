-- `invitations_token_idx` était un doublon exact de l'index créé par la
-- contrainte `invitations_token_unique` : même table, même colonne, même
-- méthode btree. Deux index à maintenir à chaque écriture, un seul utile.
DROP INDEX "invitations_token_idx";
