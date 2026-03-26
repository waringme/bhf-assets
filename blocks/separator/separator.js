export default function decorate(block) {
 // Get style and spacing values from block data
 const style = block.querySelectorAll('.separator > div')[0]?.textContent?.trim();
 const spacing = block.querySelectorAll('.separator > div')[1]?.textContent?.trim();

 // Create wrapper div and separator line
 const wrapper = document.createElement('div');
 wrapper.className = 'separator-block';
 if (style) wrapper.classList.add(style);
 if (spacing) wrapper.classList.add(spacing);
 
 // Create the actual separator line element
 const separatorLine = document.createElement('div');
 separatorLine.className = 'separator-line';
 wrapper.appendChild(separatorLine);

 // Replace block content with wrapper
 block.textContent = '';
 block.appendChild(wrapper);
}
