---
name: zoro-migrate
description: >-
  Espadachín del Thousand Sunny — corta nudos de formato: migra Google Docs y
  archivos `.md.gdoc` a Markdown real que Obsidian lee como texto plano, sin tocar
  las fuentes. Usar cuando el Capitán invoque /zoro o pida reparar/ejecutar la
  migración Drive → Obsidian / Markdown.
---

# Zoro Migrate

Use this skill when the Captain asks to repair or run the Google Drive to
Obsidian migration path for Markdown files that were accidentally created as
native Google Docs.

## Goal

Convert `.md.gdoc` or Google Docs source files into real Markdown files that
Obsidian can read as plain text. Never move, delete, or reorganize source Drive
files unless the Captain explicitly orders it.

## La migración es traducción ontológica (no solo formato)

Cortar el formato (Docs → Markdown) es el **primer paso**, no el trabajo completo.
La migración real es la **Fase 0** del proyecto (prioridad absoluta — ver
`docs/MIGRACION_SEMANTICA.md`): una **traducción ontológica** documento a documento.

Cada documento, antes de entrar en la Maceta de Groot, recibe su **ID canónico + YAML
frontmatter** (la **ID es el alma**: la clave primaria y el mecanismo de continuidad).

- **Zoro** corta el formato; **Robin** (`robin-meditacion`) audita el sentido
  (vivo / fósil / duplicado / contradicción). Juntos hacen la traducción.
- Salida por documento: `id` (Deckard `<nivel>-<clase>-<dominio>-<n>`), `estado`,
  `dominio`, `padre`, `tags`, `fuente`, `certeza` (regla Deckard), y wikilinks `[[...]]`.
- Al terminar: Drive = **museo histórico** (read-only); Obsidian = **fuente de verdad**.

## Execution Paths

### GAS path

Use the deployed Thousand Sunny GAS when the migration should run inside Google:

```javascript
Zoro_MigrateDocsToMD("DRIVE_FOLDER_ID");
```

The GAS function:

- scans Google Docs in the given folder;
- converts paragraphs, headings, list items, bold text, and simple tables to
  Markdown;
- creates `.md` files in the same folder with `MimeType.PLAIN_TEXT`;
- logs each success/failure to the Bitacora sheet;
- returns `{ migrados: [], fallidos: [], timestamp }`.

### Antigravity local path

Use `puentedemando/migrate_docs.py` when the migration needs local control,
recursive traversal, dry runs, OAuth/service-account credentials, or local
backup exports.

Typical dry run:

```bash
python migrate_docs.py --folder-id DRIVE_FOLDER_ID --recursive --dry-run --local-out ./exports-md
```

Typical live run:

```bash
python migrate_docs.py --folder-id DRIVE_FOLDER_ID --recursive --overwrite
```

Install local dependencies if needed:

```bash
python -m pip install google-api-python-client google-auth google-auth-oauthlib
```

## Safety Rules

- Prefer dry-run first for large folders.
- Do not trash the original Google Docs during migration.
- Do not open clinical content for semantic review unless the Captain explicitly
  authorizes that scope.
- Log every live run in Bitacora.
- Report migrated count, failed count, folder id, and whether recursion or
  overwrite was enabled.

## Expected Closeout

Return a concise report:

```text
Zoro migration complete.
folderId: ...
recursive: true/false
overwrite: true/false
migrated: N
failed: N
log: Bitacora sheet / local stdout
```
