# Compuerta pre-Linux - backup obligatorio de C:

Fecha: 2026-07-13
Estado: compuerta dura del track Linux (Via A)
Relacionado: `ROADMAP_SECUENCIA_LINUX.md` (#60)

## Regla

**No se instala Linux sobre `C:` hasta verificar un backup offline de tres
piezas que el formateo destruye.** La baliza operativa completa vive en local
(`PRE_LINUX_BACKUP.md`); esto es el gate que la nube debe conocer.

Instalar un SO es la maniobra mas destructiva del proyecto. `C:` concentra tres
perdidas irreversibles:

1. **Las DOS llaves de las capsulas Anillo 0** (perfil de Windows). Actualizado
   2026-07-13: hay dos compartimentos cifrados con **llaves separadas** —
   (a) capsula academica y (b) capsula Caso 0 / LOTE50. Sin una llave, su capsula
   queda **irrecuperable para siempre** — no se pierde contexto, se pierde la
   capacidad de resolver identidades. Ambas llaves pasaron de teoricas a criticas
   al poblarse las capsulas con equivalencias reales (7 academicas + 50 Caso 0).
2. **Los fosiles exclusivos** de `C:\La maceta de Groot` (piezas que no existen
   en otra copia).
3. **Las sesiones de Codex** (`.codex\sessions`) — contexto de trabajo previo.

## Gate

Antes de que un USB booteable toque el disco:

- [ ] **Las dos llaves** (academica + Caso 0) copiadas a **soporte offline
      separado** (no solo al Toshiba, que es donde viven las capsulas: llaves y
      cifrado en soportes distintos). Falta una sola llave = esa capsula muere.
- [ ] `C:\La maceta de Groot` (fosiles) respaldado y verificado.
- [ ] `.codex\sessions` respaldado.
- [ ] Perfil de usuario completo respaldado por si acaso.

Backup **verificado**, no solo "preparado". Cuando el instalador diga "borrar
disco", ya no hay marcha atras.
