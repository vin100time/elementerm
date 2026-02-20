# PRD - Elementerm

**Version :** 1.0
**Date :** 2026-02-20
**Auteur :** Vince
**Statut :** Draft

---

## 1. Vision

> **Elementerm est le chef d'orchestre des sessions Claude Code.**
>
> Un daemon leger qui coordonne vos sessions a travers vos terminaux natifs.
> Un dashboard TUI qui vous donne la vue d'ensemble.
> N'invente rien. Orchestre tout.
> Remplace la memoire par la vision.
>
> *"Quand on fait simple, on fait grand."*

---

## 2. Probleme

### Le Constat

Les developpeurs power users de Claude Code travaillent avec 5 a 10+ sessions simultanees, reparties sur plusieurs projets et worktrees git, couvrant des domaines differents (backend, SEO, securite, tests, frontend). Apres environ 2 heures, la surcharge cognitive rend le travail inefficace : impossible de se rappeler l'etat de chaque session, alt-tab frenetique, perte de contexte, erreurs.

### Le Systeme de Douleur

```
L'info n'est nulle part visible
        |
        v
Le multi-domaine amplifie le chaos
        |
        v
Le cerveau compense en stockant tout mentalement
        |
        v
Saturation cognitive apres ~2h (le mur)
        |
        v
Oscillation YOLO <-> Paralysie
        |
        v
Perte d'efficacite, fermeture de sessions, frustration
```

**La racine :** L'absence d'une couche de visibilite entre le developpeur et ses sessions.

### Pourquoi les Solutions Existantes Echouent

| Outil | Probleme |
|---|---|
| Claude Squad | Depend de tmux, pas de Windows natif |
| Chloe | Construit son propre multiplexer TUI |
| agentmux | tmux + web dashboard, pas natif |
| Peky | TUI unique, tout dans une app |
| Superset | Electron, macOS only |
| Claude-Flow | 250k lignes, over-engineered |
| Agent Teams | Experimental, pas de split Windows |

**Pattern commun :** Tous reinventent le terminal au lieu d'orchestrer ceux qui existent.

---

## 3. Utilisateurs

### Persona Primaire : "Le Dev Orchestrateur"

- Developpeur individuel, power user de Claude Code
- Travaille sur 2+ projets simultanement avec 2-3 worktrees chacun
- Multi-domaine : backend, frontend, SEO, securite, tests
- Utilise les terminaux natifs de son OS (Windows Terminal, Terminal.app, GNOME Terminal)
- Multi-ecrans (2-4 ecrans)
- Aime aller vite, mode flow, mode YOLO productif
- N'est pas naturellement organise mais veut le devenir sans effort
- A essaye et abandonne les outils complexes

### Persona Secondaire : "Le Lead Technique"

- Superviseur d'equipe utilisant Claude Code
- Besoin de voir l'avancement des sessions de son equipe
- Veut des rapports de progression
- Valorise le cadrage (CLAUDE.md, guidelines, tests)

### Jobs to be Done

| Job | Type |
|---|---|
| Voir instantanement l'etat de chaque session pour rester dans le flow | Fonctionnel |
| Se sentir en controle meme quand 10 choses avancent sans devenir "plus organise" | Emotionnel |
| Partager un outil qui resout un vrai probleme commun | Social |

---

## 4. Principes de Design

### P1 : Orchestrer, ne rien reinventer

Elementerm n'est pas un terminal, pas un multiplexer, pas une app GUI. C'est un daemon qui orchestre des terminaux natifs. Chaque OS gere ses fenetres. Elementerm gere l'intelligence.

### P2 : Progressive Disclosure

3 niveaux de zoom : Glance (couleurs) → Scan (statuts) → Focus (details). L'utilisateur choisit sa profondeur d'info. Ni trop, ni pas assez. Adaptable a chaque instant.

### P3 : Zero friction

Une commande pour demarrer. Zero config pour commencer. Zero habitude a changer. Les terminaux natifs restent. Elementerm ajoute juste les yeux.

### P4 : Boss Mode

L'utilisateur est le boss. Les sessions IA travaillent pour lui, a ses conditions, dans son cadre. Cadrage (CLAUDE.md), validation (tests), controle (dashboard).

### P5 : Anti-scope comme avantage

Moins de features = plus de clarte = meilleure adoption. On ne fait PAS : plugins, MCP, web dashboard, Electron, Telegram bot, autonomie IA.

---

## 5. Fonctionnalites - MVP Zero

### 5.1 Daemon (Process Background)

**Description :** Process Node.js qui tourne en arriere-plan, gere l'etat de toutes les sessions, recoit les events des hooks, et sert les donnees au dashboard via IPC.

