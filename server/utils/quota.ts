/**
 * Parse a quota limit or rolling-window day count from DB/settings values.
 * Returns undefined for missing, non-numeric, negative, or non-finite values.
 * Zero is preserved (limit 0 means unlimited in Seerr quota logic).
 */
export const parseQuotaNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  const parsed =
    typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.trunc(parsed);
};

export const resolveQuotaNumber = (
  userValue: unknown,
  defaultValue: unknown
): number | undefined => {
  const parsedUserValue = parseQuotaNumber(userValue);
  if (parsedUserValue !== undefined) {
    return parsedUserValue;
  }

  return parseQuotaNumber(defaultValue);
};
