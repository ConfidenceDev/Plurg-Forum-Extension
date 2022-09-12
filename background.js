try {
  self.importScripts("socket.js");
  const socket = io("https://www.plurg.me", { transports: ["websocket"] });

  let online = null;
  let note = null;
  let msgQ = 1;
  const errMsg =
    "Unchecked runtime.lastError: The message port closed before a response was received.";

  socket.on("online", async (data) => {
    if (data) {
      const obj = {
        tag: "front_online",
        msg: await toComma(data.count),
      };
      online = obj;
      let lastError = chrome.runtime.lastError;
      if (!lastError || lastError.message !== errMsg) {
        sendToFront(obj);
      }
    }
  });

  socket.on("note", async (data) => {
    if (data) {
      const obj = {
        tag: "front_topic",
        msg: data,
      };
      note = obj;
      let lastError = chrome.runtime.lastError;
      if (!lastError || lastError.message !== errMsg) {
        sendToFront(obj);
      }
    }
  });

  socket.on("thread", async (data) => {
    if (data) {
      const obj = {
        tag: "front_thread",
        msg: data,
      };
      sendToFront(obj);
      if (msgQ > 4) {
        for (let i = 2; i < 6; i++) {
          chrome.storage.local.get([`plurg${i}`], (result) => {
            if (Object.keys(result).length < 1) return;
            const key = Object.keys(result)[0];
            chrome.storage.local.set({ [`plurg${i - 1}`]: result[key] });
          });
        }
        chrome.storage.local.set({ [`plurg${msgQ}`]: obj });
      } else {
        chrome.storage.local.set({ [`plurg${msgQ}`]: obj });
        ++msgQ;
      }
    }
  });

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    if (obj.tag === "back_thread") socket.emit("thread", obj.content);
    if (obj.tag === "opened") {
      sendToFront(online);
      sendToFront(note);
      for (let i = 1; i < 6; i++) {
        chrome.storage.local.get([`plurg${i}`], (result) => {
          if (Object.keys(result).length < 1) return;
          const key = Object.keys(result)[0];
          sendToFront(result[key]);
        });
        if (i > 4) {
          msgQ = 5;
        }
      }
    }
    response({ status: "ok" });
  });

  chrome.tabs.onRemoved.addListener(() => {
    chrome.storage.local.clear();
  });

  function sendToFront(obj) {
    chrome.tabs.query({ active: true, currentWindow: true }, () => {
      chrome.runtime.sendMessage(obj, () => {});
    });
  }

  async function toComma(value) {
    return await value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
} catch (e) {
  console.error(e);
}
