/**
 * Map frontend sort fields to Prisma-safe columns.
 */
const resolveSortOrder = (sortOrder) =>
  String(sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

const resolveSortBy = (
  sortBy,
  { allowed, aliases = {}, fallback = "createdAt" } = {},
) => {
  const raw = String(sortBy || fallback).trim();
  const mapped = aliases[raw] || raw;
  if (allowed instanceof Set) {
    return allowed.has(mapped) ? mapped : fallback;
  }
  if (Array.isArray(allowed)) {
    return allowed.includes(mapped) ? mapped : fallback;
  }
  return mapped || fallback;
};

module.exports = {
  resolveSortBy,
  resolveSortOrder,
};
