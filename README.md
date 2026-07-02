# SOC Security Events — Console SIEM

Tableau de bord de supervision NOC/SOC responsive, mis en conformité **production**
dans le cadre du TP05 (audit de conformité, optimisation WebView, pipeline de
déploiement). Base : dashboard du TP02.5 (HTML/CSS/JS vanilla, thème sombre,
CSS Grid + Flexbox, filtrage JavaScript).

## Structure du projet

```
.
├── index.html    # structure + sémantique ARIA (nom imposé par GitHub Pages)
├── styles.css    # design tokens, layout, responsive, conformité WebView
├── script.js     # filtrage des événements + injection + annonces ARIA
└── README.md     # ce fichier : conformité, audit, déploiement
```

## Conformité au cahier des charges TP05

### 1. Comportement application native (WebView)

| Exigence | Implémentation | Fichier |
|---|---|---|
| Pas de sélection de texte sur l'interface (appui long) | `user-select: none` (+ préfixe `-webkit-`) sur header, titres, labels, légende, boutons, footer — **mais pas sur les données** : les cellules du tableau restent copiables (un technicien doit pouvoir copier une IP) | `styles.css`, section TP05 |
| Suppression du délai de double-tap (~300 ms) | `touch-action: manipulation` sur `body` : conserve défilement et pincement, supprime uniquement le zoom au double-tap | `styles.css`, règle `body` |
| Gestion des encoches (safe areas) | `viewport-fit=cover` dans le meta viewport + `padding: max(24px, env(safe-area-inset-*))` sur `body` (idem au palier mobile avec 14px) | `index.html` + `styles.css` |
| Finitions natives (bonus) | `theme-color` (barre de statut aux couleurs de la console), `-webkit-tap-highlight-color: transparent`, `overscroll-behavior-y: none` (pas de pull-to-refresh) | `index.html` + `styles.css` |

Choix assumé : **pas de `user-scalable=no`**. Le zoom par pincement est un droit
d'accessibilité (WCAG 1.4.4) ; le « zoom parasite » visé par le TP est celui du
double-tap, déjà neutralisé par `touch-action: manipulation`.

### 2. Accessibilité SecOps (WCAG / ARIA)

| Exigence | Implémentation | Fichier |
|---|---|---|
| `role="alert"` ou `role="status"` sur le bloc d'alertes | Les **deux** rôles sont utilisés à bon escient : région `#sr-alert` en `role="alert"` (assertif — interrompt la lecture pour annoncer un nouvel événement injecté) et compteur de filtrage en `role="status"` (poli — annonce sans interrompre) | `index.html` + `script.js` |
| Notification à l'injection d'un événement | Bouton « + Simuler un événement » : injecte une ligne dans le tableau et écrit la phrase d'annonce dans `#sr-alert` → notification vocale immédiate | `script.js`, section 4 bis |
| Double codage des statuts | Badges de criticité combinant **texte explicite** (« Critique »), **forme distincte** (▲ triangle / ◆ losange / ● rond) et **couleur** — dans le tableau (nouvelle colonne « Criticité ») et dans la légende | `index.html` + `styles.css` |
| Bonus audit | `scope="col"` sur les en-têtes de colonnes, `aria-hidden` sur les icônes décoratives, classe utilitaire `.sr-only`, `prefers-reduced-motion` respecté (animations coupées, y compris le flash des lignes injectées) | tous |

**Tester l'annonce vocale** : activer un lecteur d'écran (NVDA sous Windows,
VoiceOver sous macOS/iOS, TalkBack sous Android), puis cliquer sur
« + Simuler un événement » : l'événement est annoncé sans déplacer le focus.

### 3. Audit de performance (indicateurs Lighthouse)

Audit simulé sur build de production (Chrome DevTools → onglet Lighthouse →
mode mobile). Scores attendus et justifications :

| Indicateur | Score visé | Justifications techniques |
|---|---|---|
| Performance | 95–100 | Aucune image ; CSS/JS légers (< 25 Ko au total) et non minifiés mais très courts ; polices Google avec `preconnect` (connexion anticipée) et `display=swap` (texte visible pendant le chargement de la police) ; pas de librairie externe |
| Accessibilité | 95–100 | Contrastes conformes sur fond sombre, `lang="fr"`, labels reliés aux champs, rôles ARIA, double codage, `scope="col"`, reduced-motion |
| Bonnes pratiques | 100 | HTML5 valide, pas d'API dépréciée, pas d'erreur console, HTTPS via GitHub Pages |
| SEO | 90–100 | `<title>` descriptif, `meta description`, viewport correct, texte lisible |

Pour rejouer l'audit : ouvrir la page déployée dans Chrome → F12 →
onglet **Lighthouse** → cocher les 4 catégories → *Analyze page load*.

## Déploiement continu — GitHub Pages

### Premier déploiement

```bash
# 1. Initialiser le dépôt local à la racine du projet
git init
git add index.html styles.css script.js README.md
git commit -m "TP05: conformité WebView + accessibilité ARIA + livraison"

# 2. Créer un dépôt vide sur github.com (ex. soc-siem-dashboard), puis :
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/soc-siem-dashboard.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Build and deployment** →
Source : *Deploy from a branch* → Branch : `main` / `(root)` → **Save**.

La page est publiée sous ~1 minute à l'adresse :
`https://<votre-utilisateur>.github.io/soc-siem-dashboard/`

### Pipeline continu

Chaque `git push` sur `main` redéclenche automatiquement le déploiement
(workflow *pages-build-deployment* visible dans l'onglet **Actions**) :
c'est le déploiement continu demandé — aucune action manuelle après le push.

```bash
# Cycle de mise à jour type
git add -A
git commit -m "fix: contraste du badge warning"
git push        # → redéploiement automatique
```

### Points de vigilance

- Le fichier d'entrée **doit** s'appeler `index.html` (c'est lui que Pages sert à la racine).
- Liens **relatifs** uniquement (`styles.css`, `script.js`) : le site vit dans un
  sous-chemin (`/soc-siem-dashboard/`), un lien absolu `/styles.css` casserait.
- La casse des noms de fichiers compte : les serveurs de Pages sont sous Linux
  (`Styles.css` ≠ `styles.css`).
