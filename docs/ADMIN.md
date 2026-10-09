# Guide d'administration — PES-RH

## Accès

- URL admin : `/admin` (rôle `ADMIN` uniquement).
- Activez le 2FA sur `/settings/security` dès le premier accès.

## Tâches courantes

| Tâche | Où |
|-------|-----|
| Valider / refuser un pack recruteur payé | `/admin` (file d'attente) |
| Utilisateurs et rôles | `/admin/utilisateurs` |
| Offres / recrutement | `/admin/recrutement` |
| Paiements manuels (Orange Money) | `/admin/paiements` |
| FAQ et newsletter | `/admin/faq` |
| Services et textes du site | `/admin/contenu-site/*` |
| Formations | `/admin/formations` |
| Boutique | `/admin/boutique` |
| Fil conseiller Gold | `/admin/conseiller` |
| Messages / devis contact | `/admin/messages` |
| Journal d'activité | `/admin/journal` |

## Packs recruteur

1. L'entreprise s'inscrit sans mot de passe, choisit un pack et paie (MoMo / Orange / carte).
2. Après paiement, le compte apparaît en **PENDING_REVIEW**.
3. Approuver : facture, e-mail avec mot de passe temporaire → `/premiere-connexion`.
4. Refuser : remboursement MoMo/Stripe lorsque le fournisseur le permet.

## Orange Money

Tant que l'API n'est pas branchée, confirmez manuellement les paiements Orange dans `/admin/paiements` après contrôle du reçu / référence.
