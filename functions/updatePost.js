const fs = require('fs/promises');
const path = require('path');
const { updateDataJson } = require('./utils');

const resolvePostPaths = (reqUrl) => {
    const filename = reqUrl.split('/').pop(); 
    const htmlPath = path.join(__dirname, '..', 'atomfeeds', 'feeds', filename);
    const mdPath = htmlPath.replace(/\.html$/, '.md');
    return { htmlPath, mdPath, filename };
};

const updatePost = async (req, res) => {
    const { markdown, html, url, title, desc } = req.body;
    if (!url || !title || typeof markdown !== 'string' || typeof html !== 'string') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        const { htmlPath, mdPath, filename } = resolvePostPaths(url);
        const fullHtml = `<html>\n<body>\n${html}\n</body>\n</html>`;
        
        await fs.mkdir(path.dirname(htmlPath), { recursive: true });
        await fs.writeFile(htmlPath, fullHtml);
        await fs.writeFile(mdPath, markdown);

        // Sync updates directly back into the feeds directory listing
        const feedsJsonPath = path.join(__dirname, '..', 'atomfeeds', 'feeds.json');
        try {
            const feedsData = await fs.readFile(feedsJsonPath, 'utf-8');
            let feeds = JSON.parse(feedsData);
            
            const feedIndex = feeds.findIndex(f => f.url.split('/').pop() === filename);
            if (feedIndex !== -1) {
                feeds[feedIndex].title = title;
                feeds[feedIndex].desc = desc || "";
                await fs.writeFile(feedsJsonPath, JSON.stringify(feeds, null, 4));
            }
        } catch (err) {
            console.error("Failed to sync structural changes to feeds.json:", err);
        }

        const dataPath = path.join(__dirname, '..', 'atomfeeds', 'user-assets', 'data.json');
        await updateDataJson(dataPath, {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
};

const getPostMd = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const { mdPath } = resolvePostPaths(url);
        const markdown = await fs.readFile(mdPath, 'utf-8');
        res.json({ markdown });
    } catch (error) {
        res.json({ markdown: '' }); 
    }
};

module.exports = { updatePost, getPostMd };
