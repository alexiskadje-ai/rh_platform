# Cahier des Charges Complet — Plateforme RH

**Plateforme de Recrutement, Formation et Gestion RH (ERP RH)**

*Vision produit · Expérience utilisateur · Architecture technique · Feuille de route*

*Stack : Next.js 14+ (App Router) · Prisma ORM · PostgreSQL · Cursor IDE — Inspiré de pes-rh.net, enrichi en UI/UX*

*Document de référence unique à suivre pendant le développement avec Cursor.*

# Sommaire

# Partie 1 — Vision produit et positionnement

## 1.1 Contexte et positionnement

La plateforme s'inspire de pes-rh.net (Pôle Emploi Services), un cabinet camerounais de recrutement, placement et mise à disposition de personnel structuré autour de 3 espaces (Candidat, Recruteur, Entreprise) et d'un module Formation en ligne. L'objectif est de reprendre cette base fonctionnelle éprouvée sur le marché camerounais, tout en la transformant en un véritable ERP RH digital — pas seulement une vitrine avec formulaires de contact, mais un outil où toutes les actions (candidature, validation, congé, paiement, formation) se déroulent de bout en bout dans l'application, avec un design plus moderne, plus fluide et pensé mobile-first.

## 1.2 Axes d'amélioration par rapport à pes-rh.net

| **Aspect**        | **Constat sur pes-rh.net**                                                                         | **Amélioration apportée**                                                                                                          |
|-------------------|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Navigation        | Espaces dupliqués (Espace Candidat / Espace Recruteur / Espace Entreprise) qui prêtent à confusion | Un point d'entrée unique « Se connecter / Créer un compte » qui redirige automatiquement vers le bon tableau de bord selon le rôle |
| Preuve sociale    | Chiffres clés statiques sans contexte ni mise à jour visible                                       | Statistiques dynamiques calculées en temps réel depuis la base de données + témoignages                                            |
| Offres d'emploi   | Aperçu limité, liens non fonctionnels sur la vitrine publique                                      | Fil d'offres dynamique avec recherche, filtres et candidature en un clic                                                           |
| Formulaires       | Pas de retour visuel clair sur l'avancement                                                        | Barres de progression, sauvegarde automatique des brouillons, validation en temps réel                                             |
| Mobile            | Mise en page desktop-first, texte dense                                                            | Conception mobile-first, sections courtes, CTA collants sur mobile                                                                 |
| Suivi candidat    | Pas de visibilité sur l'état d'une candidature après dépôt                                         | Statuts visuels avec historique horodaté                                                                                           |
| Espace entreprise | Expérience déconnectée du reste du site                                                            | Dashboard entreprise unifié avec KPIs, rapports, actions rapides                                                                   |
| Accessibilité     | Contrastes et hiérarchie typographique perfectibles                                                | Respect WCAG AA, contrastes vérifiés, zones cliquables adaptées au mobile                                                          |

## 1.3 Stack technique retenue

Le choix technique découle directement des besoins fonctionnels décrits dans ce document (formulaires complexes, données relationnelles RH, paiements locaux, notifications multicanales).

| **Couche**              | **Technologie**                                   | **Justification**                                                       |
|-------------------------|---------------------------------------------------|-------------------------------------------------------------------------|
| Framework Full-Stack    | Next.js 14+ (App Router)                          | SSR/SSG, API Routes/Server Actions, un seul repo front+back             |
| Langage                 | TypeScript                                        | Typage strict indispensable vu la complexité du domaine RH              |
| ORM                     | Prisma                                            | Migrations versionnées, typage auto généré, adapté PostgreSQL           |
| Base de données         | PostgreSQL 15+                                    | Relationnel robuste, adapté aux données RH/contrats/relations complexes |
| Authentification        | NextAuth.js (Auth.js v5) + 2FA (otplib)           | Gestion multi-rôles, sessions, providers email/SMS                      |
| Stockage fichiers       | AWS S3 / Cloudflare R2                            | CV, contrats, bulletins de paie, certificats médicaux                   |
| Paiement local          | MTN MoMo API, Orange Money API                    | Exigence explicite du cahier des charges client                         |
| Paiement carte          | Stripe ou Fapshi/Notch Pay                        | Carte bancaire + virement                                               |
| Emails / SMS / WhatsApp | Resend, Twilio/Nexah, WhatsApp Business Cloud API | Notifications multicanales (§6.3)                                       |
| File d'attente / jobs   | BullMQ + Redis                                    | Envoi asynchrone notifications, génération PDF, rapports                |
| UI                      | Tailwind CSS + shadcn/ui                          | Rapide, cohérent, accessible                                            |
| Validation              | Zod                                               | Validation des formulaires et des payloads API                          |
| Gestion d'état client   | TanStack Query + Zustand                          | Cache serveur/client + état panier boutique                             |
| Tests                   | Vitest + Playwright                               | Unitaires + E2E                                                         |
| CI/CD                   | GitHub Actions                                    | Lint, tests, build, déploiement auto                                    |
| Hébergement             | VPS + Docker ou Vercel + Railway/Supabase         | Selon budget ; VPS recommandé pour souveraineté des données RH          |

# Partie 2 — Expérience utilisateur (UI/UX)

## 2.1 Page d'accueil (Landing Page)

### En-tête / Navigation

- Barre fixe (sticky), transparente sur le hero puis pleine au scroll

- Logo à gauche · Menu central : Accueil · Qui sommes-nous · Nos services · Offres d'emploi · Formations · Boutique · FAQ

