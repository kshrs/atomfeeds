const fs = require('fs/promises');
const path = require('path');
const { updateDataJson } = require('./utils');

module.exports = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const filename = url.split('/').pop();
        
        const feedsDir = path.join(__dirname, '..', 'atomfeeds', 'feeds');
        const htmlPath = path.join(feedsDir, filename);
        const mdPath = htmlPath.replace(/\.html$/, '.md');

        await fs.unlink(htmlPath).catch(() => console.log(`Warning: ${htmlPath} not found for deletion.`));
        await fs.unlink(mdPath).catch(() => console.log(`Warning: ${mdPath} not found for deletion.`));

        const feedsJsonPath = path.join(__dirname, '..', 'atomfeeds', 'feeds.json');
        try {
            const feedsData = await fs.readFile(feedsJsonPath, 'utf-8');
            const feeds = JSON.parse(feedsData);
            
            // Filter out the deleted post
            const updatedFeeds = feeds.filter(feed => feed.url.split('/').pop() !== filename);
            
            // Save updated JSON
            await fs.writeFile(feedsJsonPath, JSON.stringify(updatedFeeds, null, 4));
        } catch (err) {
            console.error("Error updating feeds.json during deletion:", err);
        }

        const dataPath = path.join(__dirname, '..', 'atomfeeds', 'user-assets', 'data.json');
        await updateDataJson(dataPath, {});

        res.json({ success: true });
    } catch (error) {
        console.error("Error in deletePost:", error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};
