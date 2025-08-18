function createOverlay(image) {
  const overlayImage = document.createElement('img');
  overlayImage.setAttribute('src', `${image.src}`);
  const overlay = document.createElement('div');
  prepareOverlay(overlay, overlayImage);

  overlayImage.onload = () => {
    image.parentElement.insertBefore(overlay, image);
  };

  return overlay;
}

function prepareOverlay(container, image) {
  container.setAttribute('class', 'image-magnify-full-size');
  container.setAttribute('aria-hidden', 'true');
  container.style.backgroundImage = `url('${image.src}')`;
  container.style.backgroundColor = 'var(--gradient-background)';
}

function moveWithHover(overlay, image, event, zoomRatio) {
  const ratio = image.height / image.width;
  const container = image.getBoundingClientRect();
  const xPosition = event.clientX - container.left;
  const yPosition = event.clientY - container.top;
  const xPercent = `${xPosition / (image.clientWidth / 100)}%`;
  const yPercent = `${yPosition / ((image.clientWidth * ratio) / 100)}%`;

  overlay.style.backgroundPosition = `${xPercent} ${yPercent}`;
  overlay.style.backgroundSize = `${image.width * zoomRatio}px`;
}

function magnifyOnHover(image, zoomRatio) {
  let overlay;

  image.addEventListener('mouseover', (event) => {
    overlay = createOverlay(image);
    moveWithHover(overlay, image, event, zoomRatio);

    overlay.onmousemove = (e) => moveWithHover(overlay, image, e, zoomRatio);
    overlay.onmouseleave = () => overlay.remove();
  });
}

function enableZoomOnHover(zoomRatio) {
  const images = document.querySelectorAll('.image-magnify-hover');
  images.forEach((image) => {
    magnifyOnHover(image, zoomRatio);
  });
}

enableZoomOnHover(2);
