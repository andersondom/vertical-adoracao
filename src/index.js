import { appHtml } from "./web/app.js";
import { handleApi } from "./api/router.js";
import { logout, getAuth } from "./auth/session.js";
import { json, htmlResponse } from "./utils/http.js";
import { isAllowedMutationOrigin } from "./auth/request-security.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/") && !isAllowedMutationOrigin(request)) {
        return json({ error: "Origem da requisição não permitida." }, 403);
      }
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }

      if (url.pathname === "/logout") {
        if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
        if (!isAllowedMutationOrigin(request)) return json({ error: "Origem da requisição não permitida." }, 403);
        return await logout(request, env);
      }

      const auth = await getAuth(request, env);
      if (!auth && url.pathname !== "/login") return new Response(null, { status: 302, headers: { Location: "/login", "Cache-Control": "no-store" } });
      if (auth && url.pathname === "/login") return new Response(null, { status: 302, headers: { Location: "/", "Cache-Control": "no-store" } });
      if (url.pathname !== "/" && url.pathname !== "/login") return new Response("Página não encontrada.", { status: 404 });
      const response = htmlResponse(appHtml());
      response.headers.set("Cache-Control", "no-store, private");
      return response;
    } catch (error) {
      console.error(error);
      const status = Number.isInteger(error?.status) ? error.status : 500;
      const message = status < 500
        ? error.message
        : "Erro interno do servidor.";

      return json({ error: message }, status);
    }
  }
};
