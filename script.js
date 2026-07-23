const dialog = document.querySelector('#lightbox');
const modalImage = dialog.querySelector('img');
const modalCaption = dialog.querySelector('p');
document.querySelectorAll('.gallery-image').forEach((item) => {
  item.addEventListener('click', () => {
    const image = item.querySelector('img');
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    modalCaption.textContent = item.dataset.caption;
    dialog.showModal();
  });
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

const fanMailDialog = document.querySelector('#fan-mail');
const fanLetter = document.querySelector('#fan-letter');
const mailStatus = document.querySelector('#mail-status');
const recipient = 'oab@fcbarcelona.cat';
const subject = 'Fan mail for Lamine Yamal';
document.querySelector('[data-fan-mail]').addEventListener('click', (event) => {
  event.preventDefault();
  fanMailDialog.showModal();
});
fanMailDialog.querySelector('.close').addEventListener('click', () => fanMailDialog.close());
fanMailDialog.addEventListener('click', (event) => { if (event.target === fanMailDialog) fanMailDialog.close(); });
document.querySelector('#copy-letter').addEventListener('click', async () => {
  const content = `To: ${recipient}\nSubject: ${subject}\n\n${fanLetter.value}`;
  try {
    await navigator.clipboard.writeText(content);
    mailStatus.textContent = 'Copied — paste it into any email service.';
  } catch {
    fanLetter.select();
    document.execCommand('copy');
    mailStatus.textContent = 'Letter selected and copied — paste it into any email service.';
  }
});
document.querySelector('#open-mail').addEventListener('click', () => {
  const url = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fanLetter.value)}`;
  window.location.href = url;
  mailStatus.textContent = 'Trying to open your email app. If nothing opens, use Copy letter instead.';
});
