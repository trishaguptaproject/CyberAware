
"use strict";

/* MOBILE NAVIGATION */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}

/* FOOTER YEAR */
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* ENGLISH AND HINDI */
const languageSelect = document.getElementById("languageSelect");

function setCyberLanguage(language) {
  const selectedLanguage = language === "hi" ? "hi" : "en";
  document.documentElement.lang = selectedLanguage;

  document.querySelectorAll("[data-en][data-hi]").forEach(function (element) {
    element.textContent = element.dataset[selectedLanguage];
  });

  document.querySelectorAll("option[data-en][data-hi]").forEach(function (option) {
    option.textContent = option.dataset[selectedLanguage];
  });

  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.placeholder = selectedLanguage === "hi"
      ? "अपना सवाल लिखें..."
      : "Type your question...";
    chatInput.setAttribute("aria-label",
      selectedLanguage === "hi" ? "साइबर सुरक्षा का सवाल लिखें" : "Type a cyber safety question");
  }

  const waitingMessage = document.getElementById("chatWaiting");
  if (waitingMessage) {
    waitingMessage.textContent = selectedLanguage === "hi"
      ? "आपके सवाल का जवाब तैयार किया जा रहा है..."
      : "Preparing your answer...";
  }

  try {
    localStorage.setItem("cyberaware-language", selectedLanguage);
  } catch (error) {
    // Language selection still works if browser storage is disabled.
  }
}

let initialLanguage = "en";
try {
  initialLanguage = localStorage.getItem("cyberaware-language") || "en";
} catch (error) {}

if (languageSelect) {
  languageSelect.value = initialLanguage;
  setCyberLanguage(initialLanguage);

  languageSelect.addEventListener("change", function () {
    setCyberLanguage(languageSelect.value);
  });
} else {
  setCyberLanguage(initialLanguage);
}

/* CYBER SAFETY QUIZ */
const quizForm = document.getElementById("quizForm");
const quizResult = document.getElementById("quizResult");

if (quizForm && quizResult) {
  quizForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(quizForm);
    const questions = ["q1", "q2", "q3"];

    if (questions.some(function (question) {
      return !formData.get(question);
    })) {
      quizResult.textContent = document.documentElement.lang === "hi"
        ? "कृपया सभी प्रश्नों के उत्तर दें।"
        : "Please answer all questions.";
      return;
    }

    let score = 0;
    if (formData.get("q1") === "b") score++;
    if (formData.get("q2") === "c") score++;
    if (formData.get("q3") === "b") score++;

    quizResult.textContent = document.documentElement.lang === "hi"
      ? "आपका स्कोर " + score + "/3 है। " +
        (score === 3 ? "बहुत बढ़िया! आप साइबर सुरक्षा जानते हैं।" : "सुरक्षा सुझाव पढ़ें और फिर कोशिश करें।")
      : "Your score is " + score + "/3. " +
        (score === 3 ? "Excellent! You know your cyber safety basics." : "Review the safety tips and try again.");

    quizResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

/* CYBERAWARE AI CHAT */
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatSend = document.getElementById("chatSend");

function addChatMessage(messageText, sender) {
  const message = document.createElement("div");
  message.className = "chat-message " +
    (sender === "user" ? "user-message" : "bot-message");
  // textContent prevents the answer from being interpreted as HTML.
  message.textContent = messageText;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

async function sendCyberQuestion(question) {
  const language = languageSelect ? languageSelect.value : "en";

  addChatMessage(question, "user");
  chatInput.value = "";
  chatInput.disabled = true;
  chatSend.disabled = true;

  const waitingMessage = addChatMessage(
    language === "hi"
      ? "आपके सवाल का जवाब तैयार किया जा रहा है..."
      : "Preparing your answer...",
    "bot"
  );
  waitingMessage.id = "chatWaiting";

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        language: language
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "The AI service is unavailable.");
    }

    waitingMessage.textContent = data.answer || (
      language === "hi" ? "कोई जवाब नहीं मिला।" : "No answer was returned."
    );
  } catch (error) {
    waitingMessage.textContent = language === "hi"
      ? "अभी AI सेवा उपलब्ध नहीं है। वित्तीय साइबर धोखाधड़ी होने पर अपने बैंक को तुरंत सूचित करें और भारत में 1930 पर कॉल करें। आधिकारिक पोर्टल: https://cybercrime.gov.in/"
      : "The AI service is unavailable right now. For financial cyber fraud in India, contact your bank immediately and call 1930. Official portal: https://cybercrime.gov.in/";
  } finally {
    waitingMessage.removeAttribute("id");
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

if (chatForm && chatInput && chatMessages && chatSend) {
  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const question = chatInput.value.trim();
    if (!question || chatSend.disabled) return;

    if (question.length > 1000) {
      addChatMessage(
        document.documentElement.lang === "hi"
          ? "कृपया 1000 अक्षरों से छोटा सवाल लिखें।"
          : "Please keep your question under 1000 characters.",
        "bot"
      );
      return;
    }

    await sendCyberQuestion(question);
  });

  document.querySelectorAll(".suggestion").forEach(function (button) {
    button.addEventListener("click", function () {
      if (chatSend.disabled) return;

      const language = languageSelect ? languageSelect.value : "en";
      const question = language === "hi"
        ? button.dataset.questionHi
        : button.dataset.questionEn;

      if (question) sendCyberQuestion(question);
    });
  });
}
