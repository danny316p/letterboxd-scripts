// ==UserScript==
// @name         Letterboxd Wikipedia Link
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds a link to Wikipedia on each Letterboxd movie page
// @author       You
// @match        https://letterboxd.com/film/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function log(message, data) {
        if (data) {
            console.log('[Wikipedia Link]', message, data);
        } else {
            console.log('[Wikipedia Link]', message);
        }
    }

    // Function to get movie info from meta tags
    function getMovieInfoFromMeta() {
        log('Looking for movie info in meta tags...');
        
        // Primary source - this seems to work based on your feedback
        const nameAndYearMeta = document.querySelector('meta[name="production:name-and-year"]');
        if (nameAndYearMeta) {
            const content = nameAndYearMeta.getAttribute('content');
            log('Found production:name-and-year meta:', content);
            
            // Parse the content - format is usually "Movie Title (Year)"
            const match = content.match(/^(.+?)\s*\((\d{4})\)$/);
            if (match) {
                const title = match[1].trim();
                const year = match[2];
                log('Parsed title:', title);
                log('Parsed year:', year);
                return { title, year };
            }
            // If no year in parentheses, just use the whole content as title
            return { title: content.trim(), year: null };
        }

        // Fallback: Try other meta tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            const content = ogTitle.getAttribute('content');
            if (content) {
                // Remove " - Letterboxd" suffix if present
                const cleanTitle = content.replace(/\s*[-–]\s*Letterboxd$/, '').trim();
                log('Found title from og:title:', cleanTitle);
                return { title: cleanTitle, year: null };
            }
        }

        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
            const content = twitterTitle.getAttribute('content');
            if (content) {
                const cleanTitle = content.replace(/\s*[-–]\s*Letterboxd$/, '').trim();
                log('Found title from twitter:title:', cleanTitle);
                return { title: cleanTitle, year: null };
            }
        }

        log('No meta tags found');
        return null;
    }

    // Get release year from meta tags
    function getYearFromMeta() {
        // Try the production:name-and-year meta first
        const nameAndYearMeta = document.querySelector('meta[name="production:name-and-year"]');
        if (nameAndYearMeta) {
            const content = nameAndYearMeta.getAttribute('content');
            const yearMatch = content.match(/\((\d{4})\)/);
            if (yearMatch) {
                return yearMatch[1];
            }
        }

        // Try other common meta tags
        const selectors = [
            'meta[property="video:release_date"]',
            'meta[name="production:release-date"]',
            'meta[name="production:year"]'
        ];

        for (const selector of selectors) {
            const meta = document.querySelector(selector);
            if (meta) {
                const content = meta.getAttribute('content');
                const yearMatch = content.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) {
                    return yearMatch[0];
                }
            }
        }

        return null;
    }

    // Function to get Wikipedia URL
    function getWikipediaUrl(title, year) {
        // Clean the title
        let cleanTitle = title
            .replace(/\(.*?\)/g, '') // Remove content in parentheses
            .replace(/[\[{].*?[\]}]/g, '') // Remove brackets and braces
            .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
            .trim()
            .replace(/\s+/g, '_'); // Replace spaces with underscores

        // If we have a year, try the specific format
        if (year) {
            const url = `https://en.wikipedia.org/wiki/${cleanTitle}_(${year}_film)`;
            log('Generated Wikipedia URL with year:', url);
            return url;
        }

        // Try without year
        const url = `https://en.wikipedia.org/wiki/${cleanTitle}`;
        log('Generated Wikipedia URL without year:', url);
        return url;
    }

    // Main function to add the Wikipedia link
    function addWikipediaLink() {
        log('Attempting to add Wikipedia link...');

        // Check if link already exists
        if (document.querySelector('.wikipedia-link-container')) {
            log('Link already exists');
            return;
        }

        // Get movie info from meta tags
        const movieInfo = getMovieInfoFromMeta();
        if (!movieInfo || !movieInfo.title) {
            log('Failed to get movie info from meta tags');
            return;
        }

        const title = movieInfo.title;
        let year = movieInfo.year;

        // If no year found, try to get it from other meta tags
        if (!year) {
            year = getYearFromMeta();
            log('Year from other meta sources:', year || 'Not found');
        }

        // Get Wikipedia URL
        const wikiUrl = getWikipediaUrl(title, year);
        const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + ' ' + (year || 'film'))}`;

        // Find a good place to insert the link
        let insertPoint = document.querySelector('.movie-title-wrapper');
        if (!insertPoint) {
            insertPoint = document.querySelector('.film-title');
        }
        if (!insertPoint) {
            insertPoint = document.querySelector('.film-header');
        }
        if (!insertPoint) {
            insertPoint = document.querySelector('.film-details');
        }
        if (!insertPoint) {
            insertPoint = document.querySelector('.poster + div');
        }
        if (!insertPoint) {
            insertPoint = document.querySelector('.js-film-page .col-17');
        }
        if (!insertPoint) {
            const metaContainer = document.querySelector('meta[name="production:name-and-year"]')?.parentElement;
            if (metaContainer) {
                insertPoint = metaContainer;
            }
        }

        if (!insertPoint) {
            log('No suitable insertion point found, using body');
            insertPoint = document.body;
        }

        // Create the link container
        const linkContainer = document.createElement('div');
        linkContainer.className = 'wikipedia-link-container';
        linkContainer.style.cssText = `
            margin: 15px 0;
            padding: 10px 0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        `;

        // Create the main Wikipedia link
        const link = document.createElement('a');
        link.href = wikiUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '📖 View on Wikipedia';
        link.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background-color: #ffffff;
            color: #0066cc;
            border-radius: 6px;
            border: 2px solid #e0e0e0;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        // Hover effects
        link.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f7ff';
            this.style.borderColor = '#0066cc';
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 8px rgba(0,102,204,0.15)';
        });

        link.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#ffffff';
            this.style.borderColor = '#e0e0e0';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });

        // Create a fallback search link
        const searchLink = document.createElement('a');
        searchLink.href = searchUrl;
        searchLink.target = '_blank';
        searchLink.rel = 'noopener noreferrer';
        searchLink.textContent = '🔍 Search Wikipedia';
        searchLink.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background-color: #f8f9fa;
            color: #666;
            border-radius: 6px;
            border: 2px solid #e0e0e0;
            text-decoration: none;
            font-weight: 500;
            font-size: 13px;
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        searchLink.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e9ecef';
            this.style.borderColor = '#999';
        });

        searchLink.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.borderColor = '#e0e0e0';
        });

        // Add info text about what's being searched
        const infoText = document.createElement('span');
        infoText.textContent = `"${title}${year ? ' (' + year + ')' : ''}"`;
        infoText.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-left: 5px;
        `;

        // Add links to container
        linkContainer.appendChild(link);
        linkContainer.appendChild(searchLink);
        linkContainer.appendChild(infoText);

        // Insert the link
        try {
            if (insertPoint && insertPoint.parentNode) {
                // Try to insert after the insertion point
                insertPoint.parentNode.insertBefore(linkContainer, insertPoint.nextSibling);
            } else {
                // Fallback: append to body
                document.body.appendChild(linkContainer);
            }
            log('Link inserted successfully');
            log('Movie:', title, year || '');
            log('Wikipedia URL:', wikiUrl);
        } catch (e) {
            log('Error inserting link:', e);
            document.body.appendChild(linkContainer);
        }
    }

    // Wait for the page to load
    function waitForPageLoad() {
        log('Waiting for page to load...');
        
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            // Check if the meta tag exists
            const metaTag = document.querySelector('meta[name="production:name-and-year"]');
            
            if (metaTag || document.readyState === 'complete') {
                log('Page ready, adding Wikipedia link...');
                clearInterval(checkInterval);
                // Wait a bit more for dynamic content
                setTimeout(addWikipediaLink, 500);
            } else if (attempts >= maxAttempts) {
                log('Max attempts reached, trying to add link anyway...');
                clearInterval(checkInterval);
                addWikipediaLink();
            }
        }, 500);
    }

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForPageLoad);
    } else {
        waitForPageLoad();
    }

    // Handle URL changes (for Letterboxd's SPA navigation)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl && currentUrl.includes('/film/')) {
            log('URL changed, re-adding link...');
            lastUrl = currentUrl;
            // Remove old links
            document.querySelectorAll('.wikipedia-link-container').forEach(el => el.remove());
            setTimeout(waitForPageLoad, 1000);
        }
    });

    observer.observe(document.body, { 
        subtree: true, 
        childList: true,
        attributes: true
    });

    log('Letterboxd Wikipedia Link script loaded');
    log('Current URL:', location.href);
})();