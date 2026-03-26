import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Loads and decorates the video-background block.
 * Creates a looping, muted, decorative background video.
 * Video URL is configured via block table or Universal Editor properties.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // Support both "video" and "videoUrl" keys (table column name vs model field)
  const videoUrl = config.video || config.videoUrl
    || block.querySelector('a[href]')?.href
    || block.querySelector(':scope div:nth-child(1) > div a')?.href?.trim();

  if (!videoUrl) {
    block.classList.add('inactive');
    return;
  }

  block.textContent = '';

  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');

  const source = document.createElement('source');
  source.setAttribute('src', videoUrl);
  source.setAttribute('type', 'video/mp4');
  video.append(source);

  // Mute required for autoplay in most browsers
  video.muted = true;

  video.addEventListener('canplay', () => {
    video.play().catch(() => {});
  });

  block.append(video);
}