**Comportement :**
- Demarre avec `elementerm start`, s'arrete avec `elementerm stop`
- Ecrit son PID dans `~/.elementerm/daemon.pid`
- Ecoute sur un named pipe (`~/.elementerm/elementerm.sock` ou `\\.\pipe\elementerm`)
- Maintient `~/.elementerm/state.json` a jour en temps reel
- Detecte les sessions mortes (timeout, crash) et met a jour leur statut

**State Store (`state.json`) :**
```json
{
  "sessions": {
    "<id>": {
      "project": "string",
      "worktree": "string",
      "branch": "string",
      "status": "flow | waiting | ready | attention | blocked | idle",
      "domain": "BACK | FRONT | SEO | SEC | TEST | INFRA | DOC | null",
      "last_commit": { "hash": "string", "msg": "string", "timestamp": "ISO" },
      "last_activity": "ISO timestamp",
      "files_modified": ["string"],
      "terminal_pid": "number",
      "claude_session_id": "string"
    }
  },
  "projects": {
    "<name>": { "path": "string", "sessions": ["<id>"] }
  },
  "daemon": {
    "started_at": "ISO timestamp",
    "pid": "number",
    "version": "string"
  }
}
```

### 5.2 Hooks Claude Code

**Description :** Script JavaScript minimal installe dans chaque worktree qui reporte les events de Claude Code au daemon.

**Events captures :**
- `PostToolUse` (matcher: Edit, Write, Bash) → fichiers modifies, outil utilise
- `Stop` → session a fini de repondre, attend l'input utilisateur
- `SessionEnd` → session terminee

**Installation :** Automatique lors de `elementerm new`. Ajoute la config dans `.claude/settings.json` du worktree.

**Communication :** Envoie du JSON au daemon via named pipe. Asynchrone pour ne pas bloquer Claude Code.

### 5.3 Spawner de Terminaux Natifs

**Description :** Module qui detecte l'OS et ouvre un nouveau terminal natif avec la bonne commande dans le bon worktree.

**Implementation par OS :**

| OS | Commande | Capacites |
|---|---|---|
| Windows | `wt.exe -w 0 nt --title "auth" -- claude -w auth` | Nouvel onglet/fenetre, titre custom |
| macOS | `osascript` / `open -a Terminal` | Nouvelle fenetre Terminal.app |
| Linux | `x-terminal-emulator -e` / detection auto | Nouvelle fenetre |

**Fonctionnement :**
1. Detecte l'OS et le terminal par defaut
2. Cree le git worktree si necessaire (`git worktree add`)
3. Copie le CLAUDE.md template dans le worktree
4. Installe le hook elementerm dans `.claude/settings.json`
5. Ouvre le terminal natif avec `claude` dans le bon repertoire
6. Enregistre le PID et les metadonnees dans le state store

### 5.4 Dashboard TUI (Ink)

**Description :** Application Ink (React for CLI) qui se connecte au daemon via IPC et affiche l'etat de toutes les sessions en temps reel.

**Vue Glance (touche `g`) :**
- Blocs de couleur minimalistes par session
- Groupes par projet
- Couleurs : vert (flow), jaune (attend), bleu (pret), orange (attention), rouge (bloque), gris (idle)
- Information : nom du worktree + nom du projet seulement
- Usage : coup d'oeil de 200ms pour l'etat global

**Vue Scan (touche `s`) :**
- Cartes de session avec statut, branche, badge domaine, dernier commit, fraicheur
- Groupes par projet
- Session selectionnee en surbrillance
- Usage : savoir ou en est chaque session sans zoomer

**Vue Focus (touche `f`) :**
- Une session prend tout l'ecran
- Statut, branche, worktree path, domaine, duree
- Liste des derniers commits
- Fichiers modifies depuis dernier commit
- Dernier output Claude Code (extrait)
- Usage : re-contextualisation complete d'une session

**Navigation :**
| Touche | Action |
|---|---|
| `g` | Vue Glance |
| `s` | Vue Scan |
| `f` | Vue Focus (session selectionnee) |
| `Tab` | Session suivante |
| `Shift+Tab` | Session precedente |
| `1-9` | Jump a la session N |
| `Enter` | Toggle Scan/Focus |
| `Esc` | Retour a la vue precedente |
| `n` | Nouvelle session (prompt interactif) |
| `o` | Ouvrir le terminal de la session selectionnee |
| `q` | Quitter le dashboard (sessions continuent) |

