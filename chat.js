let appName = "procurement-software";

let selectedQuoteId = null;
let selectedQuoteNumber = null;

let chatsCache = [];
let quotesCache = [];

/* INIT 
ZOHO.CREATOR.init().then(() => {
  loadChatSessions();
}); */

/* SIDEBAR CHATS */
function loadChatSessions() {
  ZOHO.CREATOR.API.getRecords({
    app_name: appName,
    report_name: "All_Chats"
  }).then(res => {
    chatsCache = res.data || [];
    renderChatList();
  });
}

function loadQuoteRequests() {
var config = {
  app_name: appName,
  report_name: "QR_Status_by_Sales_Person"
};
ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
  quoteResponse = response;
  console.log(recordArr);
});
}

const newChatBtn = document.getElementById("newChatBtn");
const dropdown = document.getElementById("quoteDropdown");
const quoteList = document.getElementById("quoteList");
const quoteSearch = document.getElementById("quoteSearch");

const quotes = quoteResponse.data;

// Show dropdown
newChatBtn.addEventListener("click", () => {
  dropdown.classList.toggle("hidden");
  renderQuotes(quotes);
});

// Render list
function renderQuotes(list) {
  quoteList.innerHTML = "";

  list.forEach(quote => {
    const li = document.createElement("li");
    li.textContent = quote.name; // display ONLY name
    li.dataset.id = quote.id;

    li.addEventListener("click", () => {
      startChat(quote);
    });

    quoteList.appendChild(li);
  });
}

// Search by name OR ID
quoteSearch.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  const filtered = quotes.filter(q =>
    q.name.toLowerCase().includes(value) ||
    q.id.toLowerCase().includes(value)
  );

  renderQuotes(filtered);
});

// Start chat under selected quote
function startChat(quote) {
  dropdown.classList.add("hidden");
  quoteSearch.value = "";

  console.log("Starting chat for:", quote);

  /*
    HERE is where you:
    - Create chat session
    - Save selected quote ID
    - Load messages for that quote
    - Add it to sidebar chat list
  */
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

/* NEW CHAT */
function openNewChat() {
  selectedQuoteId = null;
  selectedQuoteNumber = null;

  document.getElementById("chatHeader").innerText = "Start a new chat";
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("quotePicker").classList.remove("hidden");

  if (quotesCache.length === 0) {
    loadQuotes();
  }
}

/* LOAD QUOTES */
function loadQuotes() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Form_A"
  }).then(res => {
    quotesCache = res.data || [];
    renderQuoteDropdown(quotesCache);
  });
}

function renderQuoteDropdown(data) {
  const dropdown = document.getElementById("quoteDropdown");
  dropdown.innerHTML = "";

  data.forEach(q => {
    const opt = document.createElement("option");
    opt.value = q.ID;
    opt.text = q.Quote_Number;
    dropdown.appendChild(opt);
  });
}

function filterQuotes() {
  const term = document.getElementById("quoteSearch")
    .value.toLowerCase();

  const filtered = quotesCache.filter(q =>
    q.Quote_Number.toLowerCase().includes(term)
  );

  renderQuoteDropdown(filtered);
}

/* SELECT QUOTE */
function selectQuote() {
  const dropdown = document.getElementById("quoteDropdown");

  selectedQuoteId = dropdown.value;
  selectedQuoteNumber =
    dropdown.options[dropdown.selectedIndex].text;

  document.getElementById("quotePicker").classList.add("hidden");
  document.getElementById("chatHeader").innerText =
    "Quote: " + selectedQuoteNumber;

  createOrLoadChatSession();
}

/* CHAT SESSION */
function createOrLoadChatSession() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Form_A",
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

/* EXISTING CHAT */
function openExistingChat(id, number) {
  selectedQuoteId = id;
  selectedQuoteNumber = number;

  document.getElementById("quotePicker").classList.add("hidden");
  document.getElementById("chatHeader").innerText =
    "Quote: " + number;

  loadMessages();
  loadChatSessions();
}

/* MESSAGES */
function loadMessages() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Quote_Chat",
    criteria: `(Quote_Request == "${selectedQuoteId}")`
  }).then(res => {
    const box = document.getElementById("chatMessages");
    box.innerHTML = "";

    (res.data || []).forEach(m => {
      const div = document.createElement("div");
      div.className = "msg " + m.Sender_Type;
      div.innerText = m.Message;
      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* SEND MESSAGE */
function sendMessage() {
  if (!selectedQuoteId) {
    alert("Please select a Quote Request first.");
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



