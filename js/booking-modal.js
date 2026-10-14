/* KungFu Travels: booking pop-up for the pricing page */
document.addEventListener("DOMContentLoaded", function () {
  // ----- Settings you can change -----
  var ADVANCE_RATE = 0.3;            // 30% advance
  var MIN_DAYS_AHEAD = 7;            // earliest travel date = today + 7 days
  var BALANCE_DAYS_BEFORE = 7;       // balance due this many days before travel
  var WALLET_NUMBER = "0312 3456780";
  var SENDING_DELAY = 900;           // milliseconds the button shows "Booking..."
  // -----------------------------------

  var buttons = document.querySelectorAll(".book-btn");
  if (!buttons.length || typeof HTMLDialogElement === "undefined") return; // old browser: normal link works

  // Same rules as the pricing table on the page
  var TYPES = {
    single:  { label: "Single traveler",     mult: 1.5, people: 1 },
    couple:  { label: "Couple",              mult: 1.2, people: 2 },
    family:  { label: "Family of 4",  mult: 1.0, people: 4 },
    friends: { label: "Friends group",  mult: 0.9, people: 6 }
  };

  var plan = null; // { dest, tier, days, base }

  // ---------- helpers ----------
  function money(n) {
    return "PKR " + Math.round(n).toLocaleString("en-US");
  }
  function perPerson(base, mult) {
    return Math.round((base * mult) / 500) * 500;
  }
  function pad(n) {
    return ("0" + n).slice(-2);
  }
  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function niceDate(d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function parseISO(value) {
    return new Date(value + "T00:00:00");
  }

  // ---------- build the dialog once ----------
  var dialog = document.createElement("dialog");
  dialog.className = "booking-dialog";
  dialog.setAttribute("aria-labelledby", "bk-title");
  dialog.innerHTML =
    '<div class="bk-inner">' +
      '<div class="bk-head">' +
        '<h2 id="bk-title">Book your trip</h2>' +
        '<button type="button" class="bk-close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="bk-body">' +
        '<div class="bk-form-view">' +
          '<div class="bk-plan">' +
            '<span class="bk-chip" data-f="dest"></span>' +
            '<span class="bk-chip" data-f="tier"></span>' +
            '<span class="bk-chip" data-f="days"></span>' +
          "</div>" +
          '<form class="bk-form" novalidate>' +
            '<div class="bk-grid">' +
              '<div class="bk-field"><label for="bk-name">Full name</label><input id="bk-name" type="text" autocomplete="name"></div>' +
              '<div class="bk-field"><label for="bk-email">Email address</label><input id="bk-email" type="email" autocomplete="email"></div>' +
              '<div class="bk-field"><label for="bk-phone">Phone number</label><input id="bk-phone" type="tel" autocomplete="tel"></div>' +
              '<div class="bk-field"><label for="bk-date">Travel date</label><input id="bk-date" type="date"></div>' +
              '<div class="bk-field"><label for="bk-type">Traveler type</label>' +
                '<select id="bk-type">' +
                  '<option value="single">Single traveler (+50%)</option>' +
                  '<option value="couple">Couple (+20%)</option>' +
                  '<option value="family" selected>Family of 4 (base price)</option>' +
                  '<option value="friends">Friends group, 6+ (-10%)</option>' +
                "</select></div>" +
              '<div class="bk-field"><label for="bk-people">Number of travelers</label><input id="bk-people" type="number" min="6" max="30" step="1"></div>' +
              '<div class="bk-field full"><span class="bk-label" id="bk-pay-label">Payment method</span>' +
                '<div class="bk-methods" role="radiogroup" aria-labelledby="bk-pay-label">' +
                  '<label class="bk-method jazz"><input type="radio" name="bk-pay" value="JazzCash" checked><span>JazzCash</span></label>' +
                  '<label class="bk-method easy"><input type="radio" name="bk-pay" value="EasyPaisa"><span>EasyPaisa</span></label>' +
                "</div></div>" +
            "</div>" +
            '<div class="bk-summary" aria-live="polite">' +
              '<div class="bk-row"><span>Price per person</span><strong data-s="pp"></strong></div>' +
              '<div class="bk-row"><span>Travelers</span><strong data-s="people"></strong></div>' +
              '<div class="bk-row total"><span>Total price</span><strong data-s="total"></strong></div>' +
              '<div class="bk-row"><span>Advance to pay now (30%)</span><strong data-s="adv"></strong></div>' +
              '<div class="bk-row"><span>Balance before travel</span><strong data-s="bal"></strong></div>' +
            "</div>" +
            '<div class="bk-error" role="alert"></div>' +
            '<div class="bk-actions">' +
              '<button type="button" class="bk-secondary" data-close>Cancel</button>' +
              '<button type="submit" class="bk-primary">Confirm booking</button>' +
            "</div>" +
          "</form>" +
        "</div>" +
        '<div class="bk-confirm-view" hidden>' +
          '<div class="bk-tick" aria-hidden="true">&#10003;</div>' +
          "<h3>Booking confirmed!</h3>" +
          '<p class="bk-thanks"></p>' +
          '<div class="bk-details"></div>' +
          '<div class="bk-note"></div>' +
          '<div class="bk-confirm-actions">' +
            '<a class="button-link" href="booking.html#payment-title">See payment details</a>' +
            '<button type="button" class="bk-secondary" data-close>Done</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  document.body.appendChild(dialog);

  function q(sel) { return dialog.querySelector(sel); }

  var formView = q(".bk-form-view");
  var confirmView = q(".bk-confirm-view");
  var form = q(".bk-form");
  var nameInput = q("#bk-name");
  var emailInput = q("#bk-email");
  var phoneInput = q("#bk-phone");
  var dateInput = q("#bk-date");
  var typeSelect = q("#bk-type");
  var peopleInput = q("#bk-people");
  var errorBox = q(".bk-error");
  var submitBtn = q(".bk-primary");

  // ---------- price summary ----------
  function currentPeople() {
    var t = TYPES[typeSelect.value];
    if (typeSelect.value === "friends") {
      var n = parseInt(peopleInput.value, 10);
      return isNaN(n) ? t.people : n;
    }
    return t.people;
  }

  function updateSummary() {
    var t = TYPES[typeSelect.value];
    var isFriends = typeSelect.value === "friends";
    peopleInput.disabled = !isFriends;
    if (!isFriends) peopleInput.value = t.people;
    else if (!peopleInput.value || parseInt(peopleInput.value, 10) < 6) peopleInput.value = 6;

    var pp = perPerson(plan.base, t.mult);
    var people = currentPeople();
    var total = pp * people;
    var advance = Math.round(total * ADVANCE_RATE);
    q('[data-s="pp"]').textContent = money(pp);
    q('[data-s="people"]').textContent = people;
    q('[data-s="total"]').textContent = money(total);
    q('[data-s="adv"]').textContent = money(advance);
    q('[data-s="bal"]').textContent = money(total - advance);
    return { pp: pp, people: people, total: total, advance: advance, balance: total - advance };
  }

  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.className = "bk-error show";
    if (field) field.focus();
  }
  function clearError() {
    errorBox.className = "bk-error";
    errorBox.textContent = "";
  }

  // ---------- open / close ----------
  function openFor(button) {
    plan = {
      dest: button.getAttribute("data-dest"),
      tier: button.getAttribute("data-tier"),
      days: button.getAttribute("data-days"),
      base: parseInt(button.getAttribute("data-base"), 10)
    };
    q('[data-f="dest"]').textContent = plan.dest;
    q('[data-f="tier"]').textContent = plan.tier + " package";
    q('[data-f="days"]').textContent = plan.days;

    form.reset();
    typeSelect.value = "family";
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + MIN_DAYS_AHEAD);
    dateInput.min = isoDate(minDate);
    clearError();
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm booking";
    formView.hidden = false;
    confirmView.hidden = true;
    q("#bk-title").textContent = "Book your trip";
    updateSummary();

    document.body.style.overflow = "hidden";
    dialog.showModal();
    nameInput.focus();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("close", function () {
    document.body.style.overflow = "";
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog(); // click on the dark background
  });
  dialog.addEventListener("click", function (event) {
    if (event.target.closest(".bk-close") || event.target.closest("[data-close]")) closeDialog();
  });

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function (event) {
      event.preventDefault();
      openFor(this);
    });
  }

  typeSelect.addEventListener("change", function () { clearError(); updateSummary(); });
  peopleInput.addEventListener("input", function () { clearError(); updateSummary(); });
  form.addEventListener("input", clearError);

  // ---------- submit ----------
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var phoneDigits = phoneInput.value.replace(/\D/g, "");
    var isFriends = typeSelect.value === "friends";
    var people = currentPeople();

    if (fullName.length < 2) { showError("Please enter your full name.", nameInput); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("Please enter a valid email address.", emailInput); return; }
    if (phoneDigits.length < 10) { showError("Please enter a valid phone number (at least 10 digits).", phoneInput); return; }
    if (!dateInput.value) { showError("Please choose your travel date.", dateInput); return; }
    if (dateInput.value < dateInput.min) {
      showError("Travel date must be at least " + MIN_DAYS_AHEAD + " days from today.", dateInput);
      return;
    }
    if (isFriends && (people < 6 || people > 30)) {
      showError("A friends group needs between 6 and 30 travelers.", peopleInput);
      return;
    }

    var sums = updateSummary();
    var method = q('input[name="bk-pay"]:checked').value;
    var travelDate = parseISO(dateInput.value);
    var balanceDate = new Date(travelDate);
    balanceDate.setDate(balanceDate.getDate() - BALANCE_DAYS_BEFORE);
    var reference = "KFT-" + Math.floor(10000 + Math.random() * 90000);

    clearError();
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking...";

    setTimeout(function () {
      var booking = {
        reference: reference,
        destination: plan.dest,
        package: plan.tier,
        duration: plan.days,
        travelDate: isoDate(travelDate),
        travelerType: TYPES[typeSelect.value].label,
        travelers: sums.people,
        total: sums.total,
        advance: sums.advance,
        paymentMethod: method,
        name: fullName,
        email: email,
        phone: phoneInput.value.trim()
      };
      // Keep a copy in this browser (no server yet)
      try {
        var saved = JSON.parse(localStorage.getItem("kft_bookings") || "[]");
        saved.push(booking);
        localStorage.setItem("kft_bookings", JSON.stringify(saved));
      } catch (e) { /* storage not available: ignore */ }

      showConfirmation(booking, balanceDate);
    }, SENDING_DELAY);
  });

  function showConfirmation(b, balanceDate) {
    var firstName = b.name.split(/\s+/)[0];
    q(".bk-thanks").textContent = "Thank you, " + firstName + ". Your " + b.destination + " " + b.package + " package is booked.";

    var rows = [
      ["Booking reference", b.reference],
      ["Package", b.destination + " - " + b.package + " (" + b.duration + ")"],
      ["Travel date", niceDate(parseISO(b.travelDate))],
      ["Travelers", b.travelers + " (" + b.travelerType + ")"],
      ["Total price", money(b.total)],
      ["Advance to pay now", money(b.advance)],
      ["Balance due by", money(b.total - b.advance) + " on " + niceDate(balanceDate)],
      ["Payment method", b.paymentMethod]
    ];
    var details = q(".bk-details");
    details.textContent = "";
    for (var i = 0; i < rows.length; i++) {
      var row = document.createElement("div");
      row.className = "bk-row";
      var label = document.createElement("span");
      label.textContent = rows[i][0];
      var value = document.createElement("strong");
      value.textContent = rows[i][1];
      row.appendChild(label);
      row.appendChild(value);
      details.appendChild(row);
    }

    q(".bk-note").textContent =
      "A confirmation will be sent to " + b.email + ". Please send the advance of " + money(b.advance) +
      " through " + b.paymentMethod + " to " + WALLET_NUMBER + " and keep the transaction ID.";

    q("#bk-title").textContent = "Booking confirmed";
    formView.hidden = true;
    confirmView.hidden = false;
    q(".bk-body").scrollTop = 0;
  }
});