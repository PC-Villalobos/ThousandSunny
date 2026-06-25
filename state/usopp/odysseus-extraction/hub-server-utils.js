"use strict";

/**
 * Pure utility functions from hub-server.local-context.js.
 * No server startup, no external requires — safe to import in tests.
 */

const TELEGRAM_MESSAGE_LIMIT = 4000;

function normalizeTelegramText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function getTelegramNakamaLabel(value = "") {
  const label = String(value || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return label || "Puente";
}

function splitTelegramText(text, maxLength = TELEGRAM_MESSAGE_LIMIT) {
  const normalized = normalizeTelegramText(text);
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const chunks = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf("\n", maxLength);
    if (cut < Math.floor(maxLength * 0.6)) {
      cut = remaining.lastIndexOf(" ", maxLength);
    }
    if (cut < Math.floor(maxLength * 0.6)) {
      cut = maxLength;
    }
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function formatTelegramMessages(response, messageLimit = TELEGRAM_MESSAGE_LIMIT) {
  const label = getTelegramNakamaLabel(response?.nakama);
  const content = normalizeTelegramText(
    response?.error ? `[ERROR] ${response.error}` : response?.reply || ""
  ) || "[sin contenido]";
  const bodyBudget = Math.max(256, messageLimit - label.length - 12);
  const chunks = splitTelegramText(content, bodyBudget);

  if (chunks.length <= 1) {
    return [`${label}\n\n${chunks[0] || "[sin contenido]"}`];
  }

  return chunks.map((chunk, index) => `${label} (${index + 1}/${chunks.length})\n\n${chunk}`);
}

module.exports = {
  TELEGRAM_MESSAGE_LIMIT,
  normalizeTelegramText,
  getTelegramNakamaLabel,
  splitTelegramText,
  formatTelegramMessages,
};