- Un seul CTA d'inscription qui ouvre un choix « Je cherche un emploi / Je recrute » (au lieu de dupliquer les espaces comme pes-rh.net)

### Section Hero

- Titre + sous-titre expliquant la double promesse (candidats + entreprises)

- Deux CTA : « Candidat : créer votre profil » et « Recruteur : publiez vos offres »

- Barre de recherche rapide d'offres intégrée directement dans le hero (mot-clé + localisation)

### Barre de statistiques

4 chiffres clés calculés dynamiquement (CV disponibles, taux de satisfaction, entreprises suivies, recruteurs actifs), animation de comptage au scroll.

### Section « Nos services »

- Gestion administrative du personnel

- Mise à disposition du personnel

- Accompagnement des chercheurs d'emploi

- Audit et accompagnement RH

- Externalisation du recrutement (RPO)

- Formation professionnelle en ligne (différenciant, mis en avant visuellement)

### Section « Comment ça marche »

*Créer votre compte → Déposer votre CV / profil → Analyse du profil → Mise en relation / entretien*

*Chaque étape est cliquable et renvoie vers l'action correspondante si l'utilisateur est connecté.*

### Section « Offres d'emploi récentes »

Carrousel/grille des 6 offres les plus récentes, cliquables même pour un visiteur non connecté ; la candidature déclenche la connexion/inscription si nécessaire.

### Section Témoignages (nouveau)

Carrousel de 3 à 5 témoignages (candidats placés, entreprises clientes) avec photo, nom, poste/entreprise — absent chez pes-rh.net, ajouté pour renforcer la confiance.

### Newsletter et pied de page

- Newsletter : champ email + cases à cocher par type d'alerte

- Footer : logo/réseaux sociaux, menu, services entreprise, coordonnées + mini formulaire de contact

## 2.2 Architecture de l'information (plan du site)

| **Zone**                      | **Pages / Écrans**                                                                                                                                   |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| Public (non connecté)         | Accueil, Qui sommes-nous, Nos services, Offres d'emploi, Formations, Boutique, FAQ, Contact, Connexion, Inscription                                  |
| Espace Candidat               | Tableau de bord, Mon profil/CV, Mes candidatures, Offres recommandées, Mes formations, Mes achats, Notifications, Paramètres + 2FA                   |
| Espace Recruteur / Entreprise | Tableau de bord, Offres publiées, Candidatures reçues, Employés affectés, Congés à valider, Rapports, Facturation, Utilisateurs internes, Paramètres |
| Espace Employé                | Tableau de bord, Mon dossier, Mes congés, Mon pointage, Mes documents, Mes formations                                                                |
| Espace Administrateur         | Tableau de bord, Recruteurs/Entreprises, Candidats, Employés, Formations, Boutique, Paiements/Abonnements, Rôles & permissions, Journal d'activité   |

## 2.3 Parcours utilisateurs

### Visiteur anonyme

*Atterrit sur la landing page → Consulte offres/formations/services → Clique candidater ou s'inscrire → Choix du rôle → Formulaire d'inscription → Vérification email/SMS → Accès au tableau de bord*

### Candidat

*Inscription → Vérification → Complétion du profil/CV → Recherche d'offres → Candidature en un clic → Suivi du statut → Convocation entretien → Résultat → Si recruté : accès Employé*

*Amélioration : barre de progression « Profil complété à X% » avec incitation à finaliser avant de pouvoir postuler.*

### Recruteur / Entreprise

*Inscription entreprise → Validation par l'admin → Complétion profil entreprise → Publication d'offre → Tri des candidatures → Convocation entretiens → Décision → Bascule en fiche Employé → Suivi RH courant*

### Employé

*Compte créé à l'embauche → Première connexion → Consultation fiche → Congé/absence → Pointage quotidien → Documents → Formations assignées*

### Administrateur

*Connexion 2FA → Validation comptes entreprise → Supervision offres/candidatures → Gestion formations/boutique → Suivi paiements/abonnements → Statistiques globales → Rôles et journal d'activité*

# Partie 3 — Modélisation des données

Ce schéma Prisma est le pivot technique de tout le document : chaque écran et chaque formulaire de la Partie 2 se traduit par la création/modification d'une ou plusieurs de ces tables (voir la table de correspondance en §3.2).

## 3.1 Schéma Prisma

datasource db {  
provider = "postgresql"  
url = env("DATABASE_URL")  
}  
generator client {  
provider = "prisma-client-js"  
}  
  
enum Role { ADMIN RECRUITER CANDIDATE EMPLOYEE }  
enum ContractType { CDI CDD STAGE PRESTATION }  
enum ApplicationStatus { RECEIVED SHORTLISTED INTERVIEW ACCEPTED REJECTED }  
enum LeaveStatus { PENDING APPROVED REJECTED }  
enum PaymentProvider { MTN_MOMO ORANGE_MONEY CARD BANK_TRANSFER }  
  
model User {  
id String @id @default(cuid())  
email String @unique  
phone String?  
passwordHash String  
role Role  
twoFactorSecret String?  
isVerified Boolean @default(false)  
createdAt DateTime @default(now())  
company Company? @relation(fields: \[companyId\], references: \[id\])  
companyId String?  
candidate Candidate?  
employee Employee?  
notifications Notification\[\]  
}  
  
model Company {  
id String @id @default(cuid())  
name String  
address String?  
users User\[\]  
jobOffers JobOffer\[\]  
employees Employee\[\]  
subscription Subscription?  
createdAt DateTime @default(now())  
}  
  
