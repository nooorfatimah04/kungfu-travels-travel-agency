/* KungFu Travels: navigation dropdowns (Destinations, Booking)
   1) Turns the "Booking" link in the header into a dropdown automatically,
      so no page needs to be edited by hand.
   2) Opens and closes every element with the class "nav-dropdown". */
document.addEventListener("DOMContentLoaded", function () {
  // ----- 1) Build the Booking dropdown from the normal Booking link -----
  var BOOKING_MENU = [
    ["Booking process", "booking-process.html"],
    ["Pricing and payment", "pricing-payment.html"],
    ["Payment options", "booking.html#payment-title"],
    ["FAQs", "faq.html"]
  ];

  var mainNav = document.querySelector(".main-nav");
  if (mainNav) {
    for (var n = 0; n < mainNav.children.length; n++) {
      var link = mainNav.children[n];
      var href = link.getAttribute("href") || "";
      // Only a plain link in the header (not one already inside a dropdown)
      if (link.tagName === "A" && /booking\.html$/.test(href)) {
        var prefix = href.slice(0, href.length - "booking.html".length); // "" or "pages/"

        var wrapper = document.createElement("div");
        wrapper.className = "nav-dropdown";
        mainNav.insertBefore(wrapper, link);
        wrapper.appendChild(link); // keeps aria-current on the Booking link

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "dropdown-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Show booking menu");
        toggle.innerHTML = "&#9662;";
        wrapper.appendChild(toggle);

        var menu = document.createElement("ul");
        menu.className = "dropdown-menu";
        for (var m = 0; m < BOOKING_MENU.length; m++) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.textContent = BOOKING_MENU[m][0];
          a.href = prefix + BOOKING_MENU[m][1];
          li.appendChild(a);
          menu.appendChild(li);
        }
        wrapper.appendChild(menu);
        break;
      }
    }
  }

  // ----- 2) Open / close behaviour for all dropdowns -----
  var dropdowns = document.querySelectorAll(".nav-dropdown");
  if (!dropdowns.length) return;

  function close(dropdown) {
    dropdown.classList.remove("open");
    var toggle = dropdown.querySelector(".dropdown-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function closeAll(except) {
    for (var i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i] !== except) close(dropdowns[i]);
    }
  }

  for (var i = 0; i < dropdowns.length; i++) {
    (function (dropdown) {
      var toggle = dropdown.querySelector(".dropdown-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", function (event) {
        event.stopPropagation();
        var willOpen = !dropdown.classList.contains("open");
        closeAll(dropdown);
        dropdown.classList.toggle("open", willOpen);
        toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
        // Without this the menu stays open while the button keeps focus
        if (!willOpen) toggle.blur();
      });
    })(dropdowns[i]);
  }

  // Click anywhere else closes the menus
  document.addEventListener("click", function () {
    closeAll(null);
  });

  // Esc closes the menus
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAll(null);
      if (document.activeElement && document.activeElement.closest(".nav-dropdown")) {
        document.activeElement.blur();
      }
    }
  });
});