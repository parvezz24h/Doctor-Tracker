import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const idParams = z.object({ id: objectId });

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** Optional query-string value: empty strings are treated as "not provided". */
export const optionalQuery = <T extends z.ZodType>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: optionalQuery(z.string().trim().max(100)),
  from: optionalQuery(z.iso.date("Use the format YYYY-MM-DD")),
  to: optionalQuery(z.iso.date("Use the format YYYY-MM-DD")),
};

export const sortOrder = z.enum(["asc", "desc"]).default("desc");

/** Inclusive calendar-day range (UTC) as a MongoDB range condition. */
export function buildDateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lt?: Date } = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) {
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    range.$lt = end;
  }
  return range;
}
