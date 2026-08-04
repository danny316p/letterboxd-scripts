// ==UserScript==
// @name         Letterboxd Wikipedia Link
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a link to Wikipedia on each Letterboxd movie page
// @author       You
// @match        https://letterboxd.com/film/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to get Wikipedia URL for a movie
    function getWikipediaUrl(movieTitle, releaseYear) {
        // Format the title for Wikipedia URL
        let formattedTitle = movieTitle
            .replace(/\(.*?\)/g, '') // Remove content in parentheses
            .trim()
            .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '_'); // Replace spaces with underscores

        // If we have a release year, add it to the search
        if (releaseYear) {
            return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(movieTitle + ' ' + releaseYear + ' film')}`;
        }

        return `https://en.wikipedia.org/wiki/${encodeURIComponent(formattedTitle)}`;
    }

    // Function to add Wikipedia link
    function addWikipediaLink() {
        // Check if link already exists
        if (document.querySelector('.wikipedia-link')) {
            return;
        }

        // Get movie title
        const titleElement = document.querySelector('.movie-title-wrapper .heading-2');
        if (!titleElement) {
            return;
        }

        const movieTitle = titleElement.textContent.trim();

        // Get release year
        const yearElement = document.querySelector('.movie-meta .release-year');
        let releaseYear = null;
        if (yearElement) {
            const yearText = yearElement.textContent.trim();
            const yearMatch = yearText.match(/\d{4}/);
            if (yearMatch) {
                releaseYear = yearMatch[0];
            }
        }

        // Find where to insert the link - after the film info or in the sidebar
        const insertPoint = document.querySelector('.movie-actions .actions-stats') ||
                           document.querySelector('.film-details') ||
                           document.querySelector('.js-crew-details');

        if (!insertPoint) {
            return;
        }

        // Create Wikipedia link
        const wikiUrl = getWikipediaUrl(movieTitle, releaseYear);

        const linkContainer = document.createElement('div');
        linkContainer.className = 'wikipedia-link-container';
        linkContainer.style.marginTop = '10px';
        linkContainer.style.marginBottom = '10px';

        const link = document.createElement('a');
        link.href = wikiUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'wikipedia-link';
        link.textContent = '📖 View on Wikipedia';
        link.style.display = 'inline-block';
        link.style.padding = '8px 16px';
        link.style.backgroundColor = '#f8f9fa';
        link.style.color = '#0066cc';
        link.style.borderRadius = '4px';
        link.style.border = '1px solid #ddd';
        link.style.textDecoration = 'none';
        link.style.fontWeight = '500';
        link.style.transition = 'all 0.2s ease';

        // Hover effect
        link.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#e9ecef';
            this.style.borderColor = '#0066cc';
        });

        link.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.borderColor = '#ddd';
        });

        linkContainer.appendChild(link);

        // Insert the link
        insertPoint.parentNode.insertBefore(linkContainer, insertPoint.nextSibling);
    }

    // Wait for the page to load fully
    function waitForPageLoad() {
        const checkInterval = setInterval(() => {
            const titleElement = document.querySelector('.movie-title-wrapper .heading-2');
            if (titleElement) {
                clearInterval(checkInterval);
                addWikipediaLink();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    // Initial load
    waitForPageLoad();

    // Handle SPA navigation
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            setTimeout(waitForPageLoad, 500);
        }
    });

    // Observe changes to the document
    observer.observe(document, { subtree: true, childList: true });

    console.log('Letterboxd Wikipedia Link script loaded');
})();