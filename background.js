/**
 * background script is executed once on installation (???)
 */

class ImageRecorder {
  constructor() {
    this._tab = null;
  }

  get tabId() {
    return this._tabId;
  }

  set tabId(newTabId) {
    return (this._tabId = newTabId);
  }

  start(tabId) {
    this.tabId = tabId;
    chrome.storage.local.set({ record: tabId });
  }

  stop() {
    this.tabId = null;
    chrome.storage.local.set({ record: null });
  }

  reset() {
    this.tabId = null;
    chrome.storage.local.set({ record: null });
  }

  isCurrentTab(tabId) {
    return this.tabId === tabId;
  }
}

const imageRecorder = new ImageRecorder();

chrome.runtime.onInstalled.addListener(() => {
  // unset recording tab on onInstalled
  imageRecorder.reset();
});

chrome.runtime.onStartup.addListener(function () {
  // unset recording tab on startUp
  imageRecorder.reset();
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  console.log("tab updated");
  if (changeInfo.status === "complete") {
    // TODO: do we need to do something specific to recording tab?
    if (imageRecorder.isCurrentTab(tabId)) {
      // TODO: do not inject or get installedtabinfo
    }
  }
});

chrome.tabs.onRemoved.addListener(async function (tabId, changeInfo, tab) {
  // stop image recorder
  if (imageRecorder.isCurrentTab(tabId)) {
    imageRecorder.stop();
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message === "popupStartRecording") {
    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // start recording curret active tab
      imageRecorder.start(tabs[0].id);
    });
  } else if (message === "popupStopRecording") {
    imageRecorder.stop();
  } else if (message?.type === "contentClickAction") {
    /**
     * Check if message came from "recording tab"
     */
    if (imageRecorder.isCurrentTab(sender.tab.id)) {
      if (sender.frameId === 0) {
        // frameId === 0 - topmost document
      } else if (sender.frameId > 0) {
        // frameId > 0 - nested iframe document
      }

      // take a screenshot
      chrome.tabs.captureVisibleTab(
        sender.tab.windowId, // we know that clicked happened in "recording tab", so windowId can be easily retrieved from sender
        {
          format: "png",
        },
        function (data) {
          console.log(data);

          fetch(data)
            .then((resp) => {
              return resp.blob();
            })
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              chrome.downloads.download({
                url,
                filename: Number(Date.now()) + ".png",
              });
            });
        }
      );
    }
  }
});
