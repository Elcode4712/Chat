let appName = "your_app_link_name";
let currentQuoteId = null;
let currentQuoteNumber = null;

// chats user has opened in this session
let openedChats = [];
let allQuotes = [];

ZOHO.CREATOR.init().then(() => {
  document.getElementById("newChatBtn").onclick = openNewChatModal;
  document.getElementById("startChatBtn").onclick = startChatFromPicker;
  document.getElementById("quoteSearch").oninput = filterQuotes;

  loadAllQuotes();     // for dropdown
  renderChatList();    // left sidebar (initially empty)
});

function loadAllQuotes() {
  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Quote_Request"
  }).then(res => {
    allQuotes = res.data;
    renderQuoteOptions(allQuotes);
  });
}

function renderQuoteOptions(list) {
  const select = document.getElementById("quoteSelect");
  select.innerHTML = "";

  list.forEach(q => {
    const opt = document.createElement("option");
    opt.value = q.ID;
    opt.textContent = q.Quote_Number;
    select.appendChild(opt);
  });
}

function filterQuotes() {
  const term = document.getElementById("quoteSearch").value.toLowerCase();
  const filtered = allQuotes.filter(q =>
    q.Quote_Number.toLowerCase().includes(term)
  );
  renderQuoteOptions(filtered);
}

function openNewChatModal() {
  document.getElementById("newChatModal").classList.remove("hidden");
}

function startChatFromPicker() {
  const select = document.getElementById("quoteSelect");
  if (!select.value) return;

  const quoteId = select.value;
  const quote = allQuotes.find(q => q.ID === quoteId);

  // add to opened chats if not already there
  if (!openedChats.find(c => c.id === quoteId)) {
    openedChats.push({ id: quoteId, number: quote.Quote_Number });
    renderChatList();
  }

  document.getElementById("newChatModal").classList.add("hidden");
  openChat(quoteId, quote.Quote_Number);
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  openedChats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "quote-item";
    div.textContent = chat.number;
    div.onclick = () => openChat(chat.id, chat.number);
    list.appendChild(div);
  });
}

function openChat(id, number) {
  currentQuoteId = id;
  currentQuoteNumber = number;

  document.getElementById("chatHeader").innerText =
    "Quote: " + number;

  loadMessages();
}

function loadMessages() {
  if (!currentQuoteId) return;

  ZOHO.CREATOR.API.getAllRecords({
    appName,
    formName: "Quote_Chat",
    criteria: `(Quote_Request == "${currentQuoteId}")`,
    sortOrder: "asc"
  }).then(res => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    res.data.forEach(m => {
      const div = document.createElement("div");
      div.className =
        "message " + (m.Sender_Type === "Customer" ? "customer" : "internal");
      div.textContent = m.Message;
      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

function sendMessage() {
  if (!currentQuoteId) {
    alert("Start a new chat and pick a Quote Request first.");
    return;
  }

  const input = document.getElementById("messageBox");
  const text = input.value.trim();
  if (!text) return;

  ZOHO.CREATOR.API.addRecord({
    appName,
    formName: "Quote_Chat",
    data: {
      Quote_Request: currentQuoteId,
      Message: text,
      Sender_Type: "Customer"
    }
  }).then(() => {
    input.value = "";
    loadMessages();
  });
}
