/* KungFu Travels: contact form feedback */
document.addEventListener("DOMContentLoaded", function () {
  // ----- Settings you can change -----
  var SENDING_DELAY = 900;     // milliseconds the button shows "Sending..."
  var MIN_MESSAGE = 10;        // minimum message length
  // -----------------------------------

  var form = document.querySelector("main form");
  if (!form) return;

  // Order on the page: Full name, Email, Telephone
  var fields = form.querySelectorAll(
    'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])'
  );
  var nameInput = fields[0];
  var emailInput = fields[1];
  var phoneInput = fields[2];
  var topicSelect = form.querySelector("select");
  var messageBox = form.querySelector("textarea");
  var radios = form.querySelectorAll('input[type="radio"]');
  var consent = form.querySelector('input[type="checkbox"]');
  var button = form.querySelector('button[type="submit"], button:not([type])');
  if (!nameInput || !emailInput || !messageBox || !button) return;

  var originalButtonText = button.textContent;

  // Message box, placed just above the Send button
  var status = document.createElement("div");
  status.className = "form-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  var anchor = button;
  while (anchor.parentNode !== form) {
    anchor = anchor.parentNode;
  }
  form.insertBefore(status, anchor);

  function clearStatus() {
    status.className = "form-status";
    status.textContent = "";
  }

  function showError(message, field) {
    status.className = "form-status show error";
    status.textContent = message;
    if (field) field.focus();
  }

  // Which reply method did the user pick: "email" or "telephone"
  function replyMethod() {
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        var label = radios[i].id
          ? form.querySelector('label[for="' + radios[i].id + '"]')
          : null;
        var text = (label ? label.textContent : radios[i].parentNode.textContent) || "";
        return /tele|phone/i.test(text + " " + radios[i].value) ? "telephone" : "email";
      }
    }
    return "email";
  }

  function showSuccess(fullName, method) {
    var firstName = fullName.split(/\s+/)[0];
    var reference = "KFT-" + Math.floor(10000 + Math.random() * 90000);

    status.className = "form-status show success";
    status.textContent = "";

    var text = document.createElement("div");
    text.textContent = "\u2713 Inquiry sent! Thank you, " + firstName + ".";
    status.appendChild(text);

    var note = document.createElement("div");
    note.className = "status-note";
    note.appendChild(document.createTextNode("Your reference number is "));
    var ref = document.createElement("strong");
    ref.textContent = reference;
    note.appendChild(ref);
    note.appendChild(
      document.createTextNode(
        ". Our team will reply by " + method + " within 24 hours (Monday to Saturday, 9:00 AM to 6:00 PM)."
      )
    );
    status.appendChild(note);

    // Empty the form so it is ready for a new inquiry
    form.reset();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    status.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var phone = phoneInput ? phoneInput.value.trim() : "";
    var message = messageBox.value.trim();
    var method = replyMethod();

    if (fullName.length < 2) {
      showError("Please enter your full name.", nameInput);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter a valid email address.", emailInput);
      return;
    }
    if (method === "telephone" && phone.replace(/\D/g, "").length < 10) {
      showError("You chose to be contacted by telephone, so please enter your phone number.", phoneInput);
      return;
    }
    if (topicSelect && !topicSelect.value) {
      showError("Please select a topic for your inquiry.", topicSelect);
      return;
    }
    if (message.length < MIN_MESSAGE) {
      showError("Please write a short message (at least " + MIN_MESSAGE + " characters).", messageBox);
      return;
    }
    if (consent && !consent.checked) {
      showError("Please tick the box to agree that we may use your details to reply.", consent);
      return;
    }

    // Short "Sending..." state so the user sees something happening
    clearStatus();
    button.disabled = true;
    button.textContent = "Sending...";
    setTimeout(function () {
      button.disabled = false;
      button.textContent = originalButtonText;
      showSuccess(fullName, method);
    }, SENDING_DELAY);
  });

  // Hide old messages as soon as the user starts typing again
  var inputs = form.querySelectorAll("input, select, textarea");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", clearStatus);
    inputs[i].addEventListener("change", clearStatus);
  }
});