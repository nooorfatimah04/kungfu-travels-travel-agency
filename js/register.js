/* KungFu Travels: register form feedback and redirect */
document.addEventListener("DOMContentLoaded", function () {
  // ----- Settings you can change -----
  var REDIRECT_URL = "login.html";      // page opened after registering
  var REDIRECT_DELAY = 2000;            // milliseconds
  var MIN_PASSWORD = 6;                 // minimum password length
  // -----------------------------------

  var form = document.querySelector("main form");
  if (!form) return;

  // Order on the page: Full name, Email, Password, Confirm password
  var fields = form.querySelectorAll(
    'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])'
  );
  var nameInput = fields[0];
  var emailInput = fields[1];
  var passwordInput = fields[2];
  var confirmInput = fields[3];
  var button = form.querySelector('button[type="submit"], button:not([type])');
  if (!nameInput || !emailInput || !passwordInput || !confirmInput || !button) return;

  var originalButtonText = button.textContent;

  // Message box, placed just above the submit button
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

  function showSuccess(fullName) {
    var firstName = fullName.split(/\s+/)[0];
    status.className = "form-status show success";
    status.textContent = "";

    var text = document.createElement("div");
    text.textContent = "\u2713 Account created! Welcome, " + firstName + ".";
    status.appendChild(text);

    var note = document.createElement("div");
    note.className = "status-note";
    note.textContent = "Taking you to the login page... ";
    var link = document.createElement("a");
    link.href = REDIRECT_URL;
    link.textContent = "Go now";
    note.appendChild(link);
    status.appendChild(note);

    var bar = document.createElement("div");
    bar.className = "progress";
    bar.style.setProperty("--redirect-time", REDIRECT_DELAY + "ms");
    status.appendChild(bar);

    // Stop the user from submitting twice
    button.disabled = true;
    button.textContent = "Creating account...";
    for (var i = 0; i < fields.length; i++) {
      fields[i].disabled = true;
    }

    setTimeout(function () {
      window.location.href = REDIRECT_URL;
    }, REDIRECT_DELAY);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var confirm = confirmInput.value;

    if (fullName.length < 2) {
      showError("Please enter your full name.", nameInput);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter a valid email address.", emailInput);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      showError("Password must be at least " + MIN_PASSWORD + " characters.", passwordInput);
      return;
    }
    if (password !== confirm) {
      showError("Passwords do not match. Please type them again.", confirmInput);
      return;
    }
    showSuccess(fullName);
  });

  // Hide the error once the user starts fixing it
  for (var i = 0; i < fields.length; i++) {
    fields[i].addEventListener("input", clearStatus);
  }

  // Safety: if the page is restored from the browser's back button
  window.addEventListener("pageshow", function () {
    button.disabled = false;
    button.textContent = originalButtonText;
    for (var j = 0; j < fields.length; j++) {
      fields[j].disabled = false;
    }
    clearStatus();
  });
});