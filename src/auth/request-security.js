/** Verifica origem de requisições autenticadas que modificam estado. */
export function isAllowedMutationOrigin(request) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin) {
    try { return new URL(origin).origin === url.origin; } catch { return false; }
  }
  const referer = request.headers.get("Referer");
  if (referer) {
    try { return new URL(referer).origin === url.origin; } catch { return false; }
  }
  // Requisicoes sem origem nao sao aceitas quando usam cookie de sessao.
  return !request.headers.has("Cookie");
}
