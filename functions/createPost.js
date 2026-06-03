const fs = require('fs/promises');
const path = require('path');
const { updateDataJson } = require('./utils');

/**
 * Generates a URL-safe slug from a string.
 * Strips special characters, normalizes whitespace/hyphens, and trims boundaries.
 */
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
};

/**
 * Controller: Handles creation of new blog/feed posts.
 * Persists raw markdown, compiled HTML, updates the main feeds catalog, 
 * and triggers cache/metadata updates.
 */
module.exports = async (req, res) => {
    const { title, desc, markdown, html } = req.body;
    
    // Fail-fast validation for required payload integrity
    if (!title || typeof markdown !== 'string' || typeof html !== 'string') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Fallback to timestamp if title results in an empty slug to prevent invalid file writes
        const filenameBase = slugify(title) || `post-${Date.now()}`;
        const htmlFilename = `${filenameBase}.html`;
        const mdFilename = `${filenameBase}.md`;
        
        const feedsDir = path.join(__dirname, '..', 'atomfeeds', 'feeds');
        await fs.mkdir(feedsDir, { recursive: true });

        const htmlPath = path.join(feedsDir, htmlFilename);
        const mdPath = path.join(feedsDir, mdFilename);

        // Standard wrap for the HTML snippet before saving
        const fullHtml = `<html>\n<body>\n${html}\n</body>\n</html>`;
        await fs.writeFile(htmlPath, fullHtml);
        await fs.writeFile(mdPath, markdown);

        // --- Catalog Update Pipeline ---
        const feedsJsonPath = path.join(__dirname, '..', 'atomfeeds', 'feeds.json');
        let feeds = [];
        try {
            const feedsData = await fs.readFile(feedsJsonPath, 'utf-8');
            feeds = JSON.parse(feedsData);
        } catch (err) {
            // Silently swallow missing file or parsing errors to initialize a fresh array
        }

        // Generate custom date format (DD MMM YYYY) for frontend consistency
        const d = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedDate = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;

        // Unshift ensures chronologically reverse order (newest posts first)
        feeds.unshift({
            title: title,
            date: formattedDate,
            desc: desc || "",
            url: `./feeds/${htmlFilename}`
        });

        await fs.writeFile(feedsJsonPath, JSON.stringify(feeds, null, 4));

        // Trigger cache invalidation or top-level metadata updates for the client
        const dataPath = path.join(__dirname, '..', 'atomfeeds', 'user-assets', 'data.json');
        await updateDataJson(dataPath, {});

        res.json({ success: true });
    } catch (error) {
        // Log errors internally here if a logging service is connected
        res.status(500).json({ error: 'Failed to create post' });
    }
};
