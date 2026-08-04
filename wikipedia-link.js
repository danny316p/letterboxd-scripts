// ==UserScript==
// @name         Letterboxd Wikipedia Link
// @namespace    http://tampermonkey.net/
// @version      1.4
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

        // Find the "More at" section container
        const moreAtSection = document.querySelector('.film-credits .text-sluglist');
        if (!moreAtSection) {
            log('Could not find "More at" section');
            // Try to find it by looking for the text "More at"
            const allText = document.querySelectorAll('*');
            for (const el of allText) {
                if (el.textContent && el.textContent.trim() === 'More at' && el.nextElementSibling) {
                    log('Found "More at" section by text search');
                    // The next sibling should be the container with the links
                    const container = el.nextElementSibling;
                    if (container && container.querySelector('a')) {
                        // We found the container, now add our button there
                        addButtonToContainer(container);
                        return;
                    }
                }
            }
            log('Could not find "More at" section at all');
            return;
        }

        // We found the section, now add our button
        addButtonToContainer(moreAtSection);
    }

    function addButtonToContainer(container) {
        log('Found container, adding Wikipedia button...');

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

        // Create the Wikipedia button
        const wikiLink = document.createElement('a');
        wikiLink.href = wikiUrl;
        wikiLink.target = '_blank';
        wikiLink.rel = 'noopener noreferrer';
        wikiLink.className = 'wikipedia-button';
        wikiLink.textContent = 'Wikipedia';
        wikiLink.style.cssText = `
            display: inline-block;
            margin-left: 4px;
            margin-right: 4px;
            padding: 2px 10px;
            background-color: #000000;
            color: #ffffff;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.2s ease;
            line-height: 1.8;
            vertical-align: middle;
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

        // Also add a fallback search link (smaller, just in case)
        const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + ' ' + (year || 'film'))}`;
        const searchLink = document.createElement('a');
        searchLink.href = searchUrl;
        searchLink.target = '_blank';
        searchLink.rel = 'noopener noreferrer';
        searchLink.className = 'wikipedia-search-button';
        searchLink.textContent = '🔍';
        searchLink.style.cssText = `
            display: inline-block;
            margin-left: 0px;
            margin-right: 4px;
            padding: 2px 6px;
            background-color: #f0f0f0;
            color: #666;
            border-radius: 4px;
            font-size: 11px;
            text-decoration: none;
            transition: all 0.2s ease;
            line-height: 1.8;
            vertical-align: middle;
        `;
        searchLink.title = 'Search Wikipedia (fallback)';

        searchLink.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e0e0e0';
        });

        searchLink.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f0f0f0';
        });

        // Insert the buttons before the IMDb/TMDB links
        const firstLink = container.querySelector('a');
        if (firstLink) {
            // Insert before the first link (which is usually IMDb)
            container.insertBefore(wikiLink, firstLink);
            container.insertBefore(searchLink, firstLink);
            // Add a small space after the search link
            const space = document.createTextNode(' ');
            container.insertBefore(space, firstLink);
            log('Wikipedia button inserted before IMDb');
        } else {
            // If no links found, just append
            container.appendChild(wikiLink);
            container.appendChild(searchLink);
            log('Wikipedia button appended to container');
        }

        // Log success
        log('✅ Wikipedia button added successfully!');
        log('Movie:', title, year || '');
    }

    // Wait for the page to load
    function waitForPageLoad() {
        log('Waiting for page to load...');
        
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            // Check if the "More at" section exists
            const moreAtSection = document.querySelector('.film-credits .text-sluglist');
            
            if (moreAtSection || document.querySelector('.film-credits')) {
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