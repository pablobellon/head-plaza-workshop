---
title: "Shotdeck bookmarklet"
description: ""
---

```js
javascript:(function(){
    const slugify = (str) => {
        return str.toString().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w-]+/g, '')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
    };

    const rgbToHex = (rgb) => {
        const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+\.?\d*)?\)$/);
        if (!match) return rgb;
        const hex = (x) => parseInt(x).toString(16).padStart(2, '0');
        return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
    };

    const extractDetails = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const details = {};
        
        // Extract standard details as arrays
        doc.querySelectorAll('.detail-group').forEach(group => {
            const key = group.querySelector('.detail-type').textContent
                .replace(':', '').trim().toLowerCase()
                .replace(/\//g, '_')
                .replace(/\W+/g, '_');
            
            const values = Array.from(group.querySelectorAll('.details a, .details span'))
                .map(el => el.textContent.trim())
                .filter(t => t.length > 0);

            if (values.length > 0) details[key] = values;
        });

        // Extract filming location as string
        const fullLocation = doc.querySelector('.full_filming_location');
        details.filming_location = fullLocation ? 
            fullLocation.textContent.trim().replace(/\s+/g, ' ') : 
            doc.querySelector('.short_filming_location').textContent.trim();

        // Extract color palette as array
        details.color_palette = Array.from(doc.querySelectorAll('.palette a'))
            .map(a => rgbToHex(a.style.backgroundColor).toUpperCase());

        return details;
    };

    const handleClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const entry = event.currentTarget;
        const shotId = entry.dataset.shotid;
        
        const titleElement = entry.querySelector('.gallerytitle a');
        const title = titleElement?.textContent.trim() || 'Untitled';
        const year = entry.dataset.titleyear || 'unknown_year';
        const filename = entry.querySelector('a.gallerythumb')?.dataset.filename.split('.')[0] || 'unknown';

        try {
            const response = await fetch(`/browse/shotdetailsajax/image/${shotId}/deck/0`);
            const html = await response.text();
            const details = extractDetails(html);
            
            const result = {
                title: title,
                year: year,
                status: entry.dataset.titleContentStatus,
                filename: filename,
                ...details
            };

            const slugTitle = slugify(title);
            const slugYear = slugify(year);
            const slugFilename = slugify(filename);
            const finalFilename = `${slugYear}_${slugTitle}_${slugFilename}.jsonld`;
            
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/ld+json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error processing entry:', error);
        }
    };

    const activateListeners = () => {
        document.querySelectorAll('.jg-entry.outerimage:not(.bookmarklet-processed)').forEach(entry => {
            entry.classList.add('bookmarklet-processed');
            entry.style.cssText = 'cursor: pointer; outline: 2px solid rgba(0,150,255,0.3); transition: transform 0.2s;';
            entry.addEventListener('click', handleClick);
            entry.addEventListener('mouseover', () => entry.style.transform = 'scale(1.02)');
            entry.addEventListener('mouseout', () => entry.style.transform = 'scale(1)');
        });
    };

    // Add keyboard shortcut (press 'a' to activate listeners)
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'a') {
            activateListeners();
            // Show temporary notification
            const notification = document.createElement('div');
            notification.style = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #2196F3; color: white; border-radius: 5px; z-index: 9999;';
            notification.textContent = 'Click listeners activated! Click any image to download.';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        }
    });

    // Initial notification
    const initialNotification = document.createElement('div');
    initialNotification.style = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #4CAF50; color: white; border-radius: 5px; z-index: 9999;';
    initialNotification.textContent = 'Press "A" to activate image click listeners!';
    document.body.appendChild(initialNotification);
    setTimeout(() => initialNotification.remove(), 3000);
})();

```
