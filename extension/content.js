(() => {
  const ROOT_ATTR = "data-clarity-read";
  const STYLE_ID = "clarity-read-style";
  let readingOn = false;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[${ROOT_ATTR}="on"] body {
        max-width: 720px !important;
        margin: 0 auto !important;
        padding: 48px 28px 80px !important;
        background: #f3f6f4 !important;
        color: #1a2a24 !important;
        font-family: "Noto Serif SC", "Source Han Serif SC", Georgia, serif !important;
        font-size: var(--cr-font-size, 20px) !important;
        line-height: var(--cr-line-height, 1.8) !important;
      }
      html[${ROOT_ATTR}="on"] body * {
        max-width: 100% !important;
        background: transparent !important;
        box-shadow: none !important;
        color: inherit !important;
      }
      html[${ROOT_ATTR}="on"] nav,
      html[${ROOT_ATTR}="on"] header,
      html[${ROOT_ATTR}="on"] footer,
      html[${ROOT_ATTR}="on"] aside,
      html[${ROOT_ATTR}="on"] [role="banner"],
      html[${ROOT_ATTR}="on"] [role="navigation"],
      html[${ROOT_ATTR}="on"] [role="complementary"],
      html[${ROOT_ATTR}="on"] iframe,
      html[${ROOT_ATTR}="on"] video,
      html[${ROOT_ATTR}="on"] .ad,
      html[${ROOT_ATTR}="on"] .ads,
      html[${ROOT_ATTR}="on"] [class*="advert"],
      html[${ROOT_ATTR}="on"] [id*="advert"] {
        display: none !important;
      }
      html[${ROOT_ATTR}="on"] img {
        display: block !important;
        margin: 1.5em auto !important;
        border-radius: 4px !important;
      }
      .cr-toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        z-index: 2147483646;
        transform: translateX(-50%) translateY(12px);
        padding: 10px 16px;
        border-radius: 999px;
        background: #14352c;
        color: #e8f3ee;
        font: 600 13px/1.2 system-ui, sans-serif;
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease, transform 180ms ease;
      }
      .cr-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function toast(text) {
    let el = document.querySelector(".cr-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "cr-toast";
      document.documentElement.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1600);
  }

  function setReading(on, options = {}) {
    ensureStyle();
    readingOn = Boolean(on);
    const root = document.documentElement;
    if (readingOn) {
      root.setAttribute(ROOT_ATTR, "on");
      if (options.fontSize) root.style.setProperty("--cr-font-size", `${options.fontSize}px`);
      if (options.lineHeight) root.style.setProperty("--cr-line-height", String(options.lineHeight));
    } else {
      root.removeAttribute(ROOT_ATTR);
    }
  }

  function saveSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (!text) {
      toast("请先选中一段文字");
      return;
    }
    chrome.runtime.sendMessage(
      {
        type: "SAVE_HIGHLIGHT",
        text: text.slice(0, 500),
        url: location.href,
        title: document.title
      },
      (response) => {
        if (chrome.runtime.lastError) {
          toast("保存失败，请重试");
          return;
        }
        toast(response?.ok ? "已收藏这段文字" : "保存失败");
      }
    );
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "TOGGLE_READING") {
      setReading(!readingOn, message.options || {});
      sendResponse({ readingOn });
      return true;
    }
    if (message?.type === "SET_READING") {
      setReading(Boolean(message.on), message.options || {});
      sendResponse({ readingOn });
      return true;
    }
    if (message?.type === "SAVE_SELECTION") {
      saveSelection();
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "GET_STATE") {
      sendResponse({ readingOn });
      return true;
    }
    return false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "r") {
      setReading(!readingOn);
      toast(readingOn ? "阅读模式已开启" : "阅读模式已关闭");
    }
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "h") {
      saveSelection();
    }
  });
})();
