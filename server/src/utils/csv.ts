import { once } from "node:events";

import type { Response } from "express";

type Cell = string | number | null | undefined;

const PHONE_LIKE = /^\+?[\d\s()-]+$/;

function toCell(value: Cell) {
  let text = value === null || value === undefined ? "" : String(value);
  // Spreadsheets run cells starting with these characters as formulas.
  if (/^[=+\-@\t\r]/.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Streams rows as a CSV download, respecting back-pressure. */
export async function sendCsv(
  res: Response,
  filename: string,
  header: string[],
  rows: AsyncIterable<Cell[]>,
) {
  res.status(200);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  // The byte-order mark makes Excel read the file as UTF-8.
  res.write(`\uFEFF${header.map(toCell).join(",")}\r\n`);
  for await (const row of rows) {
    if (!res.write(`${row.map(toCell).join(",")}\r\n`)) await once(res, "drain");
  }
  res.end();
}

export const exportFilename = (name: string) => `${name}-${new Date().toISOString().slice(0, 10)}.csv`;

export const EXPORT_MAX_ROWS = 50_000;
