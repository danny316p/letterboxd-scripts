// ==UserScript==
// @name         Letterboxd Wikipedia Link
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Adds a Wikipedia button next to IMDb and TMDB on Letterboxd movie pages
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
        
        // Primary source - production:name-and-year meta
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
                const cleanTitle = content.replace(/\s*[-–]\s*Letterboxd$/, '').trim();
                log('Found title from og:title:', cleanTitle);
                return { title: cleanTitle, year: null };
            }
        }

        log('No meta tags found');
        return null;
    }

    // Get release year from meta tags
    function getYearFromMeta() {
        const nameAndYearMeta = document.querySelector('meta[name="production:name-and-year"]');
        if (nameAndYearMeta) {
            const content = nameAndYearMeta.getAttribute('content');
            const yearMatch = content.match(/\((\d{4})\)/);
            if (yearMatch) {
                return yearMatch[1];
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
            return `https://en.wikipedia.org/wiki/${cleanTitle}_(${year}_film)`;
        }

        // Try without year
        return `https://en.wikipedia.org/wiki/${cleanTitle}`;
    }

    // Main function to add the Wikipedia button
    function addWikipediaButton() {
        log('Attempting to add Wikipedia button...');

        // Check if button already exists
        if (document.querySelector('.wikipedia-button')) {
            log('Button already exists');
            return;
        }

        // Find the "More at" section - look for the text node containing "More at"
        let moreAtContainer = null;
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.textContent.trim() === 'More at') {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        let textNode = walker.nextNode();
        if (textNode) {
            // The parent of the text node should be the container
            const parent = textNode.parentNode;
            if (parent) {
                // The parent should contain the links as well
                // Look for the next sibling or parent that contains the links
                let container = parent;
                if (container.querySelector('a.micro-button') || container.querySelector('.micro-button')) {
                    moreAtContainer = container;
                    log('Found "More at" container:', container);
                } else {
                    // The links might be in the parent's parent or next sibling
                    const nextSibling = parent.nextSibling;
                    if (nextSibling && nextSibling.querySelector && nextSibling.querySelector('.micro-button')) {
                        moreAtContainer = nextSibling;
                        log('Found "More at" container in next sibling');
                    } else if (parent.parentNode && parent.parentNode.querySelector && parent.parentNode.querySelector('.micro-button')) {
                        moreAtContainer = parent.parentNode;
                        log('Found "More at" container in parent node');
                    }
                }
            }
        }

        // If we couldn't find it via tree walker, try direct selectors
        if (!moreAtContainer) {
            log('Trying direct selectors...');
            // Try to find by looking for elements containing "IMDb" links
            const imdbLinks = document.querySelectorAll('a[href*="imdb.com"]');
            for (const link of imdbLinks) {
                // Check if this is in the "More at" section
                const parent = link.closest('.text-sluglist') || link.parentNode;
                if (parent) {
                    // Check if this parent contains "More at" text
                    const parentText = parent.textContent || '';
                    if (parentText.includes('More at')) {
                        moreAtContainer = parent;
                        log('Found container via IMDb link search');
                        break;
                    }
                }
            }
        }

        // If still not found, try by looking for the class
        if (!moreAtContainer) {
            const textSluglist = document.querySelector('.text-sluglist');
            if (textSluglist) {
                moreAtContainer = textSluglist;
                log('Found container via .text-sluglist class');
            }
        }

        if (!moreAtContainer) {
            log('Could not find "More at" section');
            return;
        }

        // Get movie info
        const movieInfo = getMovieInfoFromMeta();
        if (!movieInfo || !movieInfo.title) {
            log('Failed to get movie info from meta tags');
            return;
        }

        const title = movieInfo.title;
        let year = movieInfo.year;
        if (!year) {
            year = getYearFromMeta();
        }

        // Get Wikipedia URL
        const wikiUrl = getWikipediaUrl(title, year);
        log('Wikipedia URL:', wikiUrl);

        // Create the Wikipedia button - matching the style of existing buttons
        const wikiLink = document.createElement('a');
        wikiLink.href = wikiUrl;
        wikiLink.target = '_blank';
        wikiLink.rel = 'noopener noreferrer';
        wikiLink.className = 'micro-button track-event wikipedia-button';
        wikiLink.setAttribute('data-track-action', 'Wikipedia');
        wikiLink.textContent = 'Wikipedia';
        wikiLink.style.cssText = `
            display: inline-block;
            margin-left: 4px;
            background-color: #000000;
            color: #ffffff !important;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none !important;
            padding: 2px 10px;
            line-height: 1.8;
            vertical-align: middle;
            transition: all 0.15s ease;
            border: none;
        `;

        // Hover effect
        wikiLink.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#3366cc';
            this.style.transform = 'scale(1.02)';
        });

        wikiLink.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#000000';
            this.style.transform = 'scale(1)';
        });

        // Also add a small search fallback
        const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + ' ' + (year || 'film'))}`;
        const searchLink = document.createElement('a');
        searchLink.href = searchUrl;
        searchLink.target = '_blank';
        searchLink.rel = 'noopener noreferrer';
        searchLink.className = 'micro-button track-event wikipedia-search-button';
        searchLink.textContent = '🔍';
        searchLink.setAttribute('data-track-action', 'Wikipedia Search');
        searchLink.style.cssText = `
            display: inline-block;
            margin-left: 2px;
            background-color: #f0f0f0;
            color: #666 !important;
            border-radius: 4px;
            font-size: 12px;
            text-decoration: none !important;
            padding: 2px 6px;
            line-height: 1.8;
            vertical-align: middle;
            transition: all 0.15s ease;
            border: none;
        `;
        searchLink.title = 'Search Wikipedia (fallback)';

        searchLink.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e0e0e0';
        });

        searchLink.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f0f0f0';
        });

        // Find where to insert - look for the first micro-button in the container
        const firstMicroButton = moreAtContainer.querySelector('.micro-button');
        if (firstMicroButton) {
            // Insert before the first micro-button (which should be IMDb)
            moreAtContainer.insertBefore(wikiLink, firstMicroButton);
            moreAtContainer.insertBefore(searchLink, firstMicroButton);
            // Add a space between the search link and the Wikipedia link
            const space = document.createTextNode(' ');
            moreAtContainer.insertBefore(space, firstMicroButton);
            log('Wikipedia button inserted before IMDb');
        } else {
            // If no micro-buttons found, just append to the container
            moreAtContainer.appendChild(document.createTextNode(' '));
            moreAtContainer.appendChild(wikiLink);
            moreAtContainer.appendChild(document.createTextNode(' '));
            moreAtContainer.appendChild(searchLink);
            log('Wikipedia button appended to container');
        }

        log('✅ Wikipedia button added successfully!');
        log('Movie:', title, year || '');
        log('Container HTML:', moreAtContainer.innerHTML);
    }

    // Wait for the page to load
    function waitForPageLoad() {
        log('Waiting for page to load...');
        
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            // Check if the "More at" text exists
            const hasMoreAt = Array.from(document.querySelectorAll('*')).some(el => 
                el.childNodes && Array.from(el.childNodes).some(node => 
                    node.nodeType === 3 && node.textContent.trim() === 'More at'
                )
            );
            
            if (hasMoreAt || document.querySelector('.micro-button[href*="imdb"]')) {
                log('Page ready, adding Wikipedia button...');
                clearInterval(checkInterval);
                // Wait a bit more for dynamic content
                setTimeout(addWikipediaButton, 500);
            } else if (attempts >= maxAttempts) {
                log('Max attempts reached, trying to add button anyway...');
                clearInterval(checkInterval);
                addWikipediaButton();
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
            log('URL changed, re-adding button...');
            lastUrl = currentUrl;
            // Remove old buttons
            document.querySelectorAll('.wikipedia-button, .wikipedia-search-button').forEach(el => el.remove());
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