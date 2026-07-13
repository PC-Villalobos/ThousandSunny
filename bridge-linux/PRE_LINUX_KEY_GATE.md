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

1. **La llave de la capsula Anillo 0** (perfil de Windows). Sin ella, la capsula
   clinica cifrada queda **irrecuperable para siempre** — no se pierde contexto,
   se pierde la capacidad de resolver identidades. Desde que el piloto Zoro
   academico poblo la capsula con equivalencias reales, esta llave paso de
   teorica a critica.
2. **Los fosiles exclusivos** de `C:\La maceta de Groot` (piezas que no existen
   en otra copia).
3. **Las sesiones de Codex** (`.codex\sessions`) — contexto de trabajo previo.

## Gate

Antes de que un USB booteable toque el disco:

- [ ] Llave de la capsula copiada a **soporte offline separado** (no solo al
      Toshiba, que es donde vive la capsula: llave y cifrado en soportes
      distintos).
- [ ] `C:\La maceta de Groot` (fosiles) respaldado y verificado.
- [ ] `.codex\sessions` respaldado.
- [ ] Perfil de usuario completo respaldado por si acaso.

Backup **verificado**, no solo "preparado". Cuando el instalador diga "borrar
disco", ya no hay marcha atras.
