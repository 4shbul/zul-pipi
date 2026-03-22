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
const scrollProgressBar = document.getElementById("scroll-progress-bar");
const parallaxElements = document.querySelectorAll("[data-parallax]");
const tiltElements = document.querySelectorAll("[data-tilt]");
const rippleElements = document.querySelectorAll("[data-ripple]");

const weddingDate = new Date(countdownRoot.dataset.date);
const revealDelayMs = 700;
const youtubeVideoId = "ZeFpigRaXbI";
let invitationOpened = false;
let youtubePlayer;
let youtubeReady = false;
let pendingMusicStart = false;
let musicRetryArmed = false;

const musicRetryEvents = ["pointerdown", "touchstart", "keydown"];
const defaultRecipientText = "Kepada Bapak/Ibu/Saudara(i)";

const formatValue = (value) => String(value).padStart(2, "0");
const normalizeGuestName = (value) => value.replace(/\s+/g, " ").trim();

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

const setRecipientName = (guest) => {
  const normalizedGuest = normalizeGuestName(guest || "");

  recipientName.textContent = normalizedGuest
    ? `Kepada Yth. ${normalizedGuest}`
    : defaultRecipientText;
};

const formatRecipient = () => {
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("to") || "";

  setRecipientName(guest);
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

const updateScrollProgress = () => {
  if (!scrollProgressBar) {
    return;
  }

  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

  scrollProgressBar.style.width = `${Math.min(progress, 100)}%`;
};

const attachParallax = (element) => {
  const reset = () => {
    element.style.transform = "";
  };

  element.addEventListener("pointermove", (event) => {
    if (window.innerWidth <= 820) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = y * -8;
    const rotateY = x * 10;

    element.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(${(x * 8).toFixed(2)}px, ${(y * 8).toFixed(2)}px, 0)`;
  });

  element.addEventListener("pointerleave", reset);
  element.addEventListener("pointercancel", reset);
};

const attachTilt = (element) => {
  const reset = () => {
    element.style.transform = "";
  };

  element.addEventListener("pointermove", (event) => {
    if (window.innerWidth <= 920) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = y * -7;
    const rotateY = x * 7;

    element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
  });

  element.addEventListener("pointerleave", reset);
  element.addEventListener("pointercancel", reset);
};

const attachRipple = (element) => {
  element.addEventListener("pointerdown", (event) => {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement("span");

    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    element.appendChild(ripple);

    window.setTimeout(() => {
      ripple.remove();
    }, 700);
  });
};

const removeMusicRetryListeners = () => {
  if (!musicRetryArmed) {
    return;
  }

  musicRetryEvents.forEach((eventName) => {
    document.removeEventListener(eventName, startMusic, true);
  });

  musicRetryArmed = false;
};

const armMusicRetry = () => {
  if (musicRetryArmed) {
    return;
  }

  musicRetryEvents.forEach((eventName) => {
    document.addEventListener(eventName, startMusic, true);
  });

  musicRetryArmed = true;
};

const primeMutedPlayback = () => {
  if (!youtubePlayer || !youtubeReady) {
    return;
  }

  try {
    youtubePlayer.mute();
    youtubePlayer.playVideo();
  } catch (error) {
    // Ignore player errors caused by browser autoplay rules.
  }
};

const createYouTubePlayer = () => {
  if (!backgroundAudio || youtubePlayer || !window.YT?.Player) {
    return;
  }

  youtubePlayer = new window.YT.Player("background-audio", {
    videoId: youtubeVideoId,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      mute: 1,
      playlist: youtubeVideoId,
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady: () => {
        youtubeReady = true;
        primeMutedPlayback();

        if (pendingMusicStart) {
          startMusic();
        }
      },
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.PLAYING && pendingMusicStart) {
          removeMusicRetryListeners();
        }
      },
    },
  });
};

const loadYouTubeAPI = () => {
  if (window.YT?.Player) {
    createYouTubePlayer();
    return;
  }

  if (document.getElementById("youtube-iframe-api")) {
    return;
  }

  const script = document.createElement("script");

  script.id = "youtube-iframe-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);

  window.onYouTubeIframeAPIReady = () => {
    createYouTubePlayer();
  };
};

const startMusic = () => {
  pendingMusicStart = true;

  if (!youtubePlayer || !youtubeReady) {
    armMusicRetry();
    return;
  }

  try {
    youtubePlayer.unMute();
    youtubePlayer.setVolume(100);
    youtubePlayer.playVideo();

    if (typeof youtubePlayer.isMuted === "function" && !youtubePlayer.isMuted()) {
      removeMusicRetryListeners();
    } else {
      armMusicRetry();
    }
  } catch (error) {
    armMusicRetry();
  }
};

const openInvitation = () => {
  if (invitationOpened) {
    return;
  }

  invitationOpened = true;
  body.classList.remove("is-locked");
  openingScreen.classList.add("is-hidden");
  openingScreen.setAttribute("aria-hidden", "true");

  startMusic();

  window.setTimeout(() => {
    openingScreen.style.display = "none";
  }, revealDelayMs);
};

openInvitationButton.addEventListener("click", openInvitation, { once: true });
openInvitationButton.addEventListener("touchend", openInvitation, { once: true });

loadYouTubeAPI();
parallaxElements.forEach(attachParallax);
tiltElements.forEach(attachTilt);
rippleElements.forEach(attachRipple);
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

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
updateScrollProgress();
window.setInterval(updateCountdown, 1000);
