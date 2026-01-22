import browser from "webextension-polyfill";

console.log("Sapling: Background script loaded");

// Listen for extension installation or update
browser.runtime.onInstalled.addListener((details) => {
  console.log("Sapling: Extension installed/updated", details);
});

// Listen for browser startup
browser.runtime.onStartup.addListener(() => {
  console.log("Sapling: Browser started, background script active");
});

// Listen for tab updates to detect navigation changes
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.url &&
    /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(changeInfo.url)
  ) {
    console.log("Sapling: URL changed", changeInfo.url);
    browser.tabs
      .sendMessage(tabId, { type: "URL_CHANGED", url: changeInfo.url })
      .catch((err) => {
        // Ignore "Receiving end does not exist" error as it means the content script
        // hasn't loaded yet (which is fine, as it will run main() on load)
        if (
          err.message &&
          !err.message.includes("Receiving end does not exist")
        ) {
          console.log("Sapling: Could not send message to tab", err);
        }
      });
  }
});
