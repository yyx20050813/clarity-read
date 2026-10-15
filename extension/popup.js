const toggleReading = document.querySelector("#toggleReading");
const fontSize = document.querySelector("#fontSize");
const lineHeight = document.querySelector("#lineHeight");
const saveHighlight = document.querySelector("#saveHighlight");
const clearHighlights = document.querySelector("#clearHighlights");
const highlightList = document.querySelector("#highlightList");
const empty = document.querySelector("#empty");

function options() {
  return {
    fontSize: Number(fontSize.value),
    lineHeight: Number(lineHeight.value) / 10
  };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("no tab");
  return chrome.tabs.sendMessage(tab.id, message);
}

function setToggleUi(on) {
  toggleReading.classList.toggle("on", on);
  toggleReading.textContent = on ? "关闭阅读模式" : "开启阅读模式";
}

async function refreshState() {
  try {
    const state = await sendToTab({ type: "GET_STATE" });
    setToggleUi(Boolean(state?.readingOn));
  } catch {
    setToggleUi(false);
  }
}

function renderHighlights(items) {
  highlightList.innerHTML = "";
  empty.hidden = items.length > 0;
  items.slice(0, 8).forEach((item) => {
    const li = document.createElement("li");
    const text = document.createElement("div");
    text.textContent = item.text;
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.title || item.url;
    li.append(text, link);
    highlightList.append(li);
  });
}

function loadHighlights() {
  chrome.runtime.sendMessage({ type: "GET_HIGHLIGHTS" }, (response) => {
    renderHighlights(Array.isArray(response?.highlights) ? response.highlights : []);
  });
}

toggleReading.addEventListener("click", async () => {
  try {
    const state = await sendToTab({ type: "GET_STATE" });
    const next = !state?.readingOn;
    const result = await sendToTab({ type: "SET_READING", on: next, options: options() });
    setToggleUi(Boolean(result?.readingOn));
  } catch {
    alert("请在普通网页中打开后再使用（扩展商店页等无法注入）。");
  }
});

async function applyTypography() {
  try {
    await sendToTab({ type: "SET_READING", on: true, options: options() });
    setToggleUi(true);
  } catch {
    /* ignore when page cannot host content script */
  }
}

fontSize.addEventListener("input", applyTypography);
lineHeight.addEventListener("input", applyTypography);

saveHighlight.addEventListener("click", async () => {
  try {
    await sendToTab({ type: "SAVE_SELECTION" });
    setTimeout(loadHighlights, 200);
  } catch {
    alert("无法读取当前页选区，请刷新页面后重试。");
  }
});

clearHighlights.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_HIGHLIGHTS" }, () => loadHighlights());
});

refreshState();
loadHighlights();
