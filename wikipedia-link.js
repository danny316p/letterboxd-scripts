// ==UserScript==
// @name         Letterboxd Wikipedia Link
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds a link to Wikipedia on each Letterboxd movie page
// @author       You
// @match        https://letterboxd.com/film/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to get Wikipedia URL for a movie
    function getWikipediaUrl(movieTitle, releaseYear) {
        // Try direct Wikipedia URL first
        let formattedTitle = movieTitle
            .replace(/\(.*?\)/g, '') // Remove content in parentheses
            .trim()
            .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '_'); // Replace spaces with underscores

        // If we have a release year, try the specific format
        if (releaseYear) {
            // Try the exact format first: Movie_Title_(year_film)
            return `https://en.wikipedia.org/wiki/${formattedTitle}_(${releaseYear}_film)`;
        }

        return `https://en.wikipedia.org/wiki/${formattedTitle}`;
    }

    // Function to find where to insert the link
    function findInsertionPoint() {
        // Try various possible locations on the page
        const selectors = [
            '.film-details .col-17 .js-crew-details',
            '.film-details .col-17',
            '.film-details',
            '.movie-actions .actions-stats',
            '.movie-meta',
            '.js-crew-details',
            '.film-poster + div', // The div next to the poster
            '.js-film-page .col-17', // Main content column
            '#featured-film-header', // Header area
            '.poster + .film-details' // Alternative structure
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('Found insertion point with selector:', selector);
                return element;
            }
        }

        return null;
    }

    // Function to add Wikipedia link
    function addWikipediaLink() {
        // Check if link already exists
        if (document.querySelector('.wikipedia-link-container')) {
            console.log('Wikipedia link already exists');
            return;
        }

        // Get movie title - try multiple selectors
        let movieTitle = null;
        const titleSelectors = [
            '.movie-title-wrapper .heading-2',
            '.film-title h1',
            '.film-title .heading-2',
            '.movie-title .heading-2',
            '.film-header h1',
            '.js-movie-title'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                movieTitle = element.textContent.trim();
                console.log('Found title with selector:', selector, 'Title:', movieTitle);
                break;
            }
        }

        if (!movieTitle) {
            console.log('Could not find movie title');
            return;
        }

        // Get release year - try multiple selectors
        let releaseYear = null;
        const yearSelectors = [
            '.movie-meta .release-year',
            '.film-meta .release-year',
            '.meta .release-year',
            '.film-year',
            '.js-film-page .release-year'
        ];

        for (const selector of yearSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const yearText = element.textContent.trim();
                const yearMatch = yearText.match(/\d{4}/);
                if (yearMatch) {
                    releaseYear = yearMatch[0];
                    console.log('Found year with selector:', selector, 'Year:', releaseYear);
                    break;
                }
            }
        }

        // Find insertion point
        const insertPoint = findInsertionPoint();
        if (!insertPoint) {
            console.log('Could not find insertion point');
            return;
        }

        // Create Wikipedia link
        const wikiUrl = getWikipediaUrl(movieTitle, releaseYear);
        console.log('Wikipedia URL:', wikiUrl);

        // Create the link container
        const linkContainer = document.createElement('div');
        linkContainer.className = 'wikipedia-link-container';
        linkContainer.style.marginTop = '15px';
        linkContainer.style.marginBottom = '15px';
        linkContainer.style.padding = '10px 0';

        const link = document.createElement('a');
        link.href = wikiUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'wikipedia-link';
        link.textContent = '📖 View on Wikipedia';
        link.style.display = 'inline-flex';
        link.style.alignItems = 'center';
        link.style.gap = '8px';
        link.style.padding = '10px 20px';
        link.style.backgroundColor = '#ffffff';
        link.style.color = '#0066cc';
        link.style.borderRadius = '6px';
        link.style.border = '2px solid #e0e0e0';
        link.style.textDecoration = 'none';
        link.style.fontWeight = '600';
        link.style.fontSize = '14px';
        link.style.transition = 'all 0.2s ease';
        link.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

        // Hover effect
        link.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#f0f7ff';
            this.style.borderColor = '#0066cc';
            this.style.boxShadow = '0 4px 8px rgba(0,102,204,0.15)';
            this.style.transform = 'translateY(-1px)';
        });

        link.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#ffffff';
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            this.style.transform = 'translateY(0)';
        });

        linkContainer.appendChild(link);

        // Try to insert the link in a good position
        let inserted = false;

        // Try inserting after the insert point
        if (insertPoint.parentNode) {
            try {
                insertPoint.parentNode.insertBefore(linkContainer, insertPoint.nextSibling);
                inserted = true;
                console.log('Link inserted after:', insertPoint);
            } catch (e) {
                console.log('Failed to insert after, trying append');
            }
        }

        // If that didn't work, try appending to the container
        if (!inserted) {
            const containers = [
                document.querySelector('.film-details .col-17'),
                document.querySelector('.film-details'),
                document.querySelector('.js-film-page .col-17')
            ];

            for (const container of containers) {
                if (container) {
                    try {
                        container.appendChild(linkContainer);
                        inserted = true;
                        console.log('Link appended to:', container);
                        break;
                    } catch (e) {
                        console.log('Failed to append to container');
                    }
                }
            }
        }

        // If still not inserted, try the body
        if (!inserted) {
            const header = document.querySelector('.film-header') || document.querySelector('header');
            if (header) {
                header.parentNode.insertBefore(linkContainer, header.nextSibling);
                console.log('Link inserted after header');
            } else {
                document.body.prepend(linkContainer);
                console.log('Link prepended to body');
            }
        }

        console.log('Wikipedia link added successfully!');
    }

    // Wait for the page to load fully
    function waitForPageLoad() {
        console.log('Waiting for page to load...');
        
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            // Check if the page has loaded enough
            const titleElement = document.querySelector('.movie-title-wrapper .heading-2') ||
                               document.querySelector('.film-title h1') ||
                               document.querySelector('.js-movie-title');
            
            if (titleElement) {
                console.log('Page loaded, adding Wikipedia link...');
                clearInterval(checkInterval);
                setTimeout(addWikipediaLink, 500);
            } else if (attempts >= maxAttempts) {
                console.log('Max attempts reached, trying to add link anyway...');
                clearInterval(checkInterval);
                setTimeout(addWikipediaLink, 1000);
            }
        }, 500);
    }

    // Initial load
    waitForPageLoad();

    // Handle SPA navigation
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            console.log('URL changed, re-adding link...');
            lastUrl = currentUrl;
            setTimeout(waitForPageLoad, 1000);
        }
    });

    // Observe changes to the document
    observer.observe(document.body, { subtree: true, childList: true });

    console.log('Letterboxd Wikipedia Link script loaded');
    console.log('Current URL:', location.href);
})();