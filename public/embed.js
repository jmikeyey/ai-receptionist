/**
 * Front Desk embed loader.
 *
 * Drop on any site:
 *   <script src="https://<host>/embed.js" data-business-id="<uuid>" defer></script>
 *
 * Injects a launcher button that toggles an iframe of the business's chat page.
 * No dependencies, no build step — this file is served as-is from /public.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var businessId = script.getAttribute("data-business-id");
  if (!businessId) {
    throw new Error("[Front Desk] embed.js requires a data-business-id attribute");
  }

  var origin = new URL(script.src).origin;
  var chatUrl = origin + "/c/" + encodeURIComponent(businessId) + "?embed=1";
  var accent = script.getAttribute("data-accent") || "#0F766E";

  var ID = "frontdesk-embed";
  if (document.getElementById(ID)) return; // already loaded

  var root = document.createElement("div");
  root.id = ID;
  root.setAttribute("data-open", "false");

  var style = document.createElement("style");
  style.textContent = [
    "#" + ID + "{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:inherit}",
    "#" + ID + " .fd-launcher{display:grid;place-items:center;width:56px;height:56px;margin-left:auto;border:0;border-radius:9999px;",
    "background:" + accent + ";color:#fff;cursor:pointer;box-shadow:0 6px 24px rgba(15,23,42,.24);transition:transform .15s ease}",
    "#" + ID + " .fd-launcher:hover{transform:scale(1.05)}",
    "#" + ID + " .fd-launcher svg{pointer-events:none}",
    "#" + ID + " .fd-panel{position:absolute;right:0;bottom:72px;width:390px;height:min(620px,calc(100dvh - 120px));",
    "border:0;border-radius:16px;background:#fff;box-shadow:0 16px 48px rgba(15,23,42,.22);overflow:hidden;",
    "opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}",
    "#" + ID + "[data-open='true'] .fd-panel{opacity:1;transform:translateY(0);pointer-events:auto}",
    // The panel is an iframe — a replaced element — so width:auto resolves to its intrinsic 300px
    // rather than stretching between left and right. Full-bleed needs an explicit width.
    "@media (max-width:480px){#" + ID + " .fd-panel{position:fixed;left:12px;bottom:88px;",
    "width:calc(100% - 24px);height:calc(100dvh - 140px)}}",
  ].join("");

  var panel = document.createElement("iframe");
  panel.className = "fd-panel";
  panel.title = "Chat with the receptionist";
  panel.setAttribute("loading", "lazy");

  var launcher = document.createElement("button");
  launcher.className = "fd-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.setAttribute("aria-expanded", "false");

  var CHAT_ICON =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">' +
    '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 21 12Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' +
    '<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  launcher.innerHTML = CHAT_ICON;

  launcher.addEventListener("click", function () {
    var open = root.getAttribute("data-open") !== "true";
    // Load the chat only on first open — an unopened widget costs the host page nothing.
    if (open && !panel.src) panel.src = chatUrl;
    root.setAttribute("data-open", String(open));
    launcher.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
    launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    launcher.setAttribute("aria-expanded", String(open));
  });

  root.appendChild(style);
  root.appendChild(panel);
  root.appendChild(launcher);
  document.body.appendChild(root);
})();
