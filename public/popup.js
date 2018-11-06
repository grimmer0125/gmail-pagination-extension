document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('dropdown');

  chrome.storage.sync.get(['visibility'], (result) => {
    console.log(`visibility currently is ${result.visibility}`);
    if (result.visibility) {
      dropdown.value = result.visibility;
    }
  });

  //   chrome.storage.sync.get(null, (items) => {
  //   });

  dropdown.addEventListener('change', () => {
    chrome.storage.sync.set({ visibility: dropdown.value }, () => {
      console.log(`visibility is set to ${dropdown.value}`);
    });
  });
});
