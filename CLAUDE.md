# Elementerm - CLAUDE.md

## Vision

Elementerm est un orchestrateur invisible pour sessions Claude Code. Un daemon leger + un dashboard TUI + des terminaux natifs. N'invente rien, orchestre tout.

## Architecture

- **Daemon** : Process Node.js background, state store JSON, IPC via named pipes
- **Dashboard** : Ink (React for CLI) avec 3 vues (Glance, Scan, Focus)
- **Spawner** : Ouvre des terminaux natifs (wt.exe / Terminal.app / x-terminal-emulator)
- **Hooks** : Scripts JS installes dans les worktrees pour reporter au daemon
- **CLI** : Commandes simples (start, stop, dash, new, status)

## Stack

- TypeScript, Node.js >= 20, ESM modules
- Ink + React pour le TUI
- Node.js `net` module pour IPC (named pipes Windows / Unix sockets)
- JSON fichier pour le state store
- tsup pour le build
- vitest pour les tests

## Regles de Code

- TypeScript strict mode, pas de `any`
- Fonctions courtes et explicites, pas d'abstractions prematurees
- Nommer les choses clairement, pas de variables a 1 lettre (sauf iterateurs)
- Gestion d'erreurs aux frontieres systeme (IPC, fichiers, spawn), pas partout
- Zero dependance inutile - chaque dep doit etre justifiee
- Pas de commentaires evidents, uniquement quand la logique n'est pas self-evident

## Structure

```
src/
├── index.ts              ← CLI entry point
├── daemon/               ← Process background
│   ├── index.ts
│   ├── session-manager.ts
│   ├── state-store.ts
│   ├── ipc-server.ts
│   └── hook-handler.ts
├── dashboard/            ← TUI Ink
│   ├── app.tsx
│   ├── views/
│   └── components/
├── spawner/              ← Terminaux natifs
│   ├── index.ts
│   ├── windows.ts
│   ├── macos.ts
│   └── linux.ts
├── cli/                  ← Commandes
│   └── commands.ts
└── shared/               ← Types et constantes
    ├── types.ts
    ├── constants.ts
    └── ipc-protocol.ts
```

## Anti-Scope

NE PAS ajouter : plugins, MCP, web dashboard, Electron, Telegram, autonomie IA, editeur de code, gestion git avancee. Elementerm orchestre, il ne reinvente rien.

## Conventions

- Commits en anglais, format conventionnel (feat:, fix:, chore:, etc.)
- Une feature par branche, merge via PR
- Tests pour le daemon, le state store, et le protocol IPC
- Le dashboard est teste manuellement (TUI difficile a tester auto)