model Candidate {  
id String @id @default(cuid())  
user User @relation(fields: \[userId\], references: \[id\])  
userId String @unique  
cvUrl String?  
skills String\[\]  
educations Education\[\]  
experiences Experience\[\]  
applications Application\[\]  
}  
  
model JobOffer {  
id String @id @default(cuid())  
company Company @relation(fields: \[companyId\], references: \[id\])  
companyId String  
title String  
description String  
requirements String  
location String  
salary Int?  
deadline DateTime  
applications Application\[\]  
createdAt DateTime @default(now())  
}  
  
model Application {  
id String @id @default(cuid())  
candidate Candidate @relation(fields: \[candidateId\], references: \[id\])  
candidateId String  
jobOffer JobOffer @relation(fields: \[jobOfferId\], references: \[id\])  
jobOfferId String  
status ApplicationStatus @default(RECEIVED)  
notes String?  
createdAt DateTime @default(now())  
}  
  
model Employee {  
id String @id @default(cuid())  
user User @relation(fields: \[userId\], references: \[id\])  
userId String @unique  
company Company @relation(fields: \[companyId\], references: \[id\])  
companyId String  
matricule String @unique  
position String  
department String  
contractType ContractType  
hireDate DateTime  
managerId String?  
documents Document\[\]  
leaves LeaveRequest\[\]  
attendances Attendance\[\]  
absences Absence\[\]  
}  
  
model Document {  
id String @id @default(cuid())  
employee Employee @relation(fields: \[employeeId\], references: \[id\])  
employeeId String  
type String // contrat, attestation, bulletin, diplome, cni, certificat_medical  
fileUrl String  
uploadedAt DateTime @default(now())  
}  
  
model LeaveRequest {  
id String @id @default(cuid())  
employee Employee @relation(fields: \[employeeId\], references: \[id\])  
employeeId String  
startDate DateTime  
endDate DateTime  
status LeaveStatus @default(PENDING)  
reason String?  
}  
  
model Attendance {  
id String @id @default(cuid())  
employee Employee @relation(fields: \[employeeId\], references: \[id\])  
employeeId String  
date DateTime  
checkIn DateTime?  
checkOut DateTime?  
lateMinutes Int? @default(0)  
overtimeMinutes Int? @default(0)  
}  
  
model Absence {  
id String @id @default(cuid())  
employee Employee @relation(fields: \[employeeId\], references: \[id\])  
employeeId String  
reason String  
justificationUrl String?  
validated Boolean @default(false)  
}  
  
model Course {  
id String @id @default(cuid())  
title String  
description String  
price Int @default(0)  
videos String\[\]  
documents String\[\]  
enrollments Enrollment\[\]  
}  
  
model Enrollment {  
id String @id @default(cuid())  
course Course @relation(fields: \[courseId\], references: \[id\])  
courseId String  
userId String  
progress Int @default(0)  
certificateUrl String?  
}  
  
model Product {  
id String @id @default(cuid())  
title String  
type String // livre, guide, modele_cv, modele_lettre, formation_premium  
price Int  
fileUrl String  
orders OrderItem\[\]  
}  
  
model Order {  
id String @id @default(cuid())  
userId String  
items OrderItem\[\]  
total Int  
payment Payment?  
createdAt DateTime @default(now())  
}  
  
model OrderItem {  
id String @id @default(cuid())  
order Order @relation(fields: \[orderId\], references: \[id\])  
orderId String  
product Product @relation(fields: \[productId\], references: \[id\])  
productId String  
quantity Int @default(1)  
}  
  
model Payment {  
id String @id @default(cuid())  
order Order? @relation(fields: \[orderId\], references: \[id\])  
orderId String? @unique  
provider PaymentProvider  
amount Int  
status String // pending, success, failed  
reference String @unique  
createdAt DateTime @default(now())  
}  
  
model Subscription {  
id String @id @default(cuid())  
company Company @relation(fields: \[companyId\], references: \[id\])  
companyId String @unique  
plan String  
status String  
renewsAt DateTime  
}  
  
model Notification {  
id String @id @default(cuid())  
user User @relation(fields: \[userId\], references: \[id\])  
userId String  
channel String // email, sms, whatsapp  
message String  
sentAt DateTime?  
createdAt DateTime @default(now())  
}  
  
model Education {  
id String @id @default(cuid())  
candidate Candidate @relation(fields: \[candidateId\], references: \[id\])  
candidateId String  
degree String  
institution String  
year Int  
}  
  
model Experience {  
id String @id @default(cuid())  
candidate Candidate @relation(fields: \[candidateId\], references: \[id\])  
candidateId String  
title String  
company String  
startDate DateTime  
endDate DateTime?  
}

