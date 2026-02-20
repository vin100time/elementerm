# Design Thinking Session: Elementerm

**Date:** 2026-02-20
**Facilitateur:** Vince
**Design Challenge:** Orchestration cross-platform de sessions Claude Code multiples

---

## Design Challenge

### Contexte

Les developpeurs power users de Claude Code travaillent regulierement avec 5 a 10+ sessions simultanees, reparties sur plusieurs projets et worktrees git. Les outils existants (Claude Squad, Chloe, agentmux, etc.) tentent tous de reinventer le terminal ou de construire leur propre multiplexer, ajoutant de la complexite au lieu de la resoudre.

### Challenge Statement

**Comment concevoir un orchestrateur invisible qui donne aux developpeurs une vision instantanee de toutes leurs sessions Claude Code, sans jamais quitter leurs terminaux natifs, et sans reinventer un seul outil qui existe deja ?**

### Utilisateurs Cibles

- **Primaire :** Developpeurs individuels utilisant Claude Code intensivement (5+ sessions simultanees, multi-projets, multi-worktrees)
- **Secondaire :** Equipes de developpement utilisant Claude Code en parallele sur des projets partages

### Contraintes

- **Technique :** TypeScript/Node.js (ecosysteme Claude Code natif), zero dependance GUI, terminaux natifs uniquement
- **Philosophie :** "Quand on fait simple, on fait grand" - ne rien reinventer, orchestrer ce qui existe
- **Distribution :** Open source, `npm install -g elementerm`
- **Cross-platform :** Windows (Windows Terminal), macOS (Terminal.app/iTerm2), Linux (terminaux natifs)

### Criteres de Succes

- L'utilisateur sait en un coup d'oeil ou en est chaque session (statut, projet, worktree, dernier commit)
- L'utilisateur ne perd plus de temps a chercher "quel terminal fait quoi"
- L'outil s'efface : il ne force personne a changer ses habitudes, il les ameliore
- BMAD integre : les workflows structurent le travail sans overhead visible

---

## EMPATHIZE: Comprendre les Utilisateurs

### Methodes Utilisees

1. **Empathy Mapping** - Session interactive en Party Mode avec l'utilisateur primaire
2. **Journey Mapping** - Reconstitution du parcours type d'une session intensive
3. **Jobs to be Done** - Identification du job reel au-dela du besoin exprime

### Insights Utilisateurs

**Insight 1 : Le mur des 2 heures**
Apres environ 2h de travail multi-sessions / multi-projets, le cerveau atteint un point de saturation. L'utilisateur ne comprend plus ce qu'il ne comprend plus. Ce n'est pas un probleme de competence, c'est un probleme de bande passante cognitive. Trop de listes de check mentales, jamais visuelles.

**Insight 2 : Le paradoxe YOLO-Paralysie**
L'utilisateur oscille entre deux modes : le mode "YOLO" ou il avance vite sur tout en meme temps (SEO, backend, securite, optimisations), et le mode "paralysie" ou il se force a ralentir de peur de creer plus de problemes. Aucun des deux n'est optimal. Il manque un mode intermediaire : avancer vite AVEC visibilite.

**Insight 3 : Le multi-domaine amplifie le chaos**
Ce n'est pas juste multi-session, c'est multi-domaine. Une session fait du SEO, une autre du backend, une troisieme de la securite. Le cout du context-switch entre domaines est enorme. Le cerveau doit reconstruire le contexte a chaque fois qu'il regarde un terminal.

**Insight 4 : Les terminaux natifs sont non-negociables**
L'utilisateur a essaye d'autres solutions (Tabby, etc.) et revient toujours aux terminaux natifs. Ils sont simples, fiables, familiers. Tout outil qui demande d'abandonner le terminal natif sera rejete.

**Insight 5 : L'information existe, elle n'est juste nulle part visible**
Les commits, les branches, les worktrees, les statuts des sessions - tout ca existe dans git et dans Claude Code. Le probleme n'est pas l'absence d'info, c'est l'absence d'un endroit unique qui l'agrege et la rend visible d'un coup d'oeil.

### Observations Cles

| Observation | Implication Design |
|---|---|
| 4 ecrans utilises simultanement | Multi-fenetre est un BESOIN, pas un luxe |
| 2-3 features par projet, 2+ projets | Le multi-projet est le cas d'usage NORMAL |
| "Je marche au feeling, mode YOLO" | L'outil ne doit PAS imposer un process rigide |
| "Quand je veux y aller pour de vrai je me calme" | Le mode structure doit etre opt-in, pas par defaut |
| Bascule chaos apres ~2h | L'outil doit prevenir la surcharge, pas la guerir |
| SEO + backend + securite en parallele | Indicateurs de domaine/contexte par session |
| "Jamais visuel" | Le dashboard EST la valeur. Tout le reste est secondaire |
| Essaye et abandonne les outils complexes | La simplicite est un critere eliminatoire |

### Empathy Map

**DIT :**
- "Mon cerveau finit par se perdre"
- "Je suis pas le mec le plus organise"
- "C'est impossible de se rappeler de tout exactement"
- "Quand on fait simple on fait grand"
- "Un chef d'orchestre avec ton instrument prefere"
- "Au bout de 2h le cerveau dit stop"
- "Trop d'informations a gerer, trop de listes dans la tete, jamais visuel"

**PENSE :**
- "C'etait quelle fenetre deja ?"
- "Ou en est cette session, elle a fini ou pas ?"
- "Est-ce que j'ai deja commit sur ce worktree ?"
- "Si je switch sur autre chose pendant que ca mouline, je vais oublier de revenir"
- "Faut que je me calme sinon je vais faire des betises"

**FAIT :**
- Ouvre 5-10+ terminaux repartis sur 4 ecrans
- Travaille sur 2+ projets simultanement (2-3 worktrees chacun)
- Envoie un prompt, attend, switch sur une autre session
- Alt-tab entre les fenetres pour retrouver celle qui a fini
- Se force a ralentir quand le chaos devient ingerable
- Revient aux terminaux natifs apres avoir essaye des alternatives

