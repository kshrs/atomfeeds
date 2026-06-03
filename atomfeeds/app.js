/**
 * Core Application Logic
 * Handles data fetching, feed rendering, search filtering, and pagination.
 */

const API_BASE = window.location.port === "8000" ? "./atomfeeds/" : "./";
const wrapper = document.querySelector(".content-wrapper");
const parser = new DOMParser();

// Global State
window.username = "";
window.contactData = [];
const FEEDS_PER_PAGE = 20;
let allFeeds = [];
let currentFeedPage = 1;
let searchQuery = "";

/**
 * --- Feed & Search Management ---
 */

async function fetchAndRenderFeeds(page = 1) {
    try {
        if (!allFeeds.length) {
            const response = await fetch(API_BASE + "feeds.json");
            allFeeds = await response.json();
        }

        currentFeedPage = page;

        // Initialize header and search bar if not present
        if (!document.getElementById("feed-search-input")) {
            wrapper.innerHTML = `
                <div class="feeds-header-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <span class="heading" style="margin:0;">#feeds</span>
                        ${window.location.port === "8000" ? `<button id="new-feed-btn" class="icon-btn edit-btn"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> New</button>` : ''}
                    </div>
                    <input type="text" id="feed-search-input" class="contact-input" placeholder="Search blogs..." value="${searchQuery}" style="width: 100%; box-sizing: border-box; margin-bottom: 24px; padding: 12px; border-radius: 8px; font-size: 16px;">
                </div>
                <div id="feeds-list-container"></div>
            `;

            document.getElementById("feed-search-input").addEventListener("input", (e) => {
                searchQuery = e.target.value.toLowerCase();
                currentFeedPage = 1;
                renderFeedList();
            });
        }

        renderFeedList();
    } catch (error) {
        console.error("Error fetching feeds:", error);
        wrapper.innerHTML = `<a class="feed-item" href="#"><div class="feed-top"><h2 class="feed-title">Failed to load feeds</h2></div></a>`;
    }
}

function renderFeedList() {
    const listContainer = document.getElementById("feeds-list-container");
    if (!listContainer) return;

    // Apply search filter
    const filteredFeeds = allFeeds.filter(feed => {
        const titleMatch = (feed.title || "").toLowerCase().includes(searchQuery);
        const descMatch = (feed.desc || "").toLowerCase().includes(searchQuery);
        return titleMatch || descMatch;
    });

    if (filteredFeeds.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 32px 0; text-align: center; color: #52525b; font-style: italic;">
                No feeds found matching "${searchQuery}"
            </div>`;
        return;
    }

    // Pagination calculations
    const totalPages = Math.ceil(filteredFeeds.length / FEEDS_PER_PAGE);
    const startIndex = (currentFeedPage - 1) * FEEDS_PER_PAGE;
    const feedsToRender = filteredFeeds.slice(startIndex, startIndex + FEEDS_PER_PAGE);

    let contentBuffer = "";

    feedsToRender.forEach(feed => {
        const cleanFeedUrl = feed.url.replace(/^\.?\/?/, '');
        const resolvedUrl = API_BASE + cleanFeedUrl;

        // Escape quotes to prevent breaking HTML attributes
        const safeTitle = (feed.title || "").replace(/"/g, '&quot;');
        const safeDesc = (feed.desc || "").replace(/"/g, '&quot;');

        const editButtonHtml = window.location.port === "8000"
            ? `<div><button class="icon-btn edit-btn edit-post-btn" data-url="${resolvedUrl}" data-title="${safeTitle}" data-desc="${safeDesc}" style="padding: 4px 8px; font-size: 12px;"><svg viewBox="0 0 24 24" width="14" height="14" style="margin:0;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button></div>`
            : '';

        contentBuffer += `
        <a class="feed-item" href="${resolvedUrl}" style="position: relative; display: block;">
            <div class="feed-top" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h2 class="feed-title">${feed.title}</h2>
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <span class="feed-time">${feed.date}</span>
                    ${editButtonHtml}
                </div>
            </div>
            <p class="feed-desc">${feed.desc}</p>
        </a>`;
    });

    contentBuffer += renderPagination(totalPages, currentFeedPage);
    listContainer.innerHTML = contentBuffer;
    attachPaginationEvents();
}

/**
 * --- Pagination Helpers ---
 */

function getPaginationItems(totalPages, currentPage) {
    const items = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) items.push(i);
        return items;
    }

    items.push(1);
    if (currentPage > 3) items.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) items.push(i);

    if (currentPage < totalPages - 2) items.push("...");
    items.push(totalPages);

    return [...new Set(items)];
}

function renderPagination(totalPages, currentPage) {
    if (totalPages <= 1) return "";
    const pageItems = getPaginationItems(totalPages, currentPage);
    let html = `<div class="feeds-pagination">
        <button class="pagination-btn pagination-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>&lt;&lt;</button>`;

    pageItems.forEach(item => {
        if (item === "...") {
            html += `<span class="pagination-ellipsis">..</span>`;
        } else {
            html += `<button class="pagination-btn ${item === currentPage ? "active" : ""}" data-page="${item}">${item}</button>`;
        }
    });

    html += `<button class="pagination-btn pagination-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>&gt;&gt;</button></div>`;
    return html;
}

function attachPaginationEvents() {
    document.querySelectorAll(".pagination-btn[data-page]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const page = Number(btn.dataset.page);
            if (!page || btn.disabled) return;
            fetchAndRenderFeeds(page);
        });
    });
}

/**
 * --- Content Rendering ---
 */

