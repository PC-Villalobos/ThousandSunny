"use strict";

/**
 * Tests for hub-server-utils.js (pure utility functions).
 * Run: node test_hub_utils.js  (from this directory)
 *
 * These functions are extracted from hub-server.local-context.js. If the server
 * logic changes, keep hub-server-utils.js in sync and these tests will catch
 * any behavioral regression.
 */

const assert = require("assert");
const path = require("path");
const {
  TELEGRAM_MESSAGE_LIMIT,
  normalizeTelegramText,
  getTelegramNakamaLabel,
  splitTelegramText,
  formatTelegramMessages,
} = require("../hub-server-utils");

async function run() {
  let passed = 0;
  async function test(name, fn) {
    await fn();
    passed += 1;
    console.log(`ok ${passed} - ${name}`);
  }

  // ── normalizeTelegramText ──────────────────────────────────────────────

  await test("normalizeTelegramText: trims leading and trailing whitespace", () => {
    assert.equal(normalizeTelegramText("  hello  "), "hello");
  });

  await test("normalizeTelegramText: converts CRLF to LF", () => {
    assert.equal(normalizeTelegramText("line1\r\nline2"), "line1\nline2");
  });

  await test("normalizeTelegramText: empty string returns empty string", () => {
    assert.equal(normalizeTelegramText(""), "");
  });

  await test("normalizeTelegramText: null returns empty string", () => {
    assert.equal(normalizeTelegramText(null), "");
  });

  await test("normalizeTelegramText: undefined returns empty string", () => {
    assert.equal(normalizeTelegramText(undefined), "");
  });

  await test("normalizeTelegramText: preserves internal newlines", () => {
    const result = normalizeTelegramText("line1\nline2\nline3");
    assert.equal(result, "line1\nline2\nline3");
  });

  await test("normalizeTelegramText: coerces numbers to string", () => {
    assert.equal(normalizeTelegramText(42), "42");
  });

  // ── getTelegramNakamaLabel ─────────────────────────────────────────────

  await test("getTelegramNakamaLabel: returns value as-is for plain name", () => {
    assert.equal(getTelegramNakamaLabel("Nami"), "Nami");
  });

  await test("getTelegramNakamaLabel: strips parenthetical role suffix", () => {
    assert.equal(getTelegramNakamaLabel("Nami (navegante)"), "Nami");
  });

  await test("getTelegramNakamaLabel: collapses extra spaces", () => {
    assert.equal(getTelegramNakamaLabel("  Nami  "), "Nami");
  });

  await test("getTelegramNakamaLabel: empty string returns Puente fallback", () => {
    assert.equal(getTelegramNakamaLabel(""), "Puente");
  });

  await test("getTelegramNakamaLabel: null returns Puente fallback", () => {
    assert.equal(getTelegramNakamaLabel(null), "Puente");
  });

  await test("getTelegramNakamaLabel: undefined returns Puente fallback", () => {
    assert.equal(getTelegramNakamaLabel(undefined), "Puente");
  });

  await test("getTelegramNakamaLabel: strips multiple parenthetical groups", () => {
    const result = getTelegramNakamaLabel("Sanji (cocinero) (v2)");
    assert.ok(!result.includes("("), `expected no parens, got: ${result}`);
  });

  // ── splitTelegramText ──────────────────────────────────────────────────

  await test("splitTelegramText: short text returns single chunk", () => {
    const chunks = splitTelegramText("Hello world", 100);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0], "Hello world");
  });

  await test("splitTelegramText: empty string returns empty array", () => {
    const chunks = splitTelegramText("", 100);
    assert.deepEqual(chunks, []);
  });

  await test("splitTelegramText: whitespace-only returns empty array", () => {
    const chunks = splitTelegramText("   ", 100);
    assert.deepEqual(chunks, []);
  });

  await test("splitTelegramText: text exactly at limit is not split", () => {
    const text = "a".repeat(100);
    const chunks = splitTelegramText(text, 100);
    assert.equal(chunks.length, 1);
  });

  await test("splitTelegramText: text over limit is split into multiple chunks", () => {
    const text = "word ".repeat(200);
    const chunks = splitTelegramText(text, 100);
    assert.ok(chunks.length > 1);
  });

  await test("splitTelegramText: all chunks are within maxLength", () => {
    const text = "word ".repeat(500);
    const chunks = splitTelegramText(text, 100);
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 100, `chunk too long (${chunk.length}): ${chunk.slice(0, 40)}`);
    }
  });

  await test("splitTelegramText: chunks reassemble to original content", () => {
    const original = "first line\nsecond line\nthird line\nfourth line\nfifth line";
    const chunks = splitTelegramText(original, 20);
    const reassembled = chunks.join("\n");
    for (const word of ["first", "second", "third", "fourth", "fifth"]) {
      assert.ok(reassembled.includes(word), `missing word: ${word}`);
    }
  });

  await test("splitTelegramText: prefers word boundary when space is in top 40% of limit", () => {
    // "hello world" (11 chars) with maxLength=8: space at idx 5, 5 >= floor(8*0.6)=4 → cuts there
    const chunks = splitTelegramText("hello world", 8);
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0], "hello");
    assert.equal(chunks[1], "world");
  });

  await test("splitTelegramText: no chunk is empty", () => {
    const text = "a ".repeat(300);
    const chunks = splitTelegramText(text, 50);
    for (const chunk of chunks) {
      assert.ok(chunk.trim().length > 0, "found empty chunk");
    }
  });

  // ── formatTelegramMessages ────────────────────────────────────────────

  await test("formatTelegramMessages: single short response returns one message", () => {
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: "Hello!" });
    assert.equal(msgs.length, 1);
    assert.match(msgs[0], /Nami/);
    assert.match(msgs[0], /Hello!/);
  });

  await test("formatTelegramMessages: label and reply separated by double newline", () => {
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: "Hello!" });
    assert.match(msgs[0], /Nami\n\nHello!/);
  });

  await test("formatTelegramMessages: error field takes precedence over reply", () => {
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: "ignored", error: "API down" });
    assert.match(msgs[0], /\[ERROR\]/);
    assert.match(msgs[0], /API down/);
    assert.ok(!msgs[0].includes("ignored"));
  });

  await test("formatTelegramMessages: null/undefined response uses Puente label and sin contenido", () => {
    const msgs = formatTelegramMessages({});
    assert.match(msgs[0], /Puente/);
    assert.match(msgs[0], /\[sin contenido\]/);
  });

  await test("formatTelegramMessages: long reply is split across multiple messages", () => {
    const longReply = "word ".repeat(1000);
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: longReply }, 200);
    assert.ok(msgs.length > 1);
  });

  await test("formatTelegramMessages: multi-part messages have part indicators", () => {
    const longReply = "word ".repeat(1000);
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: longReply }, 200);
    assert.match(msgs[0], /\(1\//);
    assert.match(msgs[1], /\(2\//);
  });

  await test("formatTelegramMessages: all parts include the label", () => {
    const longReply = "word ".repeat(1000);
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: longReply }, 200);
    for (const msg of msgs) {
      assert.match(msg, /Nami/);
    }
  });

  await test("formatTelegramMessages: no individual message exceeds TELEGRAM_MESSAGE_LIMIT", () => {
    const longReply = "word ".repeat(5000);
    const msgs = formatTelegramMessages({ nakama: "Nami", reply: longReply });
    for (const msg of msgs) {
      assert.ok(
        msg.length <= TELEGRAM_MESSAGE_LIMIT + 50,
        `message too long: ${msg.length}`
      );
    }
  });

  await test("formatTelegramMessages: strips parenthetical from label in multi-part", () => {
    const longReply = "word ".repeat(1000);
    const msgs = formatTelegramMessages({ nakama: "Sanji (cocinero)", reply: longReply }, 200);
    for (const msg of msgs) {
      assert.ok(!msg.includes("(cocinero)"), `found raw parenthetical in: ${msg.slice(0, 50)}`);
    }
  });

  console.log(`\n${passed} hub-utils tests passed`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
