chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log('on update event'); // many times
  // console.log('changeInfo:', changeInfo);
  // console.log("info url:",changeInfo.url);  // it only has value when status == loading
  // console.log('tab:', tab.url);

  // send query # hash request, onUpdated will be triggered several times
  if (changeInfo.status === 'complete') {
    // tabID, request
    chrome.tabs.sendMessage(tabId, {
      message: 'tab_update_completed',
      url: tab.url,
    });
  }
});
