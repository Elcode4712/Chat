let appName = "procurement-software";

let selectedQuoteId = null;
let selectedQuoteName = null;

let chatsCache = [];
let quotesCache = [];

/* ---------------- INIT ---------------- */
ZOHO.CREATOR.init().then(() => {
  loadChatSessions();
});

/* ---------------- ELEMENTS ---------------- */
const dropdown = document.getElementById("quoteDropdown");
const quoteList = document.getElementById("quoteList");
const quoteSearch = document.getElementById("quoteSearch");
const chatMessages = document.getElementById("chatMessages");

/* ---------------- SIDEBAR ---------------- */
function loadChatSessions() {
  ZOHO.CREATOR.API.getRecords({
    app_name: appName,
    report_name: "All_Chats"
  }).then(res => {
    chatsCache = res.data || [];
    renderChatList();
  });
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chatsCache.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerText = chat.Quote_Request.display_value;

    if (chat.Quote_Request.ID === selectedQuoteId) {
      div.classList.add("active");
    }

    div.onclick = () =>
      openExistingChat(
        chat.Quote_Request.ID,
        chat.Quote_Request.display_value
      );

    list.appendChild(div);
  });
}

/* ---------------- NEW CHAT FLOW ---------------- */
function loadQuoteRequests() {
  dropdown.classList.remove("hidden");
  quoteSearch.value = "";
  quoteList.innerHTML = "<li>Loading...</li>";

  ZOHO.CREATOR.DATA.getRecords({
    app_name: appName,
    report_name: "QR_Status_by_Sales_Person"
  }).then(res => {
    quotesCache = res.data || [];
    renderQuotes(quotesCache);
  });
}

function renderQuotes(list) {
  quoteList.innerHTML = "";

  if (list.length === 0) {
    quoteList.innerHTML = "<li>No results</li>";
    return;
  }

  list.forEach(q => {
    const li = document.createElement("li");
    li.textContent = q.Quote_Name || q.Name || q.display_value;
    li.onclick = () => startChat(q);
    quoteList.appendChild(li);
  });
}

/* ---------------- SEARCH ---------------- */
quoteSearch.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  const filtered = quotesCache.filter(q =>
    (q.Quote_Name || "").toLowerCase().includes(value) ||
    (q.ID || "").toLowerCase().includes(value)
  );

  renderQuotes(filtered);
});

/* ---------------- START CHAT ---------------- */
function startChat(quote) {
  selectedQuoteId = quote.ID;
  selectedQuoteName = quote.Quote_Name || quote.display_value;

  dropdown.classList.add("hidden");
  chatMessages.innerHTML = "";

  createOrLoadChatSession();
}

/* ---------------- CHAT SESSION ---------------- */
function createOrLoadChatSession() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Chat",
    criteria: `(Quote_Request == "${selectedQuoteId}")`
  }).then(res => {

    if (res.data && res.data.length > 0) {
      loadMessages();
      loadChatSessions();
      return;
    }

    ZOHO.CREATOR.API.addRecord({
      appName,
      formName: "Chat",
      data: {
        Quote_Request: selectedQuoteId
      }
    }).then(() => {
      loadChatSessions();
      loadMessages();
    });
  });
}

/* ---------------- EXISTING CHAT ---------------- */
function openExistingChat(id, name) {
  selectedQuoteId = id;
  selectedQuoteName = name;

  dropdown.classList.add("hidden");
  loadMessages();
  loadChatSessions();
}

/* ---------------- MESSAGES ---------------- */
function loadMessages() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Quote_Chat",
    criteria: `(Quote_Request == "${selectedQuoteId}")`
  }).then(res => {
    chatMessages.innerHTML = "";

    (res.data || []).forEach(m => {
      const div = document.createElement("div");
      div.className = "msg " + m.Sender_Type;
      div.innerText = m.Message;
      chatMessages.appendChild(div);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

/* ---------------- SEND MESSAGE ---------------- */
function sendMessage() {
  if (!selectedQuoteId) {
    alert("Select a Quote Request first");
    return;
  }

  const input = document.getElementById("messageBox");
  const text = input.value.trim();
  if (!text) return;

  ZOHO.CREATOR.API.addRecord({
    appName,
    formName: "Quote_Chat",
    data: {
      Quote_Request: selectedQuoteId,
      Message: text,
      Sender_Type: "Customer"
    }
  }).then(() => {
    input.value = "";
    loadMessages();
    loadChatSessions();
  });
}
