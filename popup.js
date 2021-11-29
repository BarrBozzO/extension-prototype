let captureButton = document.getElementById("capture");
let message = document.getElementById("message");
let recordStatus = undefined;

// TODO: if other tabs shoud display different status in popup, then introduce messages
// if recording tab is different from current -> show message that some other tab is already in recording process.

// Initialize popup state by checking "record" in storage
chrome.storage.local.get("record", (data) => {
  recordStatus = data.record;
  captureButton.innerText = recordStatus ? "stop recording" : "start recording";
});

// React on "record" change in store
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === "local" && "record" in changes) {
    recordStatus = changes.record;
    captureButton.innerText = recordStatus
      ? "stop recording"
      : "start recording";
  }
});

captureButton.addEventListener("click", async () => {
  chrome.runtime.sendMessage(
    recordStatus ? "popupStopRecording" : "popupStartRecording" // TODO: replace with popupToggleRecording (so we simply revert the value in background ??)
  );
});
