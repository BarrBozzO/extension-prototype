const iframeClickAction = "iframeClick";

const isTopMostWindow = () => window.self === window.top;

const sendClickToBackground = (e) => {
  chrome.runtime.sendMessage({
    type: "contentClickAction",
    payload: {
      coords: {
        x: e.clientX,
        y: e.clientY,
      },
      devicePixelRatio: window.devicePixelRatio, // can be re-trieved on background size?
    },
  });
};

const sendMessageToParentWindow = (targetWindow, event) => {
  targetWindow.postMessage(
    JSON.stringify({
      type: iframeClickAction,
      payload: {
        event: {
          clientX: event.clientX,
          clientY: event.clientY,
        },
      },
    }),
    "*"
  );
};

// chrome.runtime.sendMessage("contentMounted");
document.addEventListener(
  "click",
  function (e) {
    if (isTopMostWindow()) {
      // topmost window
      sendClickToBackground({
        clientX: e.clientX,
        clientY: e.clientY,
      });
    } else {
      // embedded window
      try {
        sendMessageToParentWindow(e.target.ownerDocument.defaultView.parent, {
          clientX: e.clientX,
          clientY: e.clientY,
        });
      } catch (error) {
        console.error(error);
      }
    }
  },
  true
);

window.addEventListener("message", function (messageEvent) {
  // TODO: check all frames to find which one sent message
  console.log(messageEvent);

  try {
    const { type, payload } = JSON.parse(messageEvent.data);

    if (typeof type === "string" && type === iframeClickAction) {
      const frameOffset = {
        x: 0,
        y: 0,
      };

      // Find message source iframe
      const currentWindowIframes = document.getElementsByTagName("IFRAME");
      for (let i = 0; i < currentWindowIframes.length; i++) {
        const iframe = currentWindowIframes[i];

        // Cross-browser way to get iframe's window object
        const frameWindow =
          iframe.contentWindow || iframe.contentDocument.defaultView;

        // Comparison
        if (messageEvent.source === frameWindow) {
          // get relative offset
          const iframeRect = iframe.getBoundingClientRect();
          frameOffset.x = Math.max(0, iframeRect.x);
          frameOffset.y = Math.max(0, iframeRect.y);
        }
      }

      // calculate iframe sender offset
      const { event } = payload;
      const nextEvent = {
        clientX: Number(event.clientX) + frameOffset.x,
        clientY: Number(event.clientY) + frameOffset.y,
      };

      if (isTopMostWindow()) {
        sendClickToBackground(nextEvent);
      } else {
        sendMessageToParentWindow(window.parent, nextEvent);
      }
    }
  } catch (error) {
    console.error(error);
  }
});