**RESSENT :**
- Excitation du multi-tasking (c'est addictif)
- Frustration croissante quand la visibilite se perd
- Culpabilite de "creer du bruit et des betises"
- Satisfaction profonde quand tout avance en parallele et qu'on garde le controle
- Desir d'un outil qui l'aide sans le contraindre

### Journey Map - Session Type Intensive

```
PHASE 1 : LANCEMENT (0-30min)                    Humeur: 😊
├─ Ouvre le projet A, cree 2 worktrees
├─ Lance Claude Code dans chaque terminal
├─ Envoie les premiers prompts
├─ "Ca va, je gere, c'est clair"
│
PHASE 2 : MONTEE EN CHARGE (30min-1h)            Humeur: 😃
├─ Projet B s'ajoute, 2-3 worktrees de plus
├─ 5-6 terminaux ouverts, tout avance bien
├─ Switch fluide entre les sessions
├─ "Mode flow, c'est genial"
│
PHASE 3 : EMBALLEMENT (1h-1h30)                  Humeur: 😐
├─ Un truc urgent sur le SEO, encore un terminal
├─ Backend qui a besoin d'attention, securite aussi
├─ Les prompts moulinent, on switch, on oublie
├─ "Attends, elle a fini celle-la ?"
│
PHASE 4 : SATURATION (1h30-2h)                   Humeur: 😤
├─ 8-10 terminaux, plus de place mentale
├─ Impossible de se rappeler l'etat de chaque session
├─ Alt-tab frenetique, relecture du contexte
├─ "Stop, je comprends plus rien"
│
PHASE 5 : REPLI (2h+)                            Humeur: 😞
├─ Ferme des sessions pour "simplifier"
├─ Perd du travail ou du contexte en cours de route
├─ Se force a ne garder que 2-3 sessions
├─ "J'aurais pu faire tellement plus..."
```

### Jobs to be Done

**Job Principal :**
"Quand je travaille sur plusieurs features dans plusieurs projets en parallele, je veux pouvoir voir instantanement l'etat de chaque session pour ne jamais perdre le fil et rester dans le flow plus longtemps."

**Job Emotionnel :**
"Je veux me sentir en controle meme quand 10 choses avancent en meme temps, sans avoir a devenir quelqu'un de plus organise que je ne suis."

**Job Social :**
"Je veux pouvoir partager un outil qui resout un vrai probleme et que d'autres developpeurs reconnaissent cette galere commune."

---

## DEFINE: Cadrer le Probleme

### Systeme de Douleur

Les 5 insights ne sont pas des problemes isoles. Ils forment une boucle de renforcement :

```
L'info n'est nulle part visible
        │
        ▼
Le multi-domaine amplifie le chaos
        │
        ▼
Le cerveau compense en stockant tout mentalement
        │
        ▼
Saturation cognitive apres ~2h (le mur)
        │
        ▼
Oscillation YOLO ←→ Paralysie
        │
        ▼
Perte d'efficacite, fermeture de sessions, frustration
        │
        ▼
Retour au depart avec moins de sessions (= moins de valeur)
```

**La racine du systeme :** L'absence d'une couche de visibilite entre le developpeur et ses sessions. Tout le reste en decoule.

### Point of View Statement

**POV Principal :**
> Un developpeur power user de Claude Code qui travaille sur plusieurs projets et domaines en parallele **a besoin de** voir instantanement l'etat, le contexte et l'avancement de chacune de ses sessions **parce que** son cerveau ne peut pas stocker mentalement l'etat de 10 sessions simultanees et que chaque seconde passee a chercher "ou j'en suis" casse son flow et rapproche le mur de saturation.

**POV Emotionnel :**
> Un developpeur qui aime travailler vite et en mode flow **a besoin de** se sentir en controle sans effort conscient **parce que** l'alternative est de se forcer a etre "plus organise" - ce qui va contre sa nature et tue sa creativite.

**POV Outil :**
> Un utilisateur de terminaux natifs **a besoin de** garder ses outils familiers tout en gagnant une couche d'orchestration **parce que** chaque outil qui lui demande de changer ses habitudes finit abandonne.

### Questions "How Might We"

**HMW Core :**
1. Comment pourrait-on rendre l'etat de 10 sessions visible en un coup d'oeil sans que l'utilisateur ait a chercher ?
2. Comment pourrait-on repousser le "mur des 2h" en dechargeant la memoire de travail du developpeur ?
3. Comment pourrait-on permettre le mode "YOLO productif" - avancer vite sur tout AVEC un filet de securite visuel ?

**HMW Experience :**
4. Comment pourrait-on integrer l'orchestration dans les terminaux natifs sans que l'utilisateur ait l'impression d'utiliser un nouvel outil ?
5. Comment pourrait-on rendre le multi-domaine (SEO, backend, secu) lisible d'un regard grace a des indicateurs visuels ?
6. Comment pourrait-on faire en sorte que "revenir sur une session apres une pause" prenne 0 secondes de re-contextualisation ?

**HMW Architecture :**
7. Comment pourrait-on creer un daemon si leger qu'on oublie qu'il tourne ?
8. Comment pourrait-on exploiter ce que Claude Code expose deja (hooks, stream-json, session IDs) sans rien ajouter cote Claude ?
9. Comment pourrait-on rendre le dashboard aussi beau que fonctionnel dans un terminal natif ?

### Insights Cles - Opportunites

**Opportunite 1 : La memoire externalisee**
Le dashboard n'est pas un outil de monitoring. C'est une **extension de la memoire de travail**. Comme un carnet ouvert a cote du clavier, mais automatique. L'utilisateur n'a rien a ecrire, rien a mettre a jour. L'info est la, toujours, en temps reel.

**Opportunite 2 : Le "YOLO productif"**
Aujourd'hui l'utilisateur choisit entre vitesse (YOLO) et controle (paralysie). Elementerm cree un troisieme mode : aller vite avec un filet. Le dashboard est le filet. Tu avances sur tout en meme temps, et quand tu leves les yeux, tu sais exactement ou tu en es.

**Opportunite 3 : Le zero-config, zero-habitude**
L'outil le plus adopte est celui qu'on ne "decide" pas d'utiliser. Il est juste la. `elementerm start`, et c'est tout. Pas de YAML a ecrire, pas de workflow a apprendre, pas de terminaux a abandonner. Les terminaux natifs restent. Elementerm ajoute juste les yeux.

**Opportunite 4 : L'anti-scope comme avantage concurrentiel**
Tous les concurrents ajoutent des features (MCP, plugins, Telegram, web dashboard, autonomie IA). Elementerm fait l'inverse : il n'ajoute RIEN. Il rend visible ce qui existe deja. Moins de features = plus de clarte = meilleure adoption.

### Hypotheses a Valider

| Hypothese | Risque si faux | Comment tester |
|---|---|---|
| Un dashboard TUI suffit (pas besoin de GUI) | Les power users veulent plus de richesse visuelle | Prototype Ink, tester sur 4 ecrans |
| Les hooks Claude Code fournissent assez de donnees temps reel | Le dashboard est en retard sur la realite | Prototype avec hooks reels |
| `wt.exe` / `open -a Terminal` fonctionnent de maniere fiable cross-platform | Le spawn de terminaux natifs est fragile | Tests sur Win/Mac/Linux |
| Les devs veulent un orchestrateur passif (visibilite) pas actif (controle) | Les utilisateurs veulent que le master prenne des decisions | Interviews utilisateurs |
| npm install -g est acceptable comme methode d'installation | Les devs Rust/Go preferent un binaire unique | Feedback communaute |

---

## IDEATE: Generer des Solutions

### Methodes Selectionnees

1. **Crazy 8s** - 8 variations du dashboard et de l'interaction
2. **SCAMPER** - Lentilles d'innovation appliquees aux outils existants
3. **Analogous Inspiration** - Domaines exterieurs (aviation, trading, musique, gaming)

### Principe Directeur : Progressive Disclosure

L'utilisateur a exprime le besoin d'un systeme adaptable : ni trop dense ni trop vide. La reponse est le **progressive disclosure** - 3 niveaux de zoom :

```
NIVEAU 1 : GLANCE (coup d'oeil)          ← couleurs, icones, 0 texte
NIVEAU 2 : SCAN (lecture rapide)          ← statuts, branches, derniere action
NIVEAU 3 : FOCUS (detail complet)        ← output session, historique, contexte
```

L'utilisateur passe d'un niveau a l'autre par une simple touche ou un clic.

### Idees Generees

#### A. Dashboard - Layout & Niveaux de Zoom

**A1. Vue Glance - Le Radar**
Chaque session est un bloc de couleur minimaliste. Vert/jaune/rouge. Nom du projet + worktree. Rien d'autre. Le cerveau capte en 200ms l'etat global.
```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 🟢 │ │ 🟡 │ │ 🟢 │ │ 🔴 │ │ 🟢 │
│auth│ │ api│ │seo │ │front│ │test│
│ A  │ │ A  │ │ B  │ │ B  │ │ B  │
└────┘ └────┘ └────┘ └────┘ └────┘
```

**A2. Vue Scan - Le Tableau de Bord**
Chaque session montre son statut semantique, sa branche, sa derniere action. Assez pour savoir ou en est chaque session sans zoomer.
```
┌─ Projet A ──────────────────┐ ┌─ Projet B ──────────────────┐
│ 🟢 auth    feat/login       │ │ 🔴 front   fix/header       │
│   commit: "add form" 3min   │ │   ERREUR: build failed      │
│ 🟡 api     feat/endpoints   │ │ 🟢 seo     opt/meta         │
│   attend reponse Claude...  │ │   commit: "meta tags" 1min  │
└─────────────────────────────┘ │ 🟢 test    test/e2e          │
                                │   12/12 tests pass           │
                                └─────────────────────────────┘
```

**A3. Vue Focus - Le Plongeon**
Une session prend tout l'ecran du dashboard. On voit les derniers echanges, l'historique des commits, le diff en cours, les fichiers modifies.

**A4. Vue Timeline**
Au lieu de blocs, une ligne temporelle horizontale par session. On voit l'activite dans le temps : quand les commits sont arrives, quand les prompts ont ete envoyes, les periodes d'attente.

**A5. Vue Kanban**
Sessions organisees en colonnes : "En attente" / "En cours" / "A revoir" / "Termine". Le deplacement est automatique base sur les hooks.

#### B. Statuts Semantiques

**B1. Statuts Orientes Developpeur**
Pas "running/stopped" mais des statuts que le dev comprend instantanement :
- 🟢 **Flow** - Claude travaille, tout va bien
- 🟡 **Attend** - Prompt envoye, attend la reponse
- 🔵 **Pret** - Session terminee, attend votre input
- 🟠 **Attention** - Warning, conflit ou erreur non-bloquante
- 🔴 **Bloque** - Erreur, conflit merge, build fail
- ⚪ **Idle** - Session inactive depuis longtemps

**B2. Indicateurs de Domaine**
Badges visuels par domaine de travail :
`[SEO]` `[BACK]` `[FRONT]` `[SEC]` `[TEST]` `[INFRA]` `[DOC]`
Detection automatique basee sur les fichiers modifies et les prompts.

**B3. Indicateur de Fraicheur**
"il y a 2min" / "il y a 15min" / "il y a 1h" - pour savoir instantanement quelles sessions sont actives vs endormies.

#### C. Interaction & Navigation

**C1. Raccourcis Clavier Rapides**
- `Tab` : cycle entre sessions
- `1-9` : jump direct a la session N
- `Enter` : zoom/dezoom (toggle Focus)
- `g` : vue Glance
- `s` : vue Scan
- `f` : vue Focus sur la session selectionnee
- `n` : nouvelle session (prompt projet + worktree)
- `q` : quitter le dashboard (les sessions continuent)

**C2. Focus Automatique**
Quand une session change de statut (termine, erreur), le dashboard la met en surbrillance brievement. L'utilisateur sait qu'il s'est passe quelque chose sans avoir a scanner.

**C3. Ouverture Terminal Natif**
Depuis le dashboard, appuyer sur `o` ouvre le terminal natif correspondant a la session selectionnee. Si le terminal existe deja, il est amene au premier plan.

**C4. Quick Actions depuis le Dashboard**
Sans quitter le dashboard, pouvoir :
- Voir le dernier output d'une session (dans le focus)
- Relancer une session qui a plante
- Envoyer un prompt rapide a une session

#### D. Spawn & Gestion des Terminaux

**D1. Launch Profiles**
Sauvegarder des configurations de lancement :
```bash
elementerm launch daily
# → Ouvre Projet A (auth + api) + Projet B (front + seo)
# → 4 terminaux natifs + 1 dashboard, positions memorisees
```

**D2. Smart Layout**
Elementerm detecte le nombre d'ecrans et propose un layout adapte :
- 1 ecran : dashboard seul, terminaux en alt-tab
- 2 ecrans : dashboard a gauche, terminaux a droite
- 4 ecrans : dashboard sur un, sessions reparties sur les 3 autres

**D3. Session Recycling**
Quand une session finit sa tache, proposer automatiquement de la reassigner a la prochaine tache dans la liste BMAD, au lieu de la fermer.

#### E. Intelligence & Coordination

**E1. Conflit Watch**
Le daemon surveille les fichiers modifies par chaque session. Si deux sessions touchent le meme fichier dans deux worktrees, notification immediate.

**E2. Resume Contextuel**
Quand l'utilisateur revient sur une session apres une pause, le dashboard affiche un resume d'une ligne de ce qui s'est passe : "3 commits, 12 fichiers modifies, dernier : refactor auth middleware".

**E3. Suggestion de Priorite**
Basee sur les statuts : "Session front est bloquee depuis 10min - voulez-vous intervenir ?" Suggestion, jamais imposition.

**E4. Export de Session**
`elementerm report` genere un resume markdown de toute la journee : quels projets, quelles features, quels commits, quelle progression. Utile pour les standups ou le suivi perso.

#### F. BMAD Integration

**F1. Workflow Status**
Si une session execute un workflow BMAD, le dashboard montre l'etape en cours du workflow.

**F2. Dispatch de Taches**
Le dashboard affiche les taches BMAD en attente. L'utilisateur assigne une tache a une session (existante ou nouvelle) directement depuis le dashboard.

**F3. Session Templates**
Des templates pre-configures avec le bon CLAUDE.md, les bons skills, les bonnes instructions pour chaque type de tache (SEO, securite, backend, etc.).

#### G. Inspirations Analogiques

**G1. Controle Aerien** → Vue radar (Glance) + strips de vol (Scan) + contact radio (Focus)
**G2. Trading Desk** → Watchlist avec couleurs + alertes sur mouvement + drill-down sur instrument
**G3. Studio Musique** → Mixer avec faders (sessions) + VU-metres (activite) + solo/mute (focus/pause)
**G4. Jeu Video RTS** → Minimap (Glance) + selection d'unite (Focus) + groupes de controle (Launch Profiles)

### Concepts Retenus - Top 3

#### Concept 1 : "Le Cockpit a 3 Niveaux"

Le dashboard avec progressive disclosure : Glance → Scan → Focus, pilote par des raccourcis clavier simples. C'est le coeur du produit. Combine les idees A1, A2, A3, C1, C2.

**Pourquoi :** Repond directement au besoin "ni trop ni pas assez". L'utilisateur choisit sa profondeur d'info a chaque instant. Le niveau Glance est toujours la comme filet de securite.

#### Concept 2 : "Le Daemon Invisible"

Un process background qui fait tout le travail sale : hooks Claude Code, file watching, detection de conflits, tracking des statuts. L'utilisateur ne le voit jamais, ne le configure jamais. Il fournit les donnees au dashboard. Combine les idees E1, E2, B1, B3.

**Pourquoi :** Separation claire entre l'intelligence (daemon) et la presentation (dashboard). Le daemon peut evoluer sans changer le dashboard et vice versa.

#### Concept 3 : "Launch & Forget"

Les commandes `elementerm launch daily` et `elementerm session new` qui spawent les terminaux natifs, creent les worktrees, configurent les hooks, et branchent tout au daemon. En une commande. Combine les idees D1, D2, C3, F3.

**Pourquoi :** La friction au demarrage doit etre zero. Si l'utilisateur doit passer 5 minutes a configurer ses sessions chaque matin, il finira par ne plus utiliser l'outil.

#### Concept 4 : "Le Boss Mode" - Gouvernance par le Cadre

**L'insight fondamental :** Ce qui change le resultat, ce n'est pas la generation du code. C'est la CLARTE des instructions. BMAD guide, berce, encadre. Les tests en masse valident nativement. Le projet reste propre : guidelines, patterns, code maintenu, documentation. L'utilisateur est le boss, les sessions IA travaillent pour lui, A SES CONDITIONS, DANS SON CADRE.

**Ce que ca change pour Elementerm :**

Elementerm n'est pas juste un dashboard de visibilite. C'est un **systeme de gouvernance** qui reproduit ce que fait une equipe de dev humaine bien geree, mais adaptee a l'IA :

```
EQUIPE HUMAINE                    ELEMENTERM
─────────────────                 ─────────────────
Tech Lead qui cadre           →   BMAD Master + CLAUDE.md par session
Code reviews                  →   Tests automatises + validation BMAD
Guidelines d'equipe           →   Templates de session + rules
Standups / statuts            →   Dashboard temps reel
QA qui valide                 →   Tests en masse natifs, CI integre
Chef de projet qui priorise   →   L'utilisateur dans le dashboard
```

**Les 3 piliers du Boss Mode :**

1. **Cadrage** - Chaque session demarre avec un CLAUDE.md clair, des rules, un scope defini. Le dev ne "lance pas Claude et espere". Il definit le cadre, et Claude travaille dedans.

2. **Validation** - Tests pousses a l'extreme. BMAD valide le resultat attendu (le QUOI). Les tests en masse valident le fonctionnement (le COMMENT). Rien ne passe sans validation. Le projet est toujours en etat propre.

3. **Controle** - L'utilisateur voit tout, decide tout, mais ne fait pas le travail lui-meme. Il orchestre. Il approve. Il redirige. Comme un boss avec une equipe qui bosse bien.

**Pourquoi c'est le vrai differenciateur :**

Les concurrents se concentrent sur "lancer plus de sessions" ou "automatiser plus de choses". Ils oublient que PLUS de sessions sans CADRE = PLUS de chaos. Elementerm fait l'inverse : chaque session est CADREE avant d'etre lancee, VALIDEE pendant qu'elle tourne, et VERIFIEE quand elle finit. La quantite vient APRES la qualite.

**Impact sur le produit :**

| Fonctionnalite | Role dans le Boss Mode |
|---|---|
| Session Templates | Cadrage : chaque session demarre avec les bonnes regles |
| BMAD Workflows | Cadrage : processus structures, pas du freestyle |
| Dashboard statuts | Controle : vision temps reel sans effort |
| Test integration | Validation : rien ne passe sans tests verts |
| Conflit Watch | Validation : prevention proactive des problemes |
| Export/Report | Controle : traçabilite de tout ce qui a ete fait |
| Quick Actions | Controle : intervenir sans quitter le cockpit |

---

## PROTOTYPE: Rendre les Idees Tangibles

### Approche Prototype

**Type :** Tranche horizontale fine - toute la chaine de bout en bout, en version minimale.

**Justification :** Les composants sont interdependants. Le dashboard a besoin du daemon pour ses donnees, le daemon a besoin de sessions a surveiller, les sessions ont besoin d'etre spawned. Il faut la chaine complete, meme si chaque maillon est minimal.

**Methode :** Prototype fonctionnel dans le medium final (le terminal). Pas de mockup statique. Du code qui tourne.

### Description du Prototype - "MVP Zero"

#### Architecture Minimale

```
elementerm (npm package)
│
├── bin/
│   └── elementerm.js              ← Point d'entree CLI
│
├── src/
│   ├── daemon/
│   │   ├── index.ts               ← Process daemon (background)
│   │   ├── session-manager.ts     ← Cree/suit les sessions
│   │   ├── state-store.ts         ← Etat JSON sur disque
│   │   └── hook-handler.ts        ← Recoit les events des hooks
│   │
│   ├── dashboard/
│   │   ├── app.tsx                ← Composant Ink racine
│   │   ├── views/
│   │   │   ├── glance.tsx         ← Vue radar minimaliste
│   │   │   ├── scan.tsx           ← Vue tableau de bord
│   │   │   └── focus.tsx          ← Vue detail session
│   │   └── components/
│   │       ├── session-card.tsx   ← Carte de session
│   │       ├── status-badge.tsx   ← Badge de statut colore
│   │       └── project-group.tsx  ← Groupe par projet
│   │
│   ├── spawner/
│   │   ├── index.ts               ← Detecte l'OS et le terminal
│   │   ├── windows.ts             ← wt.exe
│   │   ├── macos.ts               ← open -a Terminal / osascript
│   │   └── linux.ts               ← x-terminal-emulator
│   │
│   └── cli/
│       └── commands.ts            ← Commandes CLI (start, dash, launch, status)
│
├── hooks/
│   └── elementerm-hook.js         ← Hook Claude Code installe dans chaque session
│
└── package.json
```

#### Les 5 Commandes du MVP

```bash
# 1. Demarre le daemon en background
elementerm start
# → Lance le daemon, cree ~/.elementerm/, initialise le state store
# → Affiche : "Elementerm daemon demarre. PID: 12345"

# 2. Ouvre le dashboard dans le terminal courant
elementerm dash
# → TUI Ink, se connecte au daemon via IPC
# → Affiche les sessions en cours (ou "Aucune session")
# → Raccourcis : g(lance) s(can) f(ocus) n(ew) o(pen) q(uit)

# 3. Cree et lance une nouvelle session
elementerm new --project monprojet --worktree feat-auth
# → Cree le git worktree si necessaire
# → Installe le hook elementerm dans le worktree
# → Ouvre un terminal natif avec claude dans le bon worktree
# → Le daemon commence a tracker cette session

# 4. Affiche un statut rapide (sans dashboard)
elementerm status
# → Liste toutes les sessions avec leur statut actuel
# → Utilisable depuis n'importe quel terminal, meme sans dashboard

# 5. Arrete tout proprement
elementerm stop
# → Notifie les sessions actives
# → Arrete le daemon
```

#### Mockups ASCII des 3 Vues

**Vue Glance (touche `g`) :**
```
╔══════════════════════════════════════════════════════════╗
║  ELEMENTERM                          5 sessions | 2h12  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   monprojet                    clientXYZ                 ║
║   ┌────┐ ┌────┐ ┌────┐       ┌────┐ ┌────┐             ║
║   │ 🟢 │ │ 🟡 │ │ 🟢 │       │ 🔴 │ │ 🟢 │             ║
║   │auth│ │ api│ │test│       │front│ │ seo│             ║
║   └────┘ └────┘ └────┘       └────┘ └────┘             ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  [g]lance [s]can [f]ocus [n]ew [o]pen [q]uit            ║
╚══════════════════════════════════════════════════════════╝
```

**Vue Scan (touche `s`) :**
```
╔══════════════════════════════════════════════════════════╗
║  ELEMENTERM                          5 sessions | 2h12  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌─ monprojet ──────────────────────────────────────┐   ║
║  │ 🟢 auth  [BACK]  feat/login    "add form"   3min │   ║
║  │ 🟡 api   [BACK]  feat/api      attend...   12min │   ║
║  │ 🟢 test  [TEST]  test/e2e      12/12 pass   1min │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                          ║
║  ┌─ clientXYZ ──────────────────────────────────────┐   ║
║  │ 🔴 front [FRONT] fix/header    BUILD FAIL   8min │   ║
║  │ 🟢 seo   [SEO]   opt/meta     "meta tags"  1min │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                          ║
║  > session selectionnee: auth                            ║
╠══════════════════════════════════════════════════════════╣
║  [g]lance [s]can [f]ocus [n]ew [o]pen [q]uit            ║
╚══════════════════════════════════════════════════════════╝
```

**Vue Focus (touche `f` sur session selectionnee) :**
```
╔══════════════════════════════════════════════════════════╗
║  ELEMENTERM > monprojet > auth                    2h12  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Statut: 🟢 Flow    Branche: feat/login                 ║
║  Worktree: ~/monprojet/.claude/worktrees/auth            ║
║  Domaine: [BACK]    Duree session: 47min                 ║
║                                                          ║
║  ── Derniers Commits ──────────────────────────────────  ║
║  • abc1234  "add login form component"           3min    ║
║  • def5678  "add auth middleware"                22min    ║
║  • ghi9012  "init auth module"                  45min    ║
║                                                          ║
║  ── Fichiers Modifies (depuis dernier commit) ─────────  ║
║  M  src/auth/login.ts                                    ║
║  M  src/auth/middleware.ts                               ║
║  A  src/auth/__tests__/login.test.ts                     ║
║                                                          ║
║  ── Dernier Output Claude ─────────────────────────────  ║
║  "J'ai ajoute les tests unitaires pour le composant      ║
║   login. 8 tests passent. Voulez-vous que j'ajoute..."   ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  [Esc] retour  [o]pen terminal  [r]elancer  [q]uit      ║
╚══════════════════════════════════════════════════════════╝
```

#### Le Hook - Le Lien entre Sessions et Daemon

Le hook est un petit script installe dans chaque worktree qui reporte au daemon :

```javascript
// hooks/elementerm-hook.js
// Installe comme hook Claude Code PostToolUse + Stop + SessionEnd

const fs = require('fs');
const net = require('net');

// Recoit le JSON de Claude Code sur stdin
const input = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));

// Envoie au daemon via named pipe
const client = net.connect(process.env.ELEMENTERM_SOCKET);
client.write(JSON.stringify({
  session_id: input.session_id,
  event: process.env.HOOK_EVENT, // PostToolUse, Stop, SessionEnd
  tool: input.tool_name,
  file: input.file_path,
  timestamp: Date.now()
}));
client.end();
```

Configure automatiquement dans `.claude/settings.json` du worktree :
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write|Bash",
      "command": "node ~/.elementerm/hooks/elementerm-hook.js",
      "async": true
    }],
    "Stop": [{
      "command": "HOOK_EVENT=Stop node ~/.elementerm/hooks/elementerm-hook.js"
    }]
  }
}
```

#### State Store - Le Fichier Central

```
~/.elementerm/
├── daemon.pid                    ← PID du daemon pour IPC
├── elementerm.sock               ← Named pipe / Unix socket
├── state.json                    ← Etat central de toutes les sessions
├── hooks/
│   └── elementerm-hook.js        ← Hook installe dans les worktrees
└── profiles/
    └── daily.json                ← Launch profiles sauvegardes