**Comportement temps reel :**
- Le daemon push les changements d'etat via IPC
- Le dashboard re-render les composants concernes
- Surbrillance temporaire quand un statut change (attirer l'oeil)

### 5.5 CLI

**Commandes :**

```
elementerm start              Demarre le daemon en background
elementerm stop               Arrete le daemon et notifie les sessions
elementerm dash               Ouvre le dashboard TUI (terminal courant)
elementerm new [options]      Cree et lance une nouvelle session
  --project <nom>             Nom du projet
  --worktree <nom>            Nom du worktree
  --template <nom>            Template CLAUDE.md a utiliser (optionnel)
elementerm status             Affiche un resume rapide sans dashboard
elementerm list               Liste les sessions actives
```

---

## 6. Fonctionnalites - Post-MVP

**Par ordre de priorite :**

| Priorite | Feature | Description |
|---|---|---|
| P1 | Cross-platform complet | Stabiliser macOS + Linux (Windows en premier dans MVP) |
| P1 | BMAD Integration | Workflow status dans le dashboard, dispatch de taches |
| P1 | Boss Mode complet | Templates de session par domaine, validation auto |
| P2 | Launch Profiles | `elementerm launch daily` - configurations sauvegardees |
| P2 | Conflit Watch | Detection quand 2 sessions touchent le meme fichier |
| P2 | Detection domaine auto | Analyser les fichiers modifies pour deduire BACK/FRONT/SEO |
| P3 | Export/Report | Resume markdown de la journee pour standups |
| P3 | Session Recycling | Reassigner une session terminee a la tache suivante |
| P3 | Smart Layout | Detection multi-ecrans, suggestion de placement |

---

## 7. Anti-Scope

**Elementerm ne fera JAMAIS :**

| Hors scope | Raison |
|---|---|
| Emulateur de terminal | L'OS en a un, c'est mieux |
| Multiplexer (splits, panes) | Le terminal natif le fait |
| Plugins / extensions | Complexite inutile |
| MCP servers | Claude Code en a deja |
| Interface web | Le terminal suffit |
| Application Electron/Tauri | Dependance GUI inutile |
| Bot Telegram/Slack/Discord | Feature creep |
| Autonomie IA (agents autonomes) | L'utilisateur est le boss |
| Editeur de code | VS Code/Neovim existent |
| Gestion git avancee | Claude Code et git le font |

---

## 8. Architecture Technique

### Stack

| Composant | Technologie | Justification |
|---|---|---|
| Langage | TypeScript | Ecosysteme Claude Code natif, Agent SDK |
| Runtime | Node.js | Deja installe chez les utilisateurs Claude Code |
| Dashboard TUI | Ink (React for CLI) | Composable, beau, TypeScript-first |
| IPC | Node.js `net` module | Named pipes (Win) / Unix sockets, zero dep |
| State | JSON fichier + file watcher | Simple, debuggable, zero dep |
| Hooks | Script JS minimal | Compatible Claude Code hooks natifs |
| Distribution | npm | `npm install -g elementerm` |
| Build | tsup ou esbuild | Bundle rapide, single entry point |

### Diagramme d'Architecture

```
                    PROCESSUS DAEMON (background)
                    ┌─────────────────────────────┐
                    │  Hook Handler ◄── hooks IPC  │
                    │       │                      │
                    │       v                      │
                    │  Session Manager             │
                    │       │                      │
                    │       v                      │
                    │  State Store (state.json)    │
                    │       │                      │
                    │       v                      │
                    │  IPC Server (named pipe) ──────────┐
                    └─────────────────────────────┘      │
                                                          │
                    PROCESSUS DASHBOARD (foreground)       │
                    ┌─────────────────────────────┐      │
                    │  IPC Client ◄───────────────────────┘
                    │       │                      │
                    │       v                      │
                    │  Ink App (React)             │
                    │  ├── GlanceView              │
                    │  ├── ScanView                │
                    │  └── FocusView               │
                    └─────────────────────────────┘

                    TERMINAUX NATIFS (independants)
                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                    │ wt.exe   │ │ wt.exe   │ │ wt.exe   │
                    │ claude   │ │ claude   │ │ claude   │
                    │ -w auth  │ │ -w api   │ │ -w test  │
                    │          │ │          │ │          │
                    │ hook ──────► daemon   │ │ hook ──────► daemon
                    └──────────┘ └──────────┘ └──────────┘
```

### Structure du Projet

```
elementerm/
├── package.json
├── tsconfig.json
├── CLAUDE.md                      ← Boss Mode : regles du projet
├── .claude/
│   └── rules/
│       ├── code-style.md
│       └── architecture.md
├── src/
│   ├── index.ts                   ← Entry point CLI
│   ├── daemon/
│   │   ├── index.ts               ← Demarrage daemon
│   │   ├── session-manager.ts     ← CRUD sessions
│   │   ├── state-store.ts         ← Lecture/ecriture state.json
│   │   ├── ipc-server.ts          ← Serveur named pipe
│   │   └── hook-handler.ts        ← Parse les events des hooks
│   ├── dashboard/
│   │   ├── app.tsx                ← Composant Ink racine
│   │   ├── views/
│   │   │   ├── glance.tsx
│   │   │   ├── scan.tsx
│   │   │   └── focus.tsx
│   │   ├── components/
│   │   │   ├── session-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── project-group.tsx
│   │   │   └── header.tsx
│   │   └── hooks/
│   │       ├── use-daemon.ts      ← Hook React pour connexion IPC
│   │       └── use-keyboard.ts    ← Hook React pour navigation
│   ├── spawner/
│   │   ├── index.ts               ← Factory par OS
│   │   ├── windows.ts
│   │   ├── macos.ts
│   │   └── linux.ts
│   ├── cli/
│   │   ├── commands.ts            ← Definitions des commandes
│   │   └── prompts.ts             ← Prompts interactifs (new session)
│   └── shared/
│       ├── types.ts               ← Types partages
│       ├── constants.ts           ← Chemins, config par defaut
│       └── ipc-protocol.ts        ← Messages IPC types
├── hooks/
│   └── elementerm-hook.js         ← Hook Claude Code (JS pur, pas TS)
├── templates/
│   ├── claude-md-default.md       ← CLAUDE.md generique
│   ├── claude-md-backend.md       ← CLAUDE.md backend
│   ├── claude-md-frontend.md      ← CLAUDE.md frontend
│   └── claude-md-seo.md           ← CLAUDE.md SEO
└── tests/
    ├── daemon/
    ├── spawner/
    └── shared/
```

---

## 9. Risques et Mitigations

| Risque | Impact | Probabilite | Mitigation |
|---|---|---|---|
| ConPTY Windows instable pour le spawn | Terminal ne s'ouvre pas | Moyen | Fallback `start cmd /k claude`, tester extensivement |
| Hooks Claude Code changent de spec | Les events n'arrivent plus | Faible | Wrapper abstrait, suivre le changelog Claude Code |
| Ink pas assez expressif pour les vues | Dashboard moche ou limite | Faible | Ink est tres flexible, prototyper tot |
| Named pipes pas fiables cross-platform | IPC qui crash | Faible | Node.js net module est battle-tested (VS Code l'utilise) |
| Trop de sessions saturent le state.json | Lag dans le dashboard | Faible | Le fichier reste petit meme avec 20 sessions |
| L'utilisateur ne veut pas `npm install -g` | Friction a l'installation | Moyen | Envisager un binaire standalone via pkg/bun en post-MVP |
| Claude Code ajoute un orchestrateur natif | Le projet devient obsolete | Moyen | Elementerm sera plus opinione (Boss Mode, BMAD) et deja la |

---

## 10. Metriques de Succes

### Succes Technique

| Metrique | Cible MVP |
|---|---|
| Daemon uptime sans crash | > 4h |
| Delai hook → dashboard | < 3s |
| Spawn terminal natif | > 95% reussite |
| Taille npm package | < 5 MB |
| Installation | < 30s |
| Demarrage daemon | < 2s |

### Succes Utilisateur

| Metrique | Cible |
|---|---|
| Dashboard remplace alt-tab | > 80% du temps |
| Mur de saturation repousse | +30min vs sans outil |
| Re-contextualisation apres pause | < 5s |
| Envie de reutiliser le lendemain | Oui |
| Sessions gerees confortablement | 6+ (vs 3-4 sans outil) |

### Succes Communaute (Post-launch)

| Metrique | Cible mois 1 |
|---|---|
| GitHub stars | > 100 |
| Issues communaute | > 10 |
| Contributeurs externes | > 2 |
| Mentions sociales | > 5 |

---

## 11. Positionnement Concurrentiel

### Matrice de Positionnement

```
           CONSTRUIT SON TERMINAL          UTILISE LE TERMINAL NATIF
                │                                    │
TMUX-BASED:     │  Claude Squad                      │
                │  agentmux                          │
                │                                    │
TUI UNIQUE:     │  Peky, Chloe                       │
                │  Ralph TUI                         │
                │                                    │
ELECTRON/GUI:   │  Superset, Crystal                 │
                │                                    │
DAEMON+NATIF:   │                                    │  ELEMENTERM
                │                                    │
```

### Differenciateurs Uniques

1. **Terminaux natifs** - Le seul outil qui n'est PAS un terminal
2. **Boss Mode** - Cadrage + validation + controle integres
3. **Progressive Disclosure** - 3 niveaux de zoom adaptables
4. **Multi-projet natif** - Gestion de N projets avec M worktrees chacun
5. **Zero config** - Fonctionne des la premiere commande
6. **Anti-scope radical** - Moins de features que tout le monde, plus de valeur

### Tagline

> **Elementerm - L'orchestrateur invisible pour sessions Claude Code.**
> Voyez tout. Ne changez rien. Orchestrez tout.

---

_Document genere avec BMAD - BMad Master Executor_
