const getDefaultEmbed = (url) => `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;

const loadEmbed = (block, link) => {
 if (block.classList.contains('embed-is-loaded')) {
 return;
 }

 const url = new URL(link);
 block.innerHTML = getDefaultEmbed(url);
 block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
 const props = [...block.children].map((row) => row.firstElementChild);
 const appUrl = props[0]?.textContent;

 if (!appUrl) return;

 const observer = new IntersectionObserver((entries) => {
 if (entries.some((e) => e.isIntersecting)) {
 observer.disconnect();
 loadEmbed(block, appUrl);
 }
 });
 observer.observe(block);
}
