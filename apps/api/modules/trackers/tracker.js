(function () {
  const script = document.currentScript;
  const apiKey = script?.getAttribute("data-key");

  const backendBase = script ? new URL(script.src).origin : "https://api.yourcrm.com";
  const API_URL = `${backendBase}/api/track-batch`;
  const IDENTIFY_URL = `${backendBase}/api/identify`;

  function getVisitorId() {
    let id = localStorage.getItem("visitorId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("visitorId", id);
    }
    return id;
  }

  const visitorId = getVisitorId();
  let queue = [];

  function track(event, data = {}) {
    queue.push({
      event,
      data,
      timestamp: Date.now()
    });
  }

  function sendBatch() {
    if (queue.length === 0) return;

    const payload = {
      apiKey,
      visitorId,
      events: queue
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(API_URL, blob);
    queue = [];
  }

  track("page_view", { url: window.location.href });

  setInterval(sendBatch, 5000);

  window.addEventListener("beforeunload", sendBatch);


  window.crmTracker = {
    track: track,
    identify: async function(email, name) {
      if (!email) return console.error("crmTracker explicitly requires an email");
      try {
        await fetch(IDENTIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            visitorId,
            email,
            name
          })
        });
      } catch (err) {
        console.error("crmTracker identify failed:", err);
      }
    }
  };

})();