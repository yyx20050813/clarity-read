chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["highlights"], (result) => {
    if (!Array.isArray(result.highlights)) {
      chrome.storage.local.set({ highlights: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_HIGHLIGHT") {
    chrome.storage.local.get(["highlights"], (result) => {
      const highlights = Array.isArray(result.highlights) ? result.highlights : [];
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: message.text,
        url: message.url,
        title: message.title,
        createdAt: new Date().toISOString()
      };
      highlights.unshift(entry);
      chrome.storage.local.set({ highlights: highlights.slice(0, 100) }, () => {
        sendResponse({ ok: true, count: Math.min(highlights.length, 100) });
      });
    });
    return true;
  }

  if (message?.type === "GET_HIGHLIGHTS") {
    chrome.storage.local.get(["highlights"], (result) => {
      sendResponse({ highlights: Array.isArray(result.highlights) ? result.highlights : [] });
    });
    return true;
  }

  if (message?.type === "CLEAR_HIGHLIGHTS") {
    chrome.storage.local.set({ highlights: [] }, () => sendResponse({ ok: true }));
    return true;
  }

  return false;
});
