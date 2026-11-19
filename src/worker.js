function secureResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("content-security-policy", "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; frame-src 'self' blob: https://drive.google.com; frame-ancestors 'none'; object-src 'none'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (request.method === "GET" && requestUrl.pathname === "/vendor/pdf.worker.min.js") {
      const upstream = await fetch("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
      if (!upstream.ok) return secureResponse(new Response("تعذر تحميل مكوّن قراءة الكتاب.", { status: 502 }));
      const headers = new Headers(upstream.headers);
      headers.set("content-type", "application/javascript; charset=utf-8");
      headers.set("cache-control", "public, max-age=86400");
      return secureResponse(new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers
      }));
    }
    if (!env.ASSETS) {
      return secureResponse(new Response("الخدمة غير مهيأة.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }));
    }
    return secureResponse(await env.ASSETS.fetch(request));
  }
};
