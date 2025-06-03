function exitApp() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ event: "exit" }));
  } else {
    alert("Running outside React Native.");
  }
}