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
   var config = {
  app_name: appName,
  report_name: "All_Chats",
  //criteria: `(Quote_Request_Number == "${Number(selectedQuoteId)}")`
};
ZOHO.CREATOR.DATA.getRecords(config).then(function (res) {
  console.log(res);
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
    div.innerText = chat.Quote_Request_Number.display_value;

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
    loadQuoteRequests();
  }
}

/* Load Quote Requests */

function loadQuoteRequests() {
var config = {
  app_name: appName,
  report_name: "Form_A_Report"
};
ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
   quotesCache = response.data;
   console.log(quotesCache);
  renderQuoteDropdown(quotesCache);
});
}

/* LOAD QUOTES 
function loadQuotes() {
  ZOHO.CREATOR.API.getAllRecords({
    app_name: appName,
  report_name: "QR_Status_by_Sales_Person"
  }).then(res => {
    quotesCache = res.data || [];
    renderQuoteDropdown(quotesCache);
  });
}*/

function renderQuoteDropdown(data) {
  const dropdown = document.getElementById("quoteDropdown");
  dropdown.innerHTML = "";

  data.forEach(q => {
    const opt = document.createElement("option");
    opt.value = q.ID;
    opt.text = q.Quote_Request_Number;
    dropdown.appendChild(opt);
  });
}

function filterQuotes() {
  const term = document.getElementById("quoteSearch")
    .value.toLowerCase();

  const filtered = quotesCache.filter(q =>
    q.Quote_Request_Number.toLowerCase().includes(term)
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
  var config = {
  app_name: appName,
  report_name: "All_Chats",
 // criteria: `(Quote_Request_Number == "${Number(selectedQuoteId)}")`
};
ZOHO.CREATOR.DATA.getRecords(config).then(function (res) {
  let ress = res;
  console.log(res);
  if (res.data && res.data.length > 0) {
      loadMessages();
      loadChatSessions();
      return;
    }
});

  var config = {
  app_name: appName,
  form_name: "Chat",
  payload: {
    "data": {
      "Quote_Request_Number": selectedQuoteId
   }
  }
};
ZOHO.CREATOR.DATA.addRecords(config).then(function (response) {
  if (response.code == 3000) {
    console.log(response);
    loadMessages();
    loadChatSessions();
  }
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
  var config = {
  app_name: appName,
  report_name: "All_Chats",
  //criteria: `(Quote_Request_Number == "${Number(selectedQuoteId)}")`
};
ZOHO.CREATOR.DATA.getRecords(config).then(function (res) {
  console.log(res);
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

  var config = {
  app_name: appName,
  form_name: "Chat",
  payload: {
    "data": {
      "Quote_Request_Number": selectedQuoteId,
      "Message": text,
      "Sender_Type": "User"
   }
  }
};
ZOHO.CREATOR.DATA.addRecords(config).then(function (response) {
  if (response.code == 3000) {
    console.log(response);
    input.value = "";
    loadMessages();
    loadChatSessions();
  }
});


}



