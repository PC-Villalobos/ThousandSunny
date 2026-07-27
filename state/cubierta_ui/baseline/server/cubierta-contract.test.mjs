import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cubierta = readFileSync(new URL('../public/cubierta.html', import.meta.url), 'utf8')

test('Cubierta exposes the operational control views', () => {
  for (const label of ['Rumbo', 'Órdenes', 'Tripulación', 'Timón técnico', 'Conversación']) {
    assert.match(cubierta, new RegExp(label))
  }
})

test('Cubierta distinguishes solo and council without granting execution', () => {
  assert.match(cubierta, /data-mode="solo"/)
  assert.match(cubierta, /data-mode="council"/)
  assert.match(cubierta, /sin shell/)
  assert.match(cubierta, /todo GO sigue ocurriendo en el canal gobernado/)
})

test('Cubierta translates delivery, outcome, evidence and execution independently', () => {
  for (const field of ['delivery', 'outcome', 'epistemic', 'execution']) assert.match(cubierta, new RegExp(field))
})

test('Cubierta makes governance boundaries visible', () => {
  assert.match(cubierta, /no concede identidad, credenciales ni autoridad/)
  assert.match(cubierta, /salud local no demuestra entrada pública/i)
  assert.match(cubierta, /Jinbe ya tiene otro referente/)
  assert.match(cubierta, /STOP del Capitán/)
})
