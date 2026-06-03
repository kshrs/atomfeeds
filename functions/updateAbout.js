const fs = require('fs/promises');
const path = require('path');
const { updateDataJson } = require('./utils');

// --- Configuration & Static File Paths ---
const assetsDir = path.join(__dirname, '..', 'atomfeeds', 'user-assets');
const mdPath = path.join(assetsDir, 'about.md');
const htmlPath = path.join(assetsDir, 'about.html');
const dataPath = path.join(assetsDir, 'data.json');

/**
 * Controller: Updates the "About Me" profile section.
 * Atomically saves the raw Markdown input, compiles a standard HTML wrapper,
 * and updates the global metadata manifest with the active relative path.
 */
const updateAbout = async (req, res) => {
    const { markdown, html } = req.body;
    
    // Fail-fast validation ensuring payload types prevent file write corruption
    if (typeof markdown !== 'string' || typeof html !== 'string') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Wrap raw body content in standard boilerplate before disk persistence
        const fullHtml = `<html>\n<body>\n${html}\n</body>\n</html>`;
        await fs.writeFile(htmlPath, fullHtml);
        await fs.writeFile(mdPath, markdown);

        // Keep core data manifest synchronized with asset pointers
        await updateDataJson(dataPath, { about_url: "./user-assets/about.html" });
        
        res.json({ success: true });
    } catch (error) {
        // Fail gracefully to prevent server leakage; log internally if needed
        res.status(500).json({ error: 'Failed to update about' });
    }
};

/**
 * Controller: Retrieves the raw Markdown source for the "About Me" section.
 * Used primarily to populate rich text editors / CMS frontends on load.
 */
const getAboutMd = async (req, res) => {
    try {
        const markdown = await fs.readFile(mdPath, 'utf-8');
        res.json({ markdown });
    } catch (error) {
        // Fallback pattern: return an empty string if the file doesn't exist yet,
        // preventing unnecessary client-side errors on first initialization.
        res.json({ markdown: '' });
    }
};

module.exports = {
    updateAbout,
    getAboutMd
};
