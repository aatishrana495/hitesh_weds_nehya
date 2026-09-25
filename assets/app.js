(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const config = window.WEDDING_CONFIG || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const welcome = document.querySelector("#welcome");
  const openInvitation = document.querySelector("#open-invitation");
  if (welcome && openInvitation && typeof welcome.showModal === "function") {
    welcome.showModal();
    openInvitation.addEventListener("click", () => {
      welcome.close();
      document.querySelector("#main")?.focus({ preventScroll: true });
    });
  }

  const revealElements = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));
  }

  const weddingTime = new Date(document.querySelector("#wedding-date")?.dateTime || "").getTime();
  const countdown = document.querySelector("#countdown");
  const countdownMessage = document.querySelector("#countdown-message");
  let countdownTimer;
  const setCount = (id, value) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = String(value).padStart(2, "0");
  };
  const updateCountdown = () => {
    if (!Number.isFinite(weddingTime)) return;
    const remaining = weddingTime - Date.now();
    if (remaining <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((id) => setCount(id, 0));
      if (countdown) countdown.hidden = true;
      if (countdownMessage) countdownMessage.textContent = "Today, our forever begins. Thank you for celebrating with us.";
      if (countdownTimer) window.clearInterval(countdownTimer);
      return;
    }
    const day = 86_400_000;
    const hour = 3_600_000;
    const minute = 60_000;
    setCount("days", Math.floor(remaining / day));
    setCount("hours", Math.floor((remaining % day) / hour));
    setCount("minutes", Math.floor((remaining % hour) / minute));
    setCount("seconds", Math.floor((remaining % minute) / 1000));
  };
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
  document.addEventListener("visibilitychange", () => {
    window.clearInterval(countdownTimer);
    if (!document.hidden) {
      updateCountdown();
      countdownTimer = window.setInterval(updateCountdown, 1000);
    }
  });

  const track = document.querySelector("#carousel-track");
  const slides = [...document.querySelectorAll(".slide")];
  const slideStatus = document.querySelector("#slide-status");
  let currentSlide = 0;
  const showSlide = (index) => {
    if (!track || !slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    track.dataset.index = String(currentSlide);
    slides.forEach((slide, slideIndex) => slide.setAttribute("aria-hidden", String(slideIndex !== currentSlide)));
    if (slideStatus) slideStatus.textContent = `Story card ${currentSlide + 1} of ${slides.length}`;
  };
  document.querySelector("#previous-slide")?.addEventListener("click", () => showSlide(currentSlide - 1));
  document.querySelector("#next-slide")?.addEventListener("click", () => showSlide(currentSlide + 1));
  track?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
    if (event.key === "ArrowRight") showSlide(currentSlide + 1);
  });

  document.querySelectorAll(".calendar-button").forEach((button) => {
    button.addEventListener("click", () => {
      const escapeIcs = (value) => String(value).replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hitesh and Nehya//Wedding Invitation//EN",
        "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${button.dataset.start}-${button.dataset.title}@hitesh-nehya-wedding`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
        `DTSTART:${button.dataset.start}`, `DTEND:${button.dataset.end}`,
        `SUMMARY:${escapeIcs(button.dataset.title)}`, `LOCATION:${escapeIcs(config.venueSummary || "Hyderabad, India")}`,
        "DESCRIPTION:Exact venue details will be shared directly with confirmed guests.", "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${button.dataset.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });

  const attendance = document.querySelector("#attendance");
  const guestCount = document.querySelector("#guest-count");
  const guestCountField = document.querySelector("#guest-count-field");
  const syncGuestCount = () => {
    const isDeclining = attendance?.value === "declined";
    if (guestCount) {
      guestCount.disabled = isDeclining;
      guestCount.required = !isDeclining;
      if (isDeclining) guestCount.value = "";
    }
    if (guestCountField) guestCountField.hidden = isDeclining;
  };
  attendance?.addEventListener("change", syncGuestCount);

  const form = document.querySelector("#rsvp-form");
  const status = document.querySelector("#form-status");
  const submitButton = document.querySelector("#rsvp-submit");
  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
    status.focus();
  };
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncGuestCount();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please complete the required fields before sending your RSVP.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    data.event = "Hitesh and Nehya wedding — 24 October 2026";

    if (config.rsvpEndpoint) {
      submitButton.disabled = true;
      setStatus("Sending your RSVP…");
      try {
        const response = await fetch(config.rsvpEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`RSVP endpoint returned ${response.status}`);
        form.reset();
        syncGuestCount();
        setStatus(data.attendance === "declined"
          ? "Your response has been received. Thank you for letting us know—you will be missed."
          : "Your RSVP has been received. We look forward to celebrating with you!", "success");
      } catch (error) {
        console.error("RSVP submission failed", error);
        setStatus("We could not send your RSVP. Please check your connection and try again, or contact the families directly.", "error");
      } finally {
        submitButton.disabled = false;
      }
      return;
    }
    if (config.whatsappNumber) {
      const message = ["Wedding RSVP — Hitesh & Nehya", `Guest: ${data.name}`, `Response: ${data.attendance}`, `Guests: ${data.guestCount || "Not attending"}`, `Contact: ${data.contact}`, `Notes: ${data.notes || "None"}`].join("\n");
      const whatsappUrl = `https://wa.me/${encodeURIComponent(config.whatsappNumber)}?text=${encodeURIComponent(message)}`;
      const popup = window.open("", "_blank");
      if (popup) {
        popup.opener = null;
        popup.location.replace(whatsappUrl);
        setStatus("WhatsApp has opened. Please press Send there to complete your RSVP; it is not confirmed until the message is sent.", "notice");
      } else {
        setStatus("Your browser blocked WhatsApp. Please allow the new window and try again.", "error");
      }
      return;
    }
    setStatus("Online RSVP is not configured yet. Please contact the wedding families directly. Site owner: add an endpoint or WhatsApp number in assets/config.js.", "error");
  });
})();
