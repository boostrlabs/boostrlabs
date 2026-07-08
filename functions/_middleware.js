const languageScript = '<script src="/assets/boostr-mother/language-engine.js" defer></script>';

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  };

  if (/boostr-mother\/(console|i18n|language-engine)\.js/.test(html)) {
    return new Response(html, init);
  }

  const nextHtml = html.includes("</body>")
    ? html.replace("</body>", `${languageScript}</body>`)
    : `${html}${languageScript}`;
  return new Response(nextHtml, init);
}
