chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // send query # hash request, onUpdated will be triggered several times
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {
      message: 'tab_update_completed',
      url: tab.url,
    });
  }
});
