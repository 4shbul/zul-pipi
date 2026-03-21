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

const weddingDate = new Date(countdownRoot.dataset.date);
const revealDelayMs = 700;

let audioContext;
let masterGain;
let musicTimer;
let musicEnabled = false;

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

const playTone = (frequency, startAt, duration, gainValue) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(gainValue, startAt + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
};

const playAmbientPattern = () => {
  if (!audioContext || !masterGain) {
    return;
  }

  const baseTime = audioContext.currentTime + 0.06;
  const chord = [220, 277.18, 329.63, 440];

  chord.forEach((frequency, index) => {
    playTone(frequency, baseTime + index * 0.22, 1.8, 0.018);
  });

  playTone(659.25, baseTime + 0.34, 0.8, 0.012);
};

const startMusic = async () => {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.07;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  window.clearInterval(musicTimer);
  playAmbientPattern();
  musicTimer = window.setInterval(playAmbientPattern, 3200);
  musicEnabled = true;
};

const stopMusic = async () => {
  if (!audioContext) {
    musicEnabled = false;
    return;
  }

  window.clearInterval(musicTimer);

  if (audioContext.state === "running") {
    await audioContext.suspend();
  }

  musicEnabled = false;
};

openInvitationButton.addEventListener("click", async () => {
  body.classList.remove("is-locked");
  openingScreen.classList.add("is-hidden");
  openingScreen.setAttribute("aria-hidden", "true");

  await startMusic();

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
