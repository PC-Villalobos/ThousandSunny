// Validador de un subconjunto de JSON Schema 2020-12, suficiente para
// `context-capsule.v1.schema.json` y deliberadamente pequeno.
//
// POR QUE EXISTE
// El repo no tiene dependencias y la prueba de aceptacion de draft-r4 tiene que leer
// el esquema real, no una copia parafraseada en el test. Una copia se desincroniza
// y entonces la prueba deja de probar el contrato: prueba el recuerdo del contrato,
// que es exactamente el modo de fallo que draft-r4 tipifica.
//
// REGLA DE HONESTIDAD
// Un validador incompleto que ignora en silencio lo que no entiende convierte cada
// negativa en un falso verde. Aqui toda palabra clave de asercion no implementada
// LANZA. Solo se ignoran anotaciones declaradas explicitamente. Si el esquema crece,
// la prueba se rompe en vez de mentir.

// Palabras clave sin efecto sobre la validacion. `format` entra aqui a proposito:
// en 2020-12 es anotacion por defecto y aqui no se valida.
const ANNOTATIONS = new Set([
  "$schema", "$id", "$comment", "title", "description", "default", "examples", "format", "$defs"
]);

const IMPLEMENTED = new Set([
  "type", "const", "enum", "required", "properties", "additionalProperties",
  "items", "minItems", "maxItems", "minimum", "maximum",
  "minLength", "maxLength", "pattern", "$ref"
]);

export class UnsupportedKeyword extends Error {
  constructor(keyword, at) {
    super(`palabra clave no implementada en el validador: '${keyword}' (en ${at})`);
    this.name = "UnsupportedKeyword";
    this.keyword = keyword;
  }
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  if (typeof value === "number") return "number";
  return typeof value;
}

function matchesType(value, expected) {
  const actual = typeOf(value);
  if (expected === "number") return actual === "number" || actual === "integer";
  if (expected === "object") return actual === "object";
  return actual === expected;
}

function resolveRef(ref, root, at) {
  if (!ref.startsWith("#/")) throw new UnsupportedKeyword(`$ref no local '${ref}'`, at);
  let node = root;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
    node = node?.[segment];
    if (node === undefined) throw new Error(`$ref sin destino: '${ref}' (en ${at})`);
  }
  return node;
}

/**
 * Valida `data` contra `schema`. Devuelve una lista de errores; vacia significa valido.
 * Lanza si el esquema usa una asercion que este validador no implementa.
 */
export function validate(schema, data, { root = schema, at = "$" } = {}) {
  const errors = [];

  for (const keyword of Object.keys(schema)) {
    if (ANNOTATIONS.has(keyword) || IMPLEMENTED.has(keyword)) continue;
    throw new UnsupportedKeyword(keyword, at);
  }

  if (schema.$ref !== undefined) {
    return validate(resolveRef(schema.$ref, root, at), data, { root, at });
  }

  if (schema.type !== undefined) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.some((candidate) => matchesType(data, candidate))) {
      errors.push(`${at}: se esperaba ${expected.join("|")}, llego ${typeOf(data)}`);
      return errors; // sin el tipo correcto el resto de aserciones no significan nada
    }
  }

  if (schema.const !== undefined && data !== schema.const) {
    errors.push(`${at}: se esperaba el valor constante ${JSON.stringify(schema.const)}, llego ${JSON.stringify(data)}`);
  }

  if (schema.enum !== undefined && !schema.enum.includes(data)) {
    errors.push(`${at}: ${JSON.stringify(data)} fuera del enum ${JSON.stringify(schema.enum)}`);
  }

  if (typeof data === "string") {
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(`${at}: ${data.length} caracteres, maximo ${schema.maxLength}`);
    }
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${at}: ${data.length} caracteres, minimo ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${at}: no casa con /${schema.pattern}/`);
    }
  }

  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${at}: ${data} por debajo del minimo ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${at}: ${data} por encima del maximo ${schema.maximum}`);
    }
  }

  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${at}: ${data.length} elementos, minimo ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(`${at}: ${data.length} elementos, maximo ${schema.maxItems}`);
    }
    if (schema.items !== undefined) {
      data.forEach((item, index) => {
        errors.push(...validate(schema.items, item, { root, at: `${at}[${index}]` }));
      });
    }
  }

  if (typeOf(data) === "object") {
    for (const field of schema.required ?? []) {
      if (!Object.hasOwn(data, field)) errors.push(`${at}: falta el campo obligatorio '${field}'`);
    }

    const declared = schema.properties ?? {};
    for (const [key, value] of Object.entries(data)) {
      if (Object.hasOwn(declared, key)) {
        errors.push(...validate(declared[key], value, { root, at: `${at}.${key}` }));
      } else if (schema.additionalProperties === false) {
        errors.push(`${at}: campo no declarado '${key}'`);
      } else if (typeOf(schema.additionalProperties) === "object") {
        errors.push(...validate(schema.additionalProperties, value, { root, at: `${at}.${key}` }));
      }
    }
  }

  return errors;
}

export function isValid(schema, data, options) {
  return validate(schema, data, options).length === 0;
}
