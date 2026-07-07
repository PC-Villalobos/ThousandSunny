---
id: OPS-hopupu-factura
estado: activo
dominio: OPS
fuente: acuerdo verbal Capitán-Hopupu, 2026-06 (25 EUR/clase, L-V)
certeza: N3
tags: [operaciones, hopupu, surf, facturacion]
---

# Plantilla de factura — clases de surf para Hopupu

Acuerdo: **25,00 EUR por clase**, una clase al día de **lunes a viernes**, escuela
**Hopupu Surf Cádiz** (playa Santa María del Mar). Se factura **a mes vencido** con el
registro de clases como anexo.

> **Regla de oro:** esta plantilla vive en el repo **solo con placeholders**. Los datos
> reales (NIF, IBAN, dirección) se rellenan en la copia de cada factura, **fuera del
> repo** (PDF/impresa). Nunca commitear una factura rellena.
>
> Versión imprimible con cálculo automático: `factura_hopupu.html` (abrir en el
> navegador, rellenar, Ctrl+P → guardar como PDF).

## Cabecera

| Campo | Valor |
|---|---|
| Factura nº | HOP-2026-NNN (serie propia, correlativa, sin huecos) |
| Fecha de emisión | AAAA-MM-DD |
| Periodo facturado | mes AAAA |

**Emisor**
- Nombre completo: [—]
- NIF: [—]
- Domicilio fiscal: [—]
- Email: [—]

**Cliente**
- Razón social: [Hopupu Surf Cádiz — confirmar razón social y forma jurídica]
- CIF/NIF: [—]
- Domicilio: [—]

## Concepto

| Concepto | Uds. | Precio | Importe |
|---|---|---|---|
| Clases de surf impartidas como instructor para la escuela, periodo [mes] (ver anexo: registro de clases) | N | 25,00 EUR | N × 25,00 |

- **Base imponible:** N × 25,00 EUR
- **IVA 21%:** +0,21 × base — ver nota fiscal
- **Retención IRPF [0% / 7% / 15%]:** −base × tipo — ver nota fiscal
- **TOTAL a percibir:** base + IVA − IRPF

Ejemplo julio 2026 (23 laborables L-V): 23 × 25,00 = **575,00 EUR** de base.

**Forma de pago:** transferencia a IBAN [—] en un plazo de [15/30] días.

## Nota fiscal (confirmar con el gestor UNA vez, luego fijar)

Dos casillas que dependen de tu alta y no puedo decidir yo:

1. **IVA.** Por defecto **21%**. La exención de enseñanza (art. 20.Uno.9/10 LIVA) es
   dudosa aquí: facturas a la escuela (B2B), no clases particulares a alumnos. Muchos
   instructores en este esquema repercuten 21%. Que el gestor confirme.
2. **Retención IRPF.** Depende del epígrafe IAE de tu alta:
   - Epígrafe **empresarial** (p. ej. 967.2, escuelas/perfeccionamiento del deporte):
     **sin retención**.
   - Epígrafe **profesional** (sección 2ª, docencia): retención **15%** (o **7%** si
     estás en los 3 primeros años de actividad).

Pendiente del Capitán: pedir a Hopupu **razón social, CIF y domicilio fiscal**, y
confirmar con el gestor las dos casillas de arriba.

## Anexo — registro de clases del mes

El surf depende del mar: se factura lo impartido, no lo teórico. Una fila por clase.

| Fecha | Hora | Grupo/nº alumnos | Observaciones | Conforme escuela |
|---|---|---|---|---|
| | | | | |

Al cierre de mes: contar filas → N, pasar N a la factura, firma/OK de la escuela
(vale un WhatsApp de conformidad guardado).
