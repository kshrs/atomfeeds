/**
 * Local Editor Configuration
 * Manages modal states, Markdown parsing, and API calls to local Express server.
 */

/** * --- Inline Title Editor --- 
 */
const siteTitleEditor = document.querySelector(".site-title-editor");

const attachEditListener = () => {
    if (!siteTitleEditor) return;
    siteTitleEditor.removeEventListener("click", handleTitleClick);
    siteTitleEditor.addEventListener("click", handleTitleClick);
};

const handleTitleClick = async (e) => {
    e.preventDefault();
    if (siteTitleEditor.querySelector("input")) return;
    
    const currentTitle = window.username || "UserName";
    siteTitleEditor.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="title-input" class="title-input" placeholder="${currentTitle}" required>
            <button id="save-title-btn" class="icon-btn save-btn">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
            <button id="cancel-title-btn" class="icon-btn cancel-btn">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>
    `;
    
    const inputField = document.getElementById("title-input");
    const saveBtn    = document.getElementById("save-title-btn");
    const cancelBtn  = document.getElementById("cancel-title-btn");
    inputField.focus();

    const closeEditor = async (newText, shouldSave) => {
        const finalText = newText.trim() || currentTitle;
        if (shouldSave && finalText !== currentTitle) {
            try {
                const res = await fetch("/api/update-username", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: finalText })
                });
                if (res.ok && typeof window.reloadAppData === "function") await window.reloadAppData();
            } catch (err) { console.error("Failed to update title:", err); }
        }
        
        // Revert UI to static button state
        siteTitleEditor.innerHTML = `
            <button class="icon-btn edit-btn">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                Edit
            </button>
        `;
        attachEditListener();
    };

    inputField.addEventListener("click",   e => e.stopPropagation());
    saveBtn.addEventListener("click",      e => { e.stopPropagation(); closeEditor(inputField.value, true); });
    cancelBtn.addEventListener("click",    e => { e.stopPropagation(); closeEditor(currentTitle, false); });
    inputField.addEventListener("keydown", e => {
        if      (e.key === "Enter")  { e.preventDefault(); closeEditor(inputField.value, true); }
        else if (e.key === "Escape") { e.preventDefault(); closeEditor(currentTitle, false); }
    });
};

attachEditListener();

/** * --- Markdown Modal Editor (Posts & About) --- 
 */
const editorModal      = document.getElementById("editor-modal");
const modalExitBtn     = document.getElementById("modal-exit-btn");
const modalSaveBtn     = document.getElementById("modal-save-btn");
const modalDeleteBtn   = document.getElementById("modal-delete-btn"); // Grab new button
const toggleTextBtn    = document.getElementById("toggle-text-btn");
const togglePreviewBtn = document.getElementById("toggle-preview-btn");

let easyMDE = null;
let currentEditorTarget = null;
let currentEditorUrl    = null;

const initEditor = () => {
    if (!easyMDE) {
        easyMDE = new EasyMDE({
            element: document.getElementById("markdown-editor"),
            toolbar: false,
            status: false
        });
    }
};

const setPreviewState = (isPreview) => {
    if (!easyMDE) return;
    const isCurrentlyPreview = easyMDE.isPreviewActive();
    if (isPreview  && !isCurrentlyPreview) easyMDE.togglePreview();
    if (!isPreview &&  isCurrentlyPreview) easyMDE.togglePreview();
    
    togglePreviewBtn.classList.toggle("active",  isPreview);
    toggleTextBtn.classList.toggle("active",    !isPreview);
};

toggleTextBtn.addEventListener("click",    () => setPreviewState(false));
togglePreviewBtn.addEventListener("click", () => setPreviewState(true));

// About Editor Trigger
document.getElementById("about-edit-btn").addEventListener("click", async () => {
    currentEditorTarget = 'about';
    document.getElementById("new-post-meta").style.display = "none";
    modalDeleteBtn.style.display = "none"; // Hide delete button
    
    editorModal.classList.remove("hidden");
    initEditor();
    setPreviewState(false);
    easyMDE.value("");
    
    try {
        const res = await fetch("/api/get-about-md");
        if (res.ok) {
            const data = await res.json();
            easyMDE.value(data.markdown || "");
        }
    } catch (e) { console.error("Failed to fetch about.md:", e); }
});

// Dynamic Feed Editor Trigger (New Post & Edit Post)
document.addEventListener("click", async (e) => {
    const postEditBtn = e.target.closest(".edit-post-btn");
    const newFeedBtn = e.target.closest("#new-feed-btn");

    if (postEditBtn) {
        e.preventDefault();
        e.stopPropagation();
        currentEditorTarget = 'post';
        currentEditorUrl = postEditBtn.getAttribute("data-url");
        
        document.getElementById("new-post-meta").style.display = "flex";
        document.getElementById("new-post-title").value = postEditBtn.getAttribute("data-title") || "";
        document.getElementById("new-post-desc").value = postEditBtn.getAttribute("data-desc") || "";
        
        modalDeleteBtn.style.display = "inline-flex"; // Show delete button for existing posts
        
        editorModal.classList.remove("hidden");
        initEditor();
        setPreviewState(false);
        easyMDE.value("");
        try {
            const res = await fetch(`/api/get-post-md?url=${encodeURIComponent(currentEditorUrl)}`);
            if (res.ok) {
                const data = await res.json();
                easyMDE.value(data.markdown || "");
            }
        } catch (err) { console.error(err); }
        
    } else if (newFeedBtn) {
        e.preventDefault();
        currentEditorTarget = 'new-post';
        currentEditorUrl = null;
        
        document.getElementById("new-post-meta").style.display = "flex";
        document.getElementById("new-post-title").value = "";
        document.getElementById("new-post-desc").value = "";
        
        modalDeleteBtn.style.display = "none"; // Hide delete button for new posts
        
        editorModal.classList.remove("hidden");
        initEditor();
        setPreviewState(false);
        easyMDE.value("");
    }
});

modalExitBtn.addEventListener("click", () => {
    editorModal.classList.add("hidden");
    setPreviewState(false);
});

// --- Delete Logic ---
modalDeleteBtn.addEventListener("click", async () => {
    if (currentEditorTarget !== 'post' || !currentEditorUrl) return;

    // Trigger native browser confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
    if (!isConfirmed) return;

    try {
        const res = await fetch("/api/delete-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentEditorUrl })
        });

        if (res.ok) {
            editorModal.classList.add("hidden");
            setPreviewState(false);
            if (typeof window.reloadAppData === "function") window.reloadAppData();
            if (typeof window.loadFeeds === "function") window.loadFeeds(1); // Refresh back to page 1
        }
    } catch (e) {
        console.error("Delete failed:", e);
        alert("An error occurred while deleting the post.");
    }
});

// Save Logic
modalSaveBtn.addEventListener("click", async () => {
    // ... (Keep the rest of your save logic exactly the same as before) ...
    const markdown = easyMDE.value();
    const html = marked.parse(markdown);
    const title = document.getElementById("new-post-title").value.trim();
    const desc = document.getElementById("new-post-desc").value.trim();

    if ((currentEditorTarget === 'post' || currentEditorTarget === 'new-post') && !title) {
        return alert("Title is required.");
    }

    try {
        let endpoint, bodyPayload;

        if (currentEditorTarget === 'about') {
            endpoint = "/api/update-about";
            bodyPayload = { markdown, html };
        } else if (currentEditorTarget === 'post') {
            endpoint = "/api/update-post";
            bodyPayload = { markdown, html, url: currentEditorUrl, title, desc };
        } else if (currentEditorTarget === 'new-post') {
            endpoint = "/api/create-post";
            bodyPayload = { markdown, html, title, desc };
        }
        
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyPayload)
        });
        
        if (res.ok) {
            editorModal.classList.add("hidden");
            setPreviewState(false);
            if (typeof window.reloadAppData === "function") window.reloadAppData();
            if (typeof window.loadFeeds === "function") {
                window.loadFeeds(currentEditorTarget === 'new-post' ? 1 : undefined);
            }
        }
    } catch (e) { console.error(e); }
});


/** * --- Profile Picture Upload --- 
 */
const profileEditBtn     = document.getElementById("profile-edit-btn");
const profileUploadInput = document.getElementById("profile-upload-input");

profileEditBtn.addEventListener("click", () => profileUploadInput.click());
profileUploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const res = await fetch("/api/update-profile-pic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: event.target.result, filename: file.name })
            });
            if (res.ok && typeof window.reloadAppData === "function") await window.reloadAppData();
        } catch (err) { console.error("Profile upload failed:", err); }
    };
    reader.readAsDataURL(file);
});

/** * --- Contact Links Editor --- 
 */
const contactEditBtn       = document.getElementById("contact-edit-btn");
const contactModal         = document.getElementById("contact-modal");
const contactExitBtn       = document.getElementById("contact-exit-btn");
const contactSaveBtn       = document.getElementById("contact-save-btn");
const contactRowsContainer = document.getElementById("contact-rows-container");

let contactLinks = []; // Local memory state for modal

const renderContactRows = () => {
    const links = contactLinks.length > 0 ? contactLinks : (window.contactData || []);
    
    // Ensure minimum one row for UX
    if (links.length === 0) {
        contactLinks = [{ name: "", url: "", bg_color: "#000000", fg_color: "#ffffff" }];
    } else {
        contactLinks = [...links];
    }

    let html = `<div class="contact-grid">`;
    contactLinks.forEach((link, i) => {
        const safeName    = (link.name || "").replace(/"/g, "&quot;");
        const safeUrl     = (link.url  || "").replace(/"/g, "&quot;");
        const displayName = link.name  || `Contact ${i + 1}`;

        html += `
            <div class="contact-card" data-index="${i}">
                <div class="contact-preview-section">
                    <span class="contact-preview-btn" id="preview-btn-${i}"
                          style="background-color:${link.bg_color};color:${link.fg_color};">
                        ${displayName}
                    </span>
                </div>
                <div class="contact-fields">
                    <div class="contact-field-label">Label</div>
                    <input type="text" class="contact-input name-input" placeholder="e.g. GitHub" value="${safeName}">
                    <div class="contact-field-label">URL</div>
                    <input type="text" class="contact-input url-input" placeholder="https://..." value="${safeUrl}">
                    
                    <div class="color-row">
                        <div class="color-field">
                            <div class="contact-field-label">Background</div>
                            <div class="color-input-group">
                                <input type="color" class="color-picker bg-color-picker" value="${link.bg_color}">
                                <input type="text" class="contact-input bg-input" placeholder="#000000" value="${link.bg_color}" maxlength="7">
                            </div>
                        </div>
                        <div class="color-field">
                            <div class="contact-field-label">Text</div>
                            <div class="color-input-group">
                                <input type="color" class="color-picker fg-color-picker" value="${link.fg_color}">
                                <input type="text" class="contact-input fg-input" placeholder="#ffffff" value="${link.fg_color}" maxlength="7">
                            </div>
                        </div>
                    </div>
                </div>
                <button class="contact-remove-btn" data-index="${i}" title="Remove this contact">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        `;
    });
    html += `</div>`;
    html += `<button id="add-contact-btn" class="add-contact-btn"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add Contact</button>`;
    
    contactRowsContainer.innerHTML = html;

    // Attach row events
    contactRowsContainer.querySelectorAll(".contact-card").forEach((card, i) => {
        const nameInput = card.querySelector(".name-input");
        const bgInput   = card.querySelector(".bg-input");
        const fgInput   = card.querySelector(".fg-input");
        const bgPicker  = card.querySelector(".bg-color-picker");
        const fgPicker  = card.querySelector(".fg-color-picker");
        const preview   = card.querySelector(`#preview-btn-${i}`);
        const removeBtn = card.querySelector(".contact-remove-btn");

        const isValidHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

        const updatePreview = () => {
            if (isValidHex(bgInput.value)) preview.style.backgroundColor = bgInput.value;
            if (isValidHex(fgInput.value)) preview.style.color = fgInput.value;
            preview.textContent = nameInput.value.trim() || `Contact ${i + 1}`;
            
            // Sync memory state
            contactLinks[i] = {
                name: nameInput.value,
                url: card.querySelector(".url-input").value,
                bg_color: bgInput.value,
                fg_color: fgInput.value
            };
        };

        bgPicker.addEventListener("input", () => { bgInput.value = bgPicker.value; updatePreview(); });
        fgPicker.addEventListener("input", () => { fgInput.value = fgPicker.value; updatePreview(); });

        bgInput.addEventListener("input", () => {
            if (isValidHex(bgInput.value)) bgPicker.value = bgInput.value;
            updatePreview();
        });
        fgInput.addEventListener("input", () => {
            if (isValidHex(fgInput.value)) fgPicker.value = fgInput.value;
            updatePreview();
        });

        nameInput.addEventListener("input", updatePreview);
        card.querySelector(".url-input").addEventListener("input", updatePreview);

        removeBtn.addEventListener("click", () => {
            if (contactLinks.length > 1) {
                contactLinks.splice(i, 1);
                renderContactRows();
            } else {
                contactLinks[0] = { name: "", url: "", bg_color: "#000000", fg_color: "#ffffff" };
                renderContactRows();
            }
        });
    });

    document.getElementById("add-contact-btn").addEventListener("click", () => {
        contactLinks.push({ name: "", url: "", bg_color: "#000000", fg_color: "#ffffff" });
        renderContactRows();
    });
};

contactEditBtn.addEventListener("click", () => {
    contactLinks = [...(window.contactData || [])];
    renderContactRows();
    contactModal.classList.remove("hidden");
});

contactExitBtn.addEventListener("click", () => contactModal.classList.add("hidden"));

contactSaveBtn.addEventListener("click", async () => {
    // Final state flush
    contactRowsContainer.querySelectorAll(".contact-card").forEach(card => {
        const idx = card.dataset.index;
        contactLinks[idx] = {
            name:     card.querySelector(".name-input").value,
            url:      card.querySelector(".url-input").value,
            bg_color: card.querySelector(".bg-input").value,
            fg_color: card.querySelector(".fg-input").value
        };
    });

    try {
        const res = await fetch("/api/update-contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contacts: contactLinks })
        });
        if (res.ok) {
            contactModal.classList.add("hidden");
            if (typeof window.reloadAppData === "function") await window.reloadAppData();
        }
    } catch (err) { console.error("Failed to save contacts:", err); }
});
