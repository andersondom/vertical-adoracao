import { appHtml } from "./web/app.js";
import { handleApi } from "./api/router.js";
import { logout } from "./auth/session.js";
import { json, htmlResponse } from "./utils/http.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }

      if (url.pathname === "/logout") {
        return await logout(request, env);
      }

      return htmlResponse(appHtml());
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
