type Cell = string | number | null | undefined;

const PHONE_LIKE = /^\+?[\d\s()-]+$/;

function toCell(value: Cell) {
  let text = value === null || value === undefined ? "" : String(value);
  // Spreadsheets run cells starting with these characters as formulas.
  if (/^[=+\-@\t\r]/.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV in the browser and starts the download. */
export function downloadCsv(filename: string, header: string[], rows: Cell[][]) {
  const body = [header, ...rows].map((row) => row.map(toCell).join(",")).join("\r\n");
  // The byte-order mark makes Excel read the file as UTF-8.
  const url = URL.createObjectURL(new Blob([`﻿${body}\r\n`], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