*Socle évolutif : les tables ActivityLog (journal d'activité, §5 Sécurité) et Role/Permission finement grainées peuvent être ajoutées en phase 2 si un RBAC dynamique est requis.*

## 3.2 Table de correspondance Écrans ↔ Modèles Prisma ↔ Phase

C'est le pont entre la Partie 2 (expérience utilisateur) et la Partie 4 (feuille de route) : pour chaque écran/formulaire décrit plus haut, voici quelles tables il manipule et à quelle phase de développement il est construit.

| **Écran / Fonctionnalité**                | **Modèle(s) Prisma**                          | **Phase**         |
|-------------------------------------------|-----------------------------------------------|-------------------|
| Inscription / Connexion / 2FA             | User                                          | Phase 1           |
| Profil candidat / CV en ligne             | Candidate, Education, Experience              | Phase 1-2         |
| Publication d'offre d'emploi              | JobOffer                                      | Phase 2           |
| Candidature en ligne + suivi              | Application                                   | Phase 2           |
| Convocation entretien                     | Application (status), Notification            | Phase 2 + Phase 8 |
| Fiche employé + documents                 | Employee, Document                            | Phase 3           |
| Demande de congé                          | LeaveRequest                                  | Phase 3           |
| Déclaration d'absence                     | Absence                                       | Phase 3           |
| Pointage / horaires                       | Attendance                                    | Phase 3           |
| Dashboard entreprise + rapports           | Employee, Attendance, LeaveRequest (agrégats) | Phase 4           |
| Création de formation                     | Course                                        | Phase 5           |
| Inscription formation + quiz + certificat | Enrollment                                    | Phase 5           |
| Boutique (catalogue + panier + checkout)  | Product, Order, OrderItem                     | Phase 6           |
| Paiement (MoMo/Orange/Carte)              | Payment, Subscription                         | Phase 7           |
| Notifications multicanales                | Notification                                  | Phase 8           |
| Dashboard admin + statistiques            | Tous modèles (agrégats), ActivityLog          | Phase 9           |
| Gestion utilisateurs / rôles              | User, Company                                 | Phase 1 + Phase 9 |

# Partie 4 — Formulaires détaillés (écrans et champs)

### 4.1 Inscription — Candidat

*Formulaire en 1 écran (2 étapes sur mobile) avant vérification. → modèle User.*

| **Champ**                 | **Type**                       | **Règle / Remarque**                  |
|---------------------------|--------------------------------|---------------------------------------|
| Nom                       | Texte                          | Obligatoire                           |
| Prénom                    | Texte                          | Obligatoire                           |
| Email                     | Email                          | Obligatoire, unique, vérifié par lien |
| Téléphone                 | Tél. (+237 par défaut)         | Obligatoire, vérifié par code SMS     |
| Mot de passe              | Password + indicateur de force | Min. 8 caractères, majuscule, chiffre |
| Confirmation mot de passe | Password                       | Doit correspondre                     |
| J'accepte les CGU         | Case à cocher                  | Obligatoire                           |

### 4.2 Inscription — Entreprise / Recruteur

*Compte en attente de validation admin après soumission. → modèles User, Company.*

| **Champ**                              | **Type**         | **Règle / Remarque**                               |
|----------------------------------------|------------------|----------------------------------------------------|
| Nom de l'entreprise                    | Texte            | Obligatoire                                        |
| Secteur d'activité                     | Liste déroulante | Obligatoire                                        |
| Nom du contact RH                      | Texte            | Obligatoire                                        |
| Email professionnel                    | Email            | Obligatoire, unique                                |
| Téléphone                              | Tél.             | Obligatoire, vérifié par SMS                       |
| Registre de commerce / N° contribuable | Texte            | Optionnel à l'inscription, requis avant validation |
| Mot de passe                           | Password         | Min. 8 caractères                                  |
| J'accepte les CGU                      | Case à cocher    | Obligatoire                                        |

### 4.3 Connexion + 2FA

*Écran 1 : identifiants. Écran 2 (si 2FA activé) : code à 6 chiffres. → modèle User.twoFactorSecret.*

| **Champ**                   | **Type**      | **Règle / Remarque**                      |
|-----------------------------|---------------|-------------------------------------------|
| Email ou téléphone          | Texte         | Obligatoire                               |
| Mot de passe                | Password      | Obligatoire, lien mot de passe oublié     |
| Code de vérification (2FA)  | 6 chiffres    | Expire après 5 minutes                    |
| Se souvenir de cet appareil | Case à cocher | Optionnel — évite le 2FA pendant 30 jours |

### 4.4 Profil candidat / CV en ligne

*Multi-sections, auto-save. → modèles Candidate, Education, Experience.*

| **Champ**                    | **Type**                  | **Règle / Remarque**                       |
|------------------------------|---------------------------|--------------------------------------------|
| Photo de profil              | Upload image              | Format carré recommandé                    |
| Titre professionnel          | Texte                     | Affiché sous le nom                        |
| Résumé / à propos            | Zone de texte             | Max 500 caractères                         |
| Expériences professionnelles | Liste répétable           | Ajout dynamique, tri chronologique         |
| Diplômes                     | Liste répétable           | Ajout dynamique                            |
| Certifications               | Liste répétable + fichier | Optionnel                                  |
| Compétences                  | Tags à saisie libre       | Min. 3 recommandées avant de postuler      |
| CV (fichier)                 | Upload PDF                | Génération auto possible depuis les champs |
| Disponibilité                | Liste déroulante          | Immédiate / sous préavis / date précise    |

### 4.5 Publication d'une offre d'emploi

*Aperçu en temps réel de la fiche publique. → modèle JobOffer.*

| **Champ**         | **Type**                     | **Règle / Remarque** |
|-------------------|------------------------------|----------------------|
| Intitulé du poste | Texte                        | Obligatoire          |
| Description       | Éditeur enrichi              | Obligatoire          |
| Exigences         | Éditeur enrichi              | Obligatoire          |
| Localisation      | Ville + région               | Obligatoire          |
| Type de contrat   | Liste déroulante             | Obligatoire          |
| Salaire           | Fourchette ou « À négocier » | Optionnel, masquable |
| Date limite       | Date                         | Obligatoire, future  |
| Nombre de postes  | Nombre                       | Défaut : 1           |
| Visibilité        | Publique / Sur invitation    | Défaut : publique    |

### 4.6 Candidature en ligne

*En un clic si profil complet. → modèle Application.*

| **Champ**              | **Type**            | **Règle / Remarque**               |
|------------------------|---------------------|------------------------------------|
| CV utilisé             | Sélection ou upload | Obligatoire                        |
| Lettre de motivation   | Texte ou upload     | Optionnel sauf exigence de l'offre |
| Prétentions salariales | Nombre              | Optionnel                          |
| Disponibilité          | Date                | Pré-remplie, modifiable            |

### 4.7 Convocation à un entretien

*Déclenche une notification multicanale. → modèles Application, Notification.*

| **Champ**              | **Type**                       | **Règle / Remarque** |
|------------------------|--------------------------------|----------------------|
| Candidat               | Sélection                      | Obligatoire          |
| Date et heure          | Sélecteur                      | Obligatoire          |
| Format                 | Présentiel / Visio / Téléphone | Obligatoire          |
| Lieu ou lien           | Texte / URL                    | Conditionnel         |
| Message complémentaire | Zone de texte                  | Optionnel            |

### 4.8 Fiche employé

*Certains champs en lecture seule pour l'employé. → modèles Employee, Document.*

| **Champ**                      | **Type**           | **Règle / Remarque**        |
|--------------------------------|--------------------|-----------------------------|
| Nom, prénom, date de naissance | Texte / Date       | Obligatoire                 |
| Adresse, téléphone, email      | Texte              | Obligatoire                 |
| Contact d'urgence              | Nom + téléphone    | Obligatoire                 |
| Poste, département             | Texte / Liste      | Obligatoire                 |
| Matricule                      | Auto-généré        | Unique, non modifiable      |
| Type de contrat                | Liste déroulante   | Obligatoire                 |
| Date d'embauche                | Date               | Obligatoire                 |
| Supérieur hiérarchique         | Sélection annuaire | Optionnel                   |
| Documents joints               | Upload multiple    | Contrat, diplôme, CNI, etc. |

### 4.9 Demande de congé

*Affiche le solde en temps réel. → modèle LeaveRequest.*

| **Champ**           | **Type**         | **Règle / Remarque**           |
|---------------------|------------------|--------------------------------|
| Type de congé       | Liste déroulante | Obligatoire                    |
| Date de début / fin | Date             | Obligatoire, fin ≥ début       |
| Motif               | Zone de texte    | Optionnel selon le type        |
| Justificatif        | Upload           | Obligatoire pour congé maladie |

### 4.10 Déclaration d'absence

*Pour une absence déjà survenue ou imprévue. → modèle Absence.*

| **Champ**            | **Type**            | **Règle / Remarque**         |
|----------------------|---------------------|------------------------------|
| Date(s) concernée(s) | Date ou plage       | Obligatoire                  |
| Motif                | Liste + champ libre | Obligatoire                  |
| Justificatif         | Upload              | Obligatoire si arrêt maladie |

### 4.11 Création d'une formation

*3 onglets : Infos, Contenu, Évaluation. → modèle Course.*

| **Champ**         | **Type**                           | **Règle / Remarque**          |
|-------------------|------------------------------------|-------------------------------|
| Titre             | Texte                              | Obligatoire                   |
| Description       | Éditeur enrichi                    | Obligatoire                   |
| Catégorie         | Liste déroulante                   | Obligatoire                   |
| Prix              | Nombre                             | 0 = gratuit                   |
| Modules / vidéos  | Upload multiple + réordonnancement | Au moins 1 requis             |
| Documents PDF     | Upload multiple                    | Optionnel                     |
| Quiz final        | Générateur QCM                     | Recommandé pour certification |
| Seuil de réussite | Pourcentage                        | Défaut : 70%                  |

### 4.12 Boutique — produit et commande

*Catalogue filtrable par type. → modèles Product, Order, OrderItem, Payment.*

| **Champ**           | **Type**                         | **Règle / Remarque**       |
|---------------------|----------------------------------|----------------------------|
| Nom du produit      | Texte                            | Obligatoire (admin)        |
| Type                | Liste déroulante                 | Obligatoire                |
| Prix                | Nombre                           | Obligatoire                |
| Fichier livrable    | Upload                           | Lien généré après paiement |
| Quantité (panier)   | Nombre                           | Défaut 1                   |
| Méthode de paiement | MoMo / Orange / Carte / Virement | Obligatoire au checkout    |

### 4.13 Gestion des utilisateurs et rôles (admin)

*Tableau avec recherche et actions rapides. → modèles User, Company.*

| **Champ**                    | **Type**                      | **Règle / Remarque**   |
|------------------------------|-------------------------------|------------------------|
| Recherche                    | Champ texte                   | Nom/email/téléphone    |
| Filtre rôle                  | Liste déroulante              | —                      |
| Filtre statut                | Actif / En attente / Suspendu | —                      |
| Valider un compte entreprise | Bouton                        | Déclenche notification |
| Changer de rôle              | Liste déroulante              | Confirmation requise   |

# Partie 5 — Logique métier par module

## 5.1 Recrutement

- Statuts : Reçue → Présélectionnée → Entretien → Acceptée / Refusée, chaque changement horodaté et notifié.

- Tri automatique : score basé sur la correspondance compétences profil / mots-clés de l'offre.

- Une offre passe automatiquement en « Clôturée » à la date limite.

## 5.2 Congés et absences

- Solde de congés accumulé mensuellement selon un taux paramétrable par l'admin (ex. 1,5 jour/mois pour un CDI).

- Validation par le supérieur hiérarchique direct par défaut ; second niveau (RH) activable par entreprise.

- Un congé maladie sans justificatif sous 48h alerte automatiquement le RH.

## 5.3 Notifications

| **Événement**             | **Destinataire**          | **Canaux par défaut**  |
|---------------------------|---------------------------|------------------------|
| Création de compte        | Utilisateur concerné      | Email                  |
| Nouvelle candidature      | Recruteur de l'offre      | Email + in-app         |
| Convocation entretien     | Candidat                  | Email + SMS + WhatsApp |
| Validation/refus de congé | Employé                   | Email + in-app         |
| Formation disponible      | Candidats/employés ciblés | Email                  |
| Paiement confirmé         | Acheteur                  | Email + SMS            |

## 5.4 Paiements

- Commande/abonnement en « En attente » jusqu'à confirmation du fournisseur (webhook).

- En cas d'échec : écran explicatif + possibilité de réessayer immédiatement.

- Facture PDF générée automatiquement à la confirmation.

## 5.5 E-learning

- Parcours linéaire par défaut (déblocage séquentiel des modules), paramétrable en accès libre.

- Certificat généré automatiquement dès le score au quiz au-dessus du seuil.

# Partie 6 — Tableaux de bord

## 6.1 Candidat

- Bandeau de complétion du profil + CTA

- Statistiques : candidatures envoyées, entretiens programmés, formations en cours

- Offres recommandées + candidatures récentes avec statut visuel

## 6.2 Recruteur / Entreprise

- KPIs : offres actives, candidatures en attente, entretiens à venir, employés actifs

- Graphique candidatures reçues sur 30 jours

- Alertes congés en attente de validation

## 6.3 Employé

- Solde de congés, dernier pointage

- Raccourcis congé/absence/documents

- Calendrier congés d'équipe (lecture seule)

## 6.4 Administrateur

- KPIs globaux : candidats, entreprises, employés, offres, formations vendues, revenus, taux de recrutement/rétention

- File d'attente comptes entreprise à valider

- Accès rapide journal d'activité et gestion des rôles

## 6.5 Recommandations UI/UX transverses

- Design system unique (1 couleur primaire, 1 accent, tons neutres), typographie cohérente

- Mobile-first : listes en cartes empilées, pas de tableaux larges non responsives

- États vides soignés : illustration + message + CTA plutôt qu'un tableau vide

- Feedback immédiat (toast) sur chaque action, mise à jour sans rechargement

- Système de badges de statut cohérent partout (vert/orange/rouge/gris)

# Partie 7 — Feuille de route d'implémentation

Chaque phase construit à la fois le backend (modèles Prisma listés en §3.2) et les écrans correspondants décrits en Parties 2 et 4.

## Phase 0 — Cadrage (Semaine 1)

- Valider ce cahier des charges avec le client

- Finaliser les maquettes UI/UX (Figma) pour les 4 espaces, en reprenant les descriptions de la Partie 2

- Créer le dépôt Git, board Kanban

## Phase 1 — Socle technique (Semaines 2-3)

- Initialiser Next.js + TypeScript + Tailwind + shadcn/ui

- Configurer Prisma + PostgreSQL, migration initiale à partir du schéma de la Partie 3

- NextAuth.js (email/mot de passe, session JWT, 4 rôles) — écrans §4.1 à 4.3

- 2FA (TOTP)

- Structure de dossiers et middleware de protection de routes

## Phase 2 — Module Recrutement (Semaines 4-6)

- CRUD offres d'emploi — écran §4.5

- Profil candidat/CV — écran §4.4

- Candidature en ligne + suivi — écran §4.6

- Tri/filtrage automatique (logique §5.1)

- Convocation entretien — écran §4.7 (branchement notifications en Phase 8)

## Phase 3 — ERP RH / Employés (Semaines 7-10)

- Fiche employé + documents — écran §4.8

- Module Congés — écran §4.9, logique §5.2

- Module Horaires/Pointage

- Module Absences/Maladies — écran §4.10

## Phase 4 — Portail Client Entreprise (Semaine 11)

- Dashboard entreprise — §6.2

- 5 rapports PDF téléchargeables

## Phase 5 — E-Learning (Semaines 12-13)

- CRUD formations — écran §4.11

- Espace apprenant, progression, quiz (logique §5.5)

- Certificat automatique

## Phase 6 — Boutique numérique (Semaine 14)

- Catalogue + panier — écran §4.12

- Checkout (préparation Phase 7)

## Phase 7 — Paiements (Semaines 15-16)

- MTN MoMo, Orange Money, Stripe (logique §5.4)

- Webhooks + facturation automatique

## Phase 8 — Notifications (Semaine 17)

- BullMQ + Redis, adapters Email/SMS/WhatsApp

- Branchement des déclencheurs listés en §5.3

## Phase 9 — Back-office Admin & Statistiques (Semaine 18)

- Dashboard admin — §6.4

- Gestion rôles/permissions — écran §4.13, journal d'activité

## Phase 10 — Sécurité & durcissement (Semaine 19)

- RBAC middleware, SSL, sauvegardes automatiques, rate limiting (détail Partie 8)

## Phase 11 — Tests, déploiement, formation (Semaines 20-21)

- Tests Vitest/Playwright, Docker, CI/CD, documentation, formation admin

# Partie 8 — Installation et dépendances (environnement Cursor)

## 8.1 Prérequis système

- Node.js 20 LTS

- PostgreSQL 15+ (local via Docker recommandé)

- Redis 7+ (pour BullMQ)

- Git

## 8.2 Initialisation du projet

npx create-next-app@latest rh-platform --typescript --tailwind --app --eslint  
cd rh-platform

## 8.3 Dépendances principales

\# ORM & DB  
npm install prisma @prisma/client  
npx prisma init --datasource-provider postgresql  
  
\# Auth  
npm install next-auth@beta bcryptjs otplib qrcode  
npm install -D @types/bcryptjs @types/qrcode  
  
\# Validation & formulaires  
npm install zod react-hook-form @hookform/resolvers  
  
\# UI  
npx shadcn@latest init  
npm install lucide-react class-variance-authority clsx tailwind-merge  
  
\# Data fetching / état  
npm install @tanstack/react-query zustand  
  
\# Jobs & cache  
npm install bullmq ioredis  
  
\# Emails / SMS / WhatsApp  
npm install resend nodemailer twilio  
npm install -D @types/nodemailer  
  
\# Stockage fichiers  
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner  
  
\# PDF  
npm install @react-pdf/renderer  
  
\# Paiement  
npm install stripe axios  
  
\# Graphiques  
npm install recharts  
  
\# Tests  
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright

## 8.4 Docker local (docker-compose.yml)

version: "3.9"  
services:  
postgres:  
image: postgres:15  
environment:  
POSTGRES_USER: rh_user  
POSTGRES_PASSWORD: rh_password  
POSTGRES_DB: rh_platform  
ports: \["5432:5432"\]  
volumes: \["pgdata:/var/lib/postgresql/data"\]  
redis:  
image: redis:7  
ports: \["6379:6379"\]  
volumes:  
pgdata:

## 8.5 Variables d'environnement (.env.example)

DATABASE_URL="postgresql://rh_user:rh_password@localhost:5432/rh_platform"  
NEXTAUTH_SECRET=""  
NEXTAUTH_URL="http://localhost:3000"  
REDIS_URL="redis://localhost:6379"  
S3_ENDPOINT=""  
S3_ACCESS_KEY=""  
S3_SECRET_KEY=""  
S3_BUCKET=""  
RESEND_API_KEY=""  
TWILIO_ACCOUNT_SID=""  
TWILIO_AUTH_TOKEN=""  
WHATSAPP_TOKEN=""  
WHATSAPP_PHONE_ID=""  
MOMO_API_USER=""  
MOMO_API_KEY=""  
MOMO_SUBSCRIPTION_KEY=""  
MOMO_ENV="sandbox"  
ORANGE_MONEY_MERCHANT_KEY=""  
ORANGE_MONEY_API_KEY=""  
STRIPE_SECRET_KEY=""  
STRIPE_WEBHOOK_SECRET=""

## 8.6 Commandes Prisma courantes

npx prisma migrate dev --name init  
npx prisma generate  
npx prisma studio  
npx prisma db seed

# Partie 9 — Sécurité

| **Exigence**               | **Implémentation technique**                                          |
|----------------------------|-----------------------------------------------------------------------|
| Authentification sécurisée | NextAuth.js + hachage bcrypt (12 rounds min)                          |
| 2FA                        | TOTP (otplib) + QR code (qrcode)                                      |
| Gestion des rôles          | Middleware Next.js vérifiant session.role sur chaque groupe de routes |
| Journal d'activité         | Table ActivityLog + hook Prisma middleware sur mutations sensibles    |
| Sauvegarde automatique     | pg_dump planifié + envoi vers S3/R2, rétention 30 jours               |
| Chiffrement SSL            | Reverse proxy Nginx/Caddy + Let's Encrypt                             |

# Partie 10 — Livrables

1.  Document d'analyse fonctionnelle (ce cahier des charges)

2.  Maquettes UI/UX (Figma), un fichier par espace utilisateur

3.  Dépôt Git avec CI/CD

4.  Plateforme déployée (staging + production)

5.  ERP RH intégré

6.  Portail E-learning fonctionnel

7.  Boutique en ligne avec paiement MoMo/Orange/Carte opérationnel

8.  Documentation technique

9.  Guide d'administration

10. Plan de support et maintenance

# Partie 11 — Points à valider avec le client

- Budget hébergement : VPS dédié vs solution managée ?

- Fournisseur SMS/WhatsApp local retenu ?

- Contrat marchand MTN MoMo et Orange Money déjà obtenus ?

- Volumétrie attendue pour dimensionner le VPS ?

- Politique de rétention des documents RH (durée légale au Cameroun) ?

- Parcours e-learning : linéaire par défaut ou accès libre ? (impacte §5.5)

- Niveau de validation des congés : un seul niveau ou double validation par défaut ? (impacte §5.2)

# Partie 12 — Fonctionnalités IA (roadmap V2)

Cette partie est une extension du cahier des charges initial : elle ajoute une couche IA ciblée sur les modules où elle fait vraiment gagner du temps RH, plutôt que de l'ajouter partout. Chaque feature est classée par niveau de risque/maturité plutôt que par module, pour prioriser correctement le développement.

## 12.1 Principe de sélection

Une feature IA n'est retenue en Tier 1 (MVP) que si : (1) le coût par appel est faible et prévisible, (2) une erreur du modèle est visible et corrigeable par un humain avant impact (ex : relecture d'un CV parsé), et (3) elle ne touche pas à des données sensibles sans garde-fou explicite (biométrie, congés d'un tiers). Les features qui ne remplissent pas ces 3 critères sont reportées en Tier 3, même si leur valeur perçue est forte.

## 12.2 Classement des features par tier

| **Tier**   | **Feature**                            | **Module**         | **Justification**                                                                                                      |
|------------|----------------------------------------|--------------------|------------------------------------------------------------------------------------------------------------------------|
| 1 — MVP    | AI CV Parser                           | Recrutement        | Extraction PDF → profil candidat, avec écran de relecture avant sauvegarde                                             |
| 1 — MVP    | AI Matching Score                      | Recrutement        | Score offre/candidat par embeddings ; c'est la feature différenciante du produit                                       |
| 1 — MVP    | Générateur de description d'offre      | Recrutement        | Faible risque, coût quasi nul, gain de temps recruteur immédiat                                                        |
| 2 — Revenu | Générateur CV/Lettre (Boutique)        | Boutique           | Produit payant existant (Modèles de CV) rendu génératif — revenu direct via MoMo/Orange                                |
| 2 — Revenu | Résumé automatique des rapports        | Portail Entreprise | Vient se greffer sur les rapports déjà agrégés en Phase 4, coût marginal faible                                        |
| 3 — V2     | Chatbot RH client                      | Portail Entreprise | Nécessite function-calling strict sur la base (jamais de texte libre) pour éviter fuite de données entre entreprises   |
| 3 — V2     | Alertes absences/démission             | ERP RH             | Démarre en règles simples (seuils), bascule en modèle prédictif une fois 6-12 mois de données réelles                  |
| 3 — V2     | OCR documentaire (recherche full-text) | ERP RH             | Valeur croissante avec le volume de documents ; pas critique au lancement                                              |
| 3 — V2     | Pointage par reconnaissance faciale    | ERP RH             | Nécessite détection de vivacité (anti-photo) et validation juridique avant développement (donnée biométrique sensible) |

## 12.3 Stack technique IA ajoutée

| **Besoin**                                     | **Outil retenu**                                                       | **Remarque**                                                                           |
|------------------------------------------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| Extraction de CV (parsing)                     | OpenAI GPT-4o-mini (mode JSON structuré) + pdf-parse                   | Sortie validée par un schéma Zod avant écriture en base                                |
| Matching sémantique offre/candidat             | text-embedding-3-small + pgvector (extension PostgreSQL)               | Score combiné : similarité vectorielle + filtres durs (localisation, type de contrat)  |
| Génération de texte (offres, lettres, résumés) | OpenAI GPT-4o-mini via Vercel AI SDK                                   | Coût très faible par génération, streaming possible côté UI                            |
| Chatbot RH (V2)                                | Vercel AI SDK + function-calling vers des requêtes Prisma prédéfinies  | Le modèle ne touche jamais la base directement — uniquement des fonctions whitelistées |
| OCR documentaire (V2)                          | Tesseract.js (gratuit) avec fallback GPT-4o Vision si confiance faible | Contrôle des coûts : GPT-4o Vision utilisé seulement en dernier recours                |
| Reconnaissance faciale (V2)                    | face-api.js côté navigateur + détection de vivacité                    | Stocker uniquement un vecteur facial (jamais la photo), consentement explicite requis  |

## 12.4 Modifications du schéma Prisma

Deux ajouts sont nécessaires pour le Tier 1 : un modèle pour stocker le score de matching, et l'activation de pgvector pour la recherche par similarité (Prisma ne supporte pas nativement le type vector — on le déclare en Unsupported et on interroge via SQL brut).

-- Migration SQL à ajouter manuellement (prisma/migrations/.../migration.sql)  
CREATE EXTENSION IF NOT EXISTS vector;  
  
ALTER TABLE "Candidate" ADD COLUMN "cvEmbedding" vector(1536);  
ALTER TABLE "JobOffer" ADD COLUMN "offerEmbedding" vector(1536);

// Ajouts au schema.prisma  
  
model Candidate {  
// ...champs existants  
parsedCvRaw Json? // sortie brute du parsing IA, pour audit/relecture  
cvEmbedding Unsupported("vector(1536)")?  
matchScores MatchScore\[\]  
}  
  
model JobOffer {  
// ...champs existants  
offerEmbedding Unsupported("vector(1536)")?  
matchScores MatchScore\[\]  
}  
  
model MatchScore {  
id String @id @default(cuid())  
candidate Candidate @relation(fields: \[candidateId\], references: \[id\])  
candidateId String  
jobOffer JobOffer @relation(fields: \[jobOfferId\], references: \[id\])  
jobOfferId String  
score Float // 0 à 100  
breakdown Json? // détail du score (compétences, localisation, expérience)  
computedAt DateTime @default(now())  
  
@@unique(\[candidateId, jobOfferId\])  
}

## 12.5 Feuille de route IA (greffée sur les phases existantes)

- Phase 2bis (juste après la Phase 2 Recrutement) : AI CV Parser + Matching Score + Générateur de description d'offre

- Phase 6bis (juste après la Phase 6 Boutique) : Générateur CV/Lettre payant

- Phase 4bis (juste après la Phase 4 Portail Entreprise) : Résumé automatique dans les rapports

- V2 post-lancement (une fois des données réelles accumulées) : Chatbot RH, alertes absences, OCR, pointage facial

## 12.6 Garde-fous à respecter

- Toute donnée extraite ou générée par IA reste modifiable par un humain avant d'être considérée comme définitive (CV parsé, description d'offre générée).

- Le chatbot RH n'a jamais accès à une requête SQL/Prisma libre — uniquement des fonctions prédéfinies et scopées à l'entreprise de l'utilisateur connecté.

- Toute fonctionnalité biométrique (reconnaissance faciale) nécessite un consentement explicite et séparé de l'employé, stocké et révocable.

- Plafonner les coûts : limiter le nombre d'appels IA par utilisateur/jour (ex. rate limiting sur les endpoints IA) pour éviter une facture OpenAI incontrôlée.