async function loadPost(url) {
    try {
        const response = await fetch(url);
        const htmlString = await response.text();
        const doc = parser.parseFromString(htmlString, "text/html");
        
        wrapper.innerHTML = `<a href="#" id="back-button" class="back-button"> <- back to #feeds</a><div class="blog" id="blog">${doc.body.innerHTML}</div>`;
        
        // Reset the URL hash to trigger the routing controller back home
        document.getElementById("back-button").addEventListener("click", (e) => {
            e.preventDefault();
            window.location.hash = "";
        }); 
    } catch (error) {
        console.error("Error loading post:", error);
        wrapper.innerHTML = `<button id="back-button" class="back-button">← back to #feeds</button><p>Failed to load post content.</p>`;
        
        document.getElementById("back-button").addEventListener("click", (e) => {
            e.preventDefault();
            window.location.hash = "";
        });
    }
}

async function loadData() {
    try {
        const response = await fetch(API_BASE + "user-assets/data.json");
        const data = await response.json();
        
        // Update Metadata & Title
        document.querySelector(".metadata").innerHTML = `Last Updated: ${data.last_updated}`;
        
        const siteTitle = document.querySelector(".site-title");
        if (siteTitle) siteTitle.innerHTML = `atomfeeds/${data.username}`;
        
        const editorTitleSpan = document.querySelector(".site-title-editor .title-text");
        if (editorTitleSpan) editorTitleSpan.innerText = data.username;
        
        window.username = data.username;

        // Update Profile Picture
        const profileImageContainer = document.querySelector(".profile-image");
        const profileBtnText = document.getElementById("profile-btn-text");
        if (data.profile_image_url) {
            profileImageContainer.innerHTML = `<div class="image-tooltip-wrapper" data-alt="${data.profile_image_desc}"><img src="${API_BASE + data.profile_image_url.replace('./', '')}" alt="${data.profile_image_desc}" /></div>`;
            if (profileBtnText) profileBtnText.innerText = "Edit Picture";
        } else {
            profileImageContainer.innerHTML = "";
            if (profileBtnText) profileBtnText.innerText = "Add Profile Picture";
        }
        
        // Update Contacts
        window.contactData = data.contact_links || [];
        const links_wrapper = document.querySelector(".buttons");
        let contentBuffer = "";
        window.contactData.forEach(link => {
            if (link.name && link.url) {
                contentBuffer += `<a class="button-style ${link.name}" href="${link.url}" style="background-color: ${link.bg_color}; color: ${link.fg_color}; display: inline-block; text-decoration: none;">${link.name}</a>`;
            }
        });
        links_wrapper.innerHTML = contentBuffer;

        // Update About Section
        const aboutResponse = await fetch(API_BASE + data.about_url.replace('./', ''));
        const htmlString = await aboutResponse.text();
        document.querySelector(".about").innerHTML = parser.parseFromString(htmlString, "text/html").body.innerHTML;
    } catch (error) {
        console.error("Error loading application data:", error);
    }
}

/**
 * --- Global Event Listeners & Initialization ---
 */

wrapper.addEventListener("click", async (e) => {
    // Intercept feed clicks, defer editor clicks to editor.js
    const editPostBtn = e.target.closest(".edit-post-btn");
    if (editPostBtn) return; 
    
    const link = e.target.closest(".feed-item");
    if (link) {
        e.preventDefault();
        await loadPost(link.getAttribute("href"));
    }
});

// Re-expose the safe reload function to the window
window.reloadAppData = loadData;
window.loadFeeds = (page = undefined) => {
    allFeeds = []; // Flush cached array reference to force an actual HTTP re-fetch
    
    // If a page parameter isn't explicitly provided, preserve the current pagination view
    const targetPage = page !== undefined ? page : currentFeedPage;
    fetchAndRenderFeeds(targetPage); 
};

/**
 * --- SPA Router Implementation ---
 */

// Central routing controller
function handleRouting() {
    const hash = window.location.hash;
    
    if (hash.startsWith("#post=")) {
        // Extract the filename from the hash string
        const postFile = decodeURIComponent(hash.replace("#post=", ""));
        
        // Resolve path seamlessly for both local server and production
        const targetedUrl = API_BASE + "feeds/" + postFile;
        loadPost(targetedUrl);
    } else {
        // No post hash means we are on the home timeline directory
        fetchAndRenderFeeds(currentFeedPage);
    }
}

// Intercept feed item selections to update the hash state
wrapper.addEventListener("click", async (e) => {
    const editPostBtn = e.target.closest(".edit-post-btn");
    if (editPostBtn) return; // Allow editor.js to handle editing overrides
    
    const link = e.target.closest(".feed-item");
    if (link) {
        e.preventDefault();
        const href = link.getAttribute("href"); // e.g., "./atomfeeds/feeds/emacs.html"
        
        // Isolate just the filename (e.g., "emacs.html")
        const filename = href.split('/').pop();
        
        // Update the browser address bar with a shareable anchor token
        window.location.hash = `post=${filename}`;
    }
});

// Update the back button assignment inside your existing loadPost() function:
// Replace document.getElementById("back-button").addEventListener("click", ...) with:
/*
    document.getElementById("back-button").addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = ""; // Clearing the hash auto-triggers the router back home
    });
*/

// Attach global lifecycle router listeners
window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", handleRouting);

// Re-expose the safe reload function to the window
window.reloadAppData = loadData;
window.loadFeeds = (page = undefined) => {
    allFeeds = []; 
    const targetPage = page !== undefined ? page : currentFeedPage;
    fetchAndRenderFeeds(targetPage); 
};

// Bootstrap application configuration
loadData();