```

Contenu de `state.json` :
```json
{
  "sessions": {
    "sess_abc123": {
      "project": "monprojet",
      "worktree": "auth",
      "branch": "feat/login",
      "status": "flow",
      "domain": "BACK",
      "last_commit": { "hash": "abc1234", "msg": "add login form", "ago": "3min" },
      "last_activity": "2026-02-20T15:32:00Z",
      "files_modified": ["src/auth/login.ts"],
      "terminal_pid": 54321,
      "claude_session_id": "claude_xyz789"
    }
  },
  "projects": {
    "monprojet": { "path": "/home/vince/monprojet", "sessions": ["sess_abc123"] },
    "clientXYZ": { "path": "/home/vince/clientXYZ", "sessions": [] }
  }
}
```

### Fonctionnalites a Tester

| Ce qu'on teste | Question a valider | Comment on le sait |
|---|---|---|
| Dashboard 3 niveaux | Le progressive disclosure Glance→Scan→Focus est-il intuitif ? | L'utilisateur navigue sans lire de doc |
| Statuts semantiques | Les couleurs + statuts suffisent-ils a comprendre l'etat ? | Coup d'oeil de 2 secondes = comprehension |
| Spawn terminal natif | `wt.exe` / `Terminal.app` sont-ils fiables cross-platform ? | 10 lancements = 10 succes |
| Hooks temps reel | Les hooks Claude Code fournissent-ils les donnees assez vite ? | Delai < 2 secondes entre action et affichage |
| State store JSON | Le fichier JSON tient-il la charge de 10 sessions ? | Pas de corruption ni de lag |
| IPC daemon↔dashboard | La communication named pipe est-elle stable ? | Pas de deconnexion sur 2h de session |
| Boss Mode (cadrage) | Le CLAUDE.md injecte change-t-il la qualite des sessions ? | Comparaison avec/sans CLAUDE.md template |

### Ce qu'on Fake vs Ce qu'on Construit

| Composant | MVP Zero | Fake pour l'instant |
|---|---|---|
| Daemon | Construit - process Node.js background | - |
| State store | Construit - fichier JSON + file watcher | - |
| Dashboard TUI | Construit - Ink avec les 3 vues | - |
| Hooks | Construit - script JS minimal | - |
| IPC | Construit - named pipes Node.js net | - |
| Spawn terminal | Construit - Windows d'abord (wt.exe) | Mac/Linux apres |
| Statuts semantiques | Construit - base sur les hooks | Detection de domaine auto |
| BMAD integration | Fake - statut de workflow en dur | Integration reelle plus tard |
| Conflit watch | Fake - pas dans le MVP | Ajout post-MVP |
| Launch profiles | Fake - pas dans le MVP | Ajout post-MVP |
| Smart layout | Fake - pas dans le MVP | Ajout post-MVP |
| Export/Report | Fake - pas dans le MVP | Ajout post-MVP |

---

## TEST: Valider avec les Utilisateurs

### Strategie de Validation

**Phase 1 : Dogfooding Pur (Vince seul)**
Le createur est l'utilisateur #1. Avant de montrer quoi que ce soit au monde, Elementerm doit survivre a une vraie journee de travail de Vince. Si le createur n'utilise pas son propre outil, personne ne le fera.

**Phase 2 : Early Feedback (3-5 devs)**
Partager le MVP avec quelques developpeurs power users de Claude Code. Pas un lancement public. Des gens qui ont le meme probleme et qui peuvent donner un feedback constructif.

**Phase 3 : Lancement Open Source**
GitHub public, README solide, GIF de demo. Laisser la communaute decouvrir, tester, contribuer.

### Plan de Test - Phase 1 : Dogfooding

#### Scenario 1 : "La Journee Type"

**Objectif :** Valider que Elementerm tient sur une session de travail complete (2-4h)

**Setup :**
- 2 projets reels de Vince
- 4-6 sessions Claude Code reparties sur les projets
- Multi-domaine (backend, SEO, tests, securite)
- 4 ecrans

**Taches a realiser :**
1. `elementerm start` → Le daemon demarre-t-il sans friction ?
2. `elementerm dash` → Le dashboard s'affiche-t-il correctement ?
3. Lancer 4 sessions via `elementerm new` → Les terminaux natifs s'ouvrent-ils ?
4. Travailler normalement pendant 1h → Les statuts se mettent-ils a jour ?
5. Naviguer Glance → Scan → Focus → Les transitions sont-elles fluides ?
6. Ouvrir un terminal depuis le dashboard (`o`) → Le bon terminal s'ouvre-t-il ?
7. Laisser tourner 2h → Stabilite du daemon et de l'IPC ?
8. `elementerm stop` → Tout s'arrete-t-il proprement ?

**Metriques a capturer :**
- Nombre de fois ou Vince regarde le dashboard vs alt-tab dans ses terminaux
- Moment ou le "mur" arrive (si il arrive)
- Bugs et crashes rencontres
- Moments de frustration ou de satisfaction

#### Scenario 2 : "Le Chaos Controle"

**Objectif :** Valider que le dashboard reste lisible quand ca s'emballe

**Setup :**
- Monter progressivement de 2 a 8 sessions
- Varier les statuts (certaines en attente, d'autres actives, une en erreur)
- Simuler le moment de bascule habituel (~1h30-2h)

**Questions cles :**
- A partir de combien de sessions la vue Glance devient-elle confuse ?
- La vue Scan est-elle lisible avec 8 sessions ?
- Les couleurs de statut sont-elles suffisantes pour distinguer l'etat ?
- Le focus automatique (surbrillance sur changement de statut) est-il utile ou distrayant ?

#### Scenario 3 : "Le Retour de Pause"

**Objectif :** Valider le re-contextualisation zero-effort

**Setup :**
- Lancer 5 sessions, travailler 30min
- Quitter le bureau (pause cafe, reunion, etc.)
- Revenir et ouvrir le dashboard

**Questions cles :**
- En combien de secondes Vince sait-il ou en est chaque session ?
- La vue Scan donne-t-elle assez d'info pour reprendre sans cliquer ?
- Le "dernier commit + temps" est-il suffisant comme resume ?

#### Scenario 4 : "Le Boss Mode"

**Objectif :** Valider que le cadrage CLAUDE.md ameliore la qualite des sessions

**Setup :**
- 2 sessions identiques sur la meme tache
- Session A : lancee avec un CLAUDE.md template Elementerm (cadrage, rules, scope)
- Session B : lancee sans cadrage (claude brut)

**Questions cles :**
- La session cadree produit-elle un meilleur resultat ?
- Le cadrage ralentit-il le demarrage de maniere genante ?
- Les templates de session sont-ils assez generiques pour etre reutilisables ?

### Grille de Capture de Feedback

Pour chaque scenario, capturer dans 4 colonnes :

| J'ai aime | Questions que j'ai eues | Idees que ca m'a donne | A changer absolument |
|---|---|---|---|
| (ce qui marche bien) | (ce qui n'etait pas clair) | (nouvelles features/ameliorations) | (ce qui est casse ou frustrant) |

### Criteres de Validation - Go / No-Go

**GO pour Phase 2 (early feedback) si :**
- [ ] Le daemon tourne 2h sans crash
- [ ] Le dashboard affiche des statuts corrects en temps reel (delai < 3s)
- [ ] Les 3 vues (Glance/Scan/Focus) sont navigables sans documentation
- [ ] Le spawn de terminal natif fonctionne 9 fois sur 10
- [ ] Vince utilise le dashboard AU LIEU de alt-tab pour checker ses sessions
- [ ] Vince veut continuer a utiliser l'outil le lendemain

**GO pour Phase 3 (open source) si :**
- [ ] 3+ testeurs early confirment la valeur du dashboard
- [ ] Cross-platform valide (au moins Windows + 1 autre OS)
- [ ] README clair avec GIF de demo
- [ ] Installation en une commande (`npm install -g elementerm`)
- [ ] Zero config requise pour demarrer

### Hypotheses a Valider par Priorite

| Priorite | Hypothese | Si VRAI → | Si FAUX → |
|---|---|---|---|
| P0 | Le dashboard TUI remplace le alt-tab mental | On continue | Repenser le format (GUI? web?) |
| P0 | Les hooks donnent assez de donnees | On continue | Explorer l'Agent SDK ou le stream-json |
| P1 | 3 niveaux de zoom est le bon nombre | On continue | Tester 2 niveaux ou un zoom continu |
| P1 | Les statuts semantiques sont compris instantanement | On continue | Tester d'autres metaphores visuelles |
| P2 | Le spawn terminal natif est fiable | On continue | Fallback vers des instructions manuelles |
| P2 | Le Boss Mode ameliore la qualite | On integre au coeur | On le rend optionnel |

### Retours Utilisateurs

_A remplir apres les tests du MVP Zero_

### Apprentissages Cles

_A remplir apres les tests du MVP Zero_

---

## Prochaines Etapes

### Ce qui est Clair vs Ce qui Reste a Explorer

**Clair - On avance :**
- La vision : daemon invisible + dashboard TUI + terminaux natifs
- La stack : TypeScript / Node.js / Ink
- Le differentateur : orchestrer sans reinventer + Boss Mode
- L'utilisateur cible : dev power user Claude Code multi-sessions
- Le modele : open source, dogfooding first
- Les 3 vues : Glance / Scan / Focus
- L'architecture : daemon + IPC + hooks + state JSON

**A explorer pendant le build :**
- Le format exact du hook (quelle data envoyer, quel volume)
- La fiabilite du spawn terminal natif sur chaque OS
- Le bon nombre d'infos par vue (iterer en testant)
- L'integration BMAD concrete (apres le MVP Zero)
- La detection automatique de domaine (BACK/FRONT/SEO/etc.)

### Actions - Roadmap MVP Zero

#### Phase 0 : Setup Projet

- [ ] Initialiser le repo git `elementerm`
- [ ] Setup TypeScript + ESLint + structure de dossiers
- [ ] package.json avec bin entry point
- [ ] CLAUDE.md du projet (le Boss Mode applique a soi-meme)
- [ ] README minimal avec la vision en 3 phrases

#### Phase 1 : Le Daemon

- [ ] Process Node.js qui tourne en background (daemonize)
- [ ] State store : lecture/ecriture de `~/.elementerm/state.json`
- [ ] Serveur IPC via `net.createServer` (named pipe Windows / Unix socket)
- [ ] Gestion du PID file pour eviter les doublons
- [ ] Commandes CLI : `elementerm start` et `elementerm stop`

#### Phase 2 : Les Hooks

- [ ] Script hook `elementerm-hook.js` minimal
- [ ] Connexion au daemon via named pipe
- [ ] Events supportes : PostToolUse (Edit/Write), Stop, SessionEnd
- [ ] Installation automatique du hook dans `.claude/settings.json` d'un worktree
- [ ] Test : lancer une session Claude Code, verifier que les events arrivent au daemon

#### Phase 3 : Le Spawner

- [ ] Detection de l'OS (`process.platform`)
- [ ] Windows : spawn via `wt.exe` (nouvel onglet ou nouvelle fenetre)
- [ ] Enregistrement du PID du terminal spawne
- [ ] Creation automatique du git worktree si necessaire
- [ ] Injection du CLAUDE.md template dans le worktree
- [ ] Commande CLI : `elementerm new --project X --worktree Y`

#### Phase 4 : Le Dashboard

- [ ] App Ink de base avec layout et raccourcis clavier
- [ ] Vue Glance : blocs de couleur par session, groupes par projet
- [ ] Vue Scan : statut, branche, dernier commit, fraicheur
- [ ] Vue Focus : detail session, commits, fichiers modifies, dernier output
- [ ] Navigation : `g` / `s` / `f` / `Tab` / `1-9` / `Esc`
- [ ] Connexion IPC au daemon pour recevoir les mises a jour temps reel
- [ ] Commande CLI : `elementerm dash`

#### Phase 5 : Integration & Polish

- [ ] Commande `elementerm status` (vue rapide sans dashboard)
- [ ] Ouverture terminal depuis le dashboard (`o` → amene le terminal au focus)
- [ ] Gestion propre de l'arret (`elementerm stop` notifie tout)
- [ ] Gestion des erreurs (daemon deja lance, session qui crash, etc.)
- [ ] Tests unitaires sur le state store et le hook handler

#### Phase 6 : Dogfooding

- [ ] Vince utilise Elementerm pendant 1 semaine sur ses vrais projets
- [ ] Capture des feedbacks via la grille (aime / questions / idees / a changer)
- [ ] Iteration rapide sur les irritants majeurs
- [ ] Validation des criteres Go/No-Go Phase 2

### Metriques de Succes

#### Succes Technique (MVP Zero)

| Metrique | Cible |
|---|---|
| Daemon uptime sans crash | > 4h continues |
| Delai hook → dashboard | < 3 secondes |
| Spawn terminal natif reussi | > 95% |
| Taille du package npm | < 5 MB |
| Temps d'installation | < 30 secondes |
| Temps de demarrage (`elementerm start`) | < 2 secondes |

#### Succes Utilisateur (Dogfooding)

| Metrique | Cible |
|---|---|
| Vince utilise le dashboard au lieu de alt-tab | > 80% du temps |
| Le "mur des 2h" est repousse | Gain de 30min+ |
| Re-contextualisation apres pause | < 5 secondes |
| Vince veut utiliser l'outil le lendemain | Oui |
| Nombre de sessions gerees confortablement | 6+ (vs 3-4 aujourd'hui) |

#### Succes Communaute (Post-launch)

| Metrique | Cible |
|---|---|
| GitHub stars 1er mois | > 100 |
| Issues ouvertes par la communaute | > 10 (signe d'interet) |
| Contributeurs externes | > 2 |
| Mentions sur Twitter/Reddit/HN | > 5 |

### Cycle Suivant du Design Thinking

Apres le MVP Zero et le dogfooding, les prochaines iterations porteront sur :

1. **Cross-platform** - Tester et stabiliser macOS + Linux
2. **BMAD Integration** - Connecter les workflows BMAD au dashboard
3. **Boss Mode complet** - Templates de session, validation automatique, test integration
4. **Launch Profiles** - Sauvegarder et rejouer des configurations multi-sessions
5. **Conflit Watch** - Detection proactive des conflits entre sessions
6. **Export/Report** - Resume de journee pour standups et suivi personnel

---

_Document genere avec BMAD Creative Intelligence Suite - Workflow Design Thinking_
