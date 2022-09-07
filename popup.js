const count = document.querySelector(".ac_count");
const topic = document.querySelector(".topic");
const threadList = document.querySelector(".thread");
const writeField = document.querySelector(".write_field");
const writeBtn = document.querySelector(".write_btn");

chrome.runtime.sendMessage({ tag: "opened" });
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  if (obj.tag === "front_online") {
    count.innerText = obj.msg;
  } else if (obj.tag === "front_topic") {
    topic.innerText = obj.msg;
  } else if (obj.tag === "front_thread") {
    let li = document.createElement("li");
    addItem(obj.msg, li);
    threadList.scrollTop = threadList.scrollHeight;
  }
  response({ status: "ok" });
});

writeField.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    writeBtn.click();
  }
});

writeBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const content = writeField.value;

  if (content) {
    const obj = {
      tag: "back_thread",
      content: content,
    };
    chrome.runtime.sendMessage(obj, () => {});
    writeField.value = null;
  }
});

function addItem(data, li) {
  if (data.content) {
    li.innerHTML = `<li>
    <label class="thread_date">${data.utc}</label>
      <label class="thread_content"
        >${data.content}</label
      >
      <hr />
    </li>`;
    threadList.appendChild(li);
  }
}
