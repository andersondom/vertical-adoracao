export function requireAdmin(auth) {
  if (auth.user.role !== "admin") {
    const error = new Error("Acesso negado.");
    error.status = 403;
    throw error;
  }
}
