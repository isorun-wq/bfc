# BFC → PWA (Next.js)

Le site berberfc.com est une application **Next.js** (`/_next/...`). Ce kit ajoute tout ce qu'il faut pour en faire une PWA installable, avec mode hors-ligne.

## 1. Copier les fichiers dans votre projet

| Ce kit                          | Votre projet                    |
|---------------------------------|---------------------------------|
| `public/manifest.webmanifest`   | `public/manifest.webmanifest`   |
| `public/sw.js`                  | `public/sw.js`                  |
| `public/offline.html`           | `public/offline.html`           |
| `public/icons/*`                | `public/icons/*`                |
| `components/PWARegister.tsx`    | `components/PWARegister.tsx`    |
| `scripts/generate-icons.mjs`    | `scripts/generate-icons.mjs`    |

## 2. Brancher dans `app/layout.tsx` (App Router)

```tsx
import type { Metadata, Viewport } from "next";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BFC", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
```

> Pages Router : ajoutez dans `pages/_document.tsx` (ou `_app.tsx`) les balises
> `<link rel="manifest" href="/manifest.webmanifest" />`, `<meta name="theme-color" content="#0a0a0a" />`,
> `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`, et montez `<PWARegister />` dans `_app.tsx`.

## 3. En-têtes pour le service worker (`next.config.js`)

```js
module.exports = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};
```

## 4. Remplacer les icônes provisoires par votre logo

```bash
npm i -D sharp
node scripts/generate-icons.mjs public/images/logo.png
```

## 5. Tester

```bash
npm run build && npm start
```
Ouvrez Chrome → DevTools → **Application** → Manifest / Service Workers, puis **Lighthouse → PWA**.
La PWA exige **HTTPS** en production (localhost est accepté pour les tests).

## Ce que fait le service worker
- **Pages** : réseau d'abord, copie en cache en secours, sinon `offline.html`.
- **Assets / images / logos partenaires** : réponse instantanée depuis le cache, mise à jour en arrière-plan.
- **`/bfc-api/`** (événements, résultats, combattants) : réseau d'abord, dernières données consultables hors-ligne.
- **Mises à jour** : bandeau « Mettre à jour » quand une nouvelle version est déployée.
- Bouton d'installation Android/Chrome + instructions pour iOS.
- Notifications push prêtes côté client (il faudra un backend Web Push + clés VAPID pour les envoyer).

## À personnaliser
- `theme_color` / `background_color` (`#0a0a0a` et rouge `#dc2626` sont des valeurs par défaut) → utilisez les couleurs exactes de la charte BFC.
- Incrémentez `VERSION` dans `sw.js` pour forcer une purge de cache.
- Pour publier sur Google Play : encapsulez via **Bubblewrap / PWABuilder** (TWA).
