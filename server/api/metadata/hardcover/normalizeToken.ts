export const normalizeHardcoverApiToken = (token: string): string => {
  const trimmed = token.trim();

  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice('bearer '.length).trim();
  }

  return trimmed;
};
