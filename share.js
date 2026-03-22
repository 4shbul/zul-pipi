const shareForm = document.getElementById("share-form");
const guestNameInput = document.getElementById("guest-name");
const messageIntroInput = document.getElementById("message-intro");
const inviteLinkInput = document.getElementById("invite-link");
const messagePreview = document.getElementById("message-preview");
const previewRecipient = document.getElementById("preview-recipient");
const copyMessageButton = document.getElementById("copy-message");
const copyLinkButton = document.getElementById("copy-link");
const openWhatsappButton = document.getElementById("open-whatsapp");

const defaultGuest = "Bapak/Ibu/Saudara(i)";
const defaultIntro = messageIntroInput.value;

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

const copyText = async (value) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (!fallbackCopyText(value)) {
    throw new Error("Clipboard unavailable");
  }
};

const flashButton = (button, successText) => {
  const originalText = button.textContent;

  button.textContent = successText;
  button.classList.add("is-copied");

  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("is-copied");
  }, 1800);
};

const getInviteUrl = (guest) => {
  const currentUrl = new URL(window.location.href);
  const inviteUrl = new URL("index.html", currentUrl);

  if (guest) {
    inviteUrl.searchParams.set("to", guest);
  }

  return inviteUrl.toString();
};

const buildMessage = () => {
  const guest = normalizeGuestName(guestNameInput.value) || defaultGuest;
  const intro = (messageIntroInput.value || defaultIntro).trim();
  const inviteUrl = getInviteUrl(guest === defaultGuest ? "" : guest);
  const text = intro.replace(/\{guest\}/g, guest);
  const message = `${text}\n\n${inviteUrl}`;

  inviteLinkInput.value = inviteUrl;
  previewRecipient.textContent = `Untuk: ${guest}`;
  messagePreview.textContent = message;
  openWhatsappButton.href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return { inviteUrl, message };
};

shareForm.addEventListener("submit", (event) => {
  event.preventDefault();
  buildMessage();
});

guestNameInput.addEventListener("input", buildMessage);
messageIntroInput.addEventListener("input", buildMessage);

copyMessageButton.addEventListener("click", async () => {
  const { message } = buildMessage();

  try {
    await copyText(message);
    flashButton(copyMessageButton, "Pesan Tersalin");
  } catch (error) {
    copyMessageButton.textContent = "Salin Manual";
  }
});

copyLinkButton.addEventListener("click", async () => {
  const { inviteUrl } = buildMessage();

  try {
    await copyText(inviteUrl);
    flashButton(copyLinkButton, "Link Tersalin");
  } catch (error) {
    copyLinkButton.textContent = "Salin Manual";
  }
});

buildMessage();
