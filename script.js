const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -40px 0px",
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});

const body = document.body;
const openingScreen = document.getElementById("opening-screen");
const openInvitationButton = document.getElementById("open-invitation");
const countdownRoot = document.getElementById("countdown");
const countdownNote = document.getElementById("countdown-note");
const recipientName = document.getElementById("recipient-name");
const copyButtons = document.querySelectorAll("[data-copy]");
const backgroundAudio = document.getElementById("background-audio");

const weddingDate = new Date(countdownRoot.dataset.date);
const revealDelayMs = 700;
const backgroundMusicUrl =
  "https://www.youtube-nocookie.com/embed/ZeFpigRaXbI?autoplay=1&loop=1&playlist=ZeFpigRaXbI&controls=0&modestbranding=1&rel=0";

const formatValue = (value) => String(value).padStart(2, "0");

const fallbackCopyText = (value) => {
  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    return true;
  } catch (error) {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};

const formatRecipient = () => {
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("to");

  if (!guest) {
    recipientName.textContent = "Kepada Bapak/Ibu/Saudara(i)";
    return;
  }

  recipientName.textContent = `Kepada Yth. ${guest}`;
};

const updateCountdown = () => {
  const diff = weddingDate.getTime() - Date.now();

  if (diff <= 0) {
    countdownRoot.querySelector('[data-unit="days"]').textContent = "00";
    countdownRoot.querySelector('[data-unit="hours"]').textContent = "00";
    countdownRoot.querySelector('[data-unit="minutes"]').textContent = "00";
    countdownRoot.querySelector('[data-unit="seconds"]').textContent = "00";
    countdownNote.textContent =
      "Acara akad sedang berlangsung atau telah dimulai. Terima kasih atas doa dan kehadirannya.";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownRoot.querySelector('[data-unit="days"]').textContent = formatValue(days);
  countdownRoot.querySelector('[data-unit="hours"]').textContent = formatValue(hours);
  countdownRoot.querySelector('[data-unit="minutes"]').textContent = formatValue(minutes);
  countdownRoot.querySelector('[data-unit="seconds"]').textContent = formatValue(seconds);
};

const startMusic = () => {
  if (!backgroundAudio || backgroundAudio.src) {
    return;
  }

  backgroundAudio.src = backgroundMusicUrl;
};

openInvitationButton.addEventListener("click", () => {
  body.classList.remove("is-locked");
  openingScreen.classList.add("is-hidden");
  openingScreen.setAttribute("aria-hidden", "true");

  startMusic();

  window.setTimeout(() => {
    openingScreen.style.display = "none";
  }, revealDelayMs);
});

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const copyValue = button.dataset.copy;
    const originalText = button.textContent;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyValue);
      } else if (!fallbackCopyText(copyValue)) {
        throw new Error("Clipboard unavailable");
      }

      button.textContent = "Berhasil Disalin";
      button.classList.add("is-copied");
    } catch (error) {
      button.textContent = "Salin Manual";
    }

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("is-copied");
    }, 1800);
  });
});

formatRecipient();
updateCountdown();
window.setInterval(updateCountdown, 1000);
