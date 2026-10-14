/* KungFu Travels: login form feedback and redirect */
document.addEventListener("DOMContentLoaded", function () {
  // ----- Settings you can change -----
  var REDIRECT_URL = "../index.html";   // page opened after login (e.g. "booking.html")
  var REDIRECT_DELAY = 2000;            // milliseconds
  var MIN_PASSWORD = 6;                 // minimum password length
  // -----------------------------------

  var form = document.querySelector("main form");
  if (!form) return;

  var fields = form.querySelectorAll(
    'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])'
  );
  var emailInput = fields[0];
  var passwordInput = fields[1];
  var button = form.querySelector('button[type="submit"], button:not([type])');
  if (!emailInput || !passwordInput || !button) return;

  var originalButtonText = button.textContent;

  // Message box, placed just above the Login button
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

  function showSuccess(email) {
    var name = email.split("@")[0];
    status.className = "form-status show success";
    status.textContent = "";

    var text = document.createElement("div");
    text.textContent = "\u2713 Login successful! Welcome back, " + name + ".";
    status.appendChild(text);

    var note = document.createElement("div");
    note.className = "status-note";
    note.textContent = "Taking you to the home page... ";
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
    button.textContent = "Logging in...";
    emailInput.disabled = true;
    passwordInput.disabled = true;

    setTimeout(function () {
      window.location.href = REDIRECT_URL;
    }, REDIRECT_DELAY);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter a valid email address.", emailInput);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      showError("Password must be at least " + MIN_PASSWORD + " characters.", passwordInput);
      return;
    }
    showSuccess(email);
  });

  // Hide the error once the user starts fixing it
  emailInput.addEventListener("input", clearStatus);
  passwordInput.addEventListener("input", clearStatus);

  // Safety: if the page is restored from the browser's back button
  window.addEventListener("pageshow", function () {
    button.disabled = false;
    button.textContent = originalButtonText;
    emailInput.disabled = false;
    passwordInput.disabled = false;
    clearStatus();
  });
});