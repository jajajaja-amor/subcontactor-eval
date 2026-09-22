export function parseEnabledParam(url: URL): boolean | undefined {
  const raw = url.searchParams.get("enabled");
  if (raw == null || raw === "") {
    return undefined;
  }
  const value = raw.toLowerCase();
  if (["1", "true", "yes"].includes(value)) {
    return true;
  }
  if (["0", "false", "no"].includes(value)) {
    return false;
  }
  return undefined;
}
