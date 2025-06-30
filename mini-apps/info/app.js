// function exitApp() {
//   if (window.ReactNativeWebView) {
//     window.ReactNativeWebView.postMessage(JSON.stringify({ event: "exit" }));
//   } else {
//     alert("Running outside React Native.");
//   }
// }

function exitApp() {
  sendMessage({ event: 'exit' });
}

function sendMessage(data) {
  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  } else {
    alert("Not inside React Native WebView");
  }
}

// React Native will call this:
window.receiveMessage = function (data) {
  console.log("Received from React Native:", data);
  alert("Got from RN: " + data.message);
  // Send something back
  sendMessage({ event: "reply", received: data.message });
};

// Send ready message
sendMessage({ event: "ready", time: Date.now() });
