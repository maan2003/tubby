let tabInfo = {};

// Function to get the current time in seconds
function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

// Function to update active time for a tab
function onTabUnfocus(tabId) {
  if (tabInfo[tabId] && tabInfo[tabId].lastActivated !== null) {
    const currentTime = getCurrentTime();
    const elapsedTime = currentTime - tabInfo[tabId].lastActivated;
    tabInfo[tabId].activeTime += elapsedTime;
    tabInfo[tabId].lastUsed = currentTime;
    tabInfo[tabId].lastActivated = null;
  }
}

// Listen for tab activation
browser.tabs.onActivated.addListener((activeInfo) => {
  const { tabId, previousTabId } = activeInfo;
  const currentTime = getCurrentTime();

  // Update previous tab's active time
  if (previousTabId && tabInfo[previousTabId]) {
    onTabUnfocus(previousTabId);
  }

  // Initialize or update current tab's info
  if (!tabInfo[tabId]) {
    tabInfo[tabId] = { activeTime: 0, lastActivated: currentTime, lastUsed: currentTime };
  } else {
    tabInfo[tabId].lastActivated = currentTime;
    tabInfo[tabId].lastUsed = currentTime;
  }
});

// Listen for tab removal
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabInfo[tabId]) {
    delete tabInfo[tabId];
  }
});

// Function to close inactive tabs
async function closeInactiveTabs() {
  const tabs = await browser.tabs.query({
    active: false,
    audible: false,
    pinned: false,
    currentWindow: true,
    windowType: "normal",
  });
  const currentTime = getCurrentTime();

  for (const tab of tabs) {
    if (tabInfo[tab.id]) {
      const timeSinceLastUse = currentTime - tabInfo[tab.id].lastUsed;
      let scaledThreshold = 30;
      if (timeSinceLastUse > 60 * 5) {
        scaledThreshold = 60;
      }

      if (tabInfo[tab.id].activeTime < scaledThreshold) {
        browser.tabs.remove(tab.id);
      }
    }
  }
}

// Listen for the keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  if (command === "close-inactive-tabs") {
    closeInactiveTabs();
  }
});
