function embedYoutube(url, autoplay, background) {
 const usp = new URLSearchParams(url.search);
 let suffix = '';
 if (background || autoplay) {
 const suffixParams = {
 autoplay: autoplay ? '1' : '0',
 mute: background ? '1' : '0',
 controls: background ? '0' : '1',
 disablekb: background ? '1' : '0',
 loop: background ? '1' : '0',
 playsinline: background ? '1' : '0',
 };
 suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
 }
 let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
 const embed = url.pathname;
 if (url.origin.includes('youtu.be')) {
 [, vid] = url.pathname.split('/');
 }

 const temp = document.createElement('div');
 temp.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${vid}?rel=0${suffix}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
 return temp.children.item(0);
}

function getVideoElement(source, autoplay, background) {
 const video = document.createElement('video');
 video.setAttribute('controls', '');
 if (autoplay) video.setAttribute('autoplay', '');
 if (background) {
 video.setAttribute('loop', '');
 video.setAttribute('playsinline', '');
 video.removeAttribute('controls');
 video.addEventListener('canplay', () => {
 video.muted = true;
 if (autoplay) video.play();
 });
 }

 const sourceEl = document.createElement('source');
 sourceEl.setAttribute('src', source);
 sourceEl.setAttribute('type', `video/mp4`);
 video.append(sourceEl);

 return video;
}

const loadVideoEmbed = (block, link, autoplay, background) => {
 const isYoutube = link.includes('youtube') || link.includes('youtu.be');
 if (isYoutube) {
 const url = new URL(link);
 const embedWrapper = embedYoutube(url, autoplay, background);
 block.append(embedWrapper);
 embedWrapper.querySelector('iframe').addEventListener('load', () => {
 block.dataset.embedLoaded = true;
 });
 } else {
 const videoEl = getVideoElement(link, autoplay, background);
 block.append(videoEl);
 videoEl.addEventListener('canplay', () => {
 block.dataset.embedLoaded = true;
 });
 }
};

export default function decorate(block) {
 console.log("video component called successfully");
 const link = block.querySelector(':scope div:nth-child(1) > div a')?.innerHTML?.trim();
 if (!link) return;
 console.log("link", link);
 block.textContent = '';
 block.dataset.embedLoaded = false;
 const autoplay = block.classList ? block.classList.contains('autoplay') : false;
 const playOnLoad = block.classList ? block.classList.contains('playonload') : false;
 loadVideoEmbed(block, link, playOnLoad, autoplay);
}
