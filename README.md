# BFC – Version PWA

Transformation de [berberfc.com](https://berberfc.com) en **Progressive Web App** : installable sur Android, iOS et desktop, avec mode hors-ligne.

## 📱 Démo en ligne
Une fois GitHub Pages activé : `https://<utilisateur>.github.io/<nom-du-repo>/`

Ouvrez le lien sur mobile :
- **Android / Chrome** : bandeau « Installer l'application » ou menu ⋮ → *Installer l'application*
- **iPhone / Safari** : Partager → *Sur l'écran d'accueil*
- Coupez le réseau : l'app reste utilisable (page hors-ligne / contenu en cache)

## Contenu du dépôt
| Dossier | Rôle |
|---|---|
| `demo/` | Démo statique installable (hébergée sur GitHub Pages) |
| `kit/`  | Fichiers à intégrer au vrai site Next.js (manifest, service worker, page hors-ligne, composant d'installation, générateur d'icônes) |

Instructions d'intégration au site : [`kit/LISEZ-MOI.md`](kit/LISEZ-MOI.md)

## Fonctionnalités PWA
- Manifest complet + raccourcis (Événements, Combattants, Résultats, Actualités)
- Service worker : cache des pages, images et données, page hors-ligne
- Invite d'installation (Android/Desktop) + aide iOS
- Notification de mise à jour de l'app
- Prêt pour les notifications push et la publication Google Play (TWA)

> La démo est un aperçu non officiel construit à partir du contenu public du site.
