const fs = require('fs/promises');
const path = require('path');
const { updateDataJson } = require('./utils');

module.exports = async (req, res) => {
    const { image, filename } = req.body;
    if (!image || !filename) return res.status(400).json({ error: 'Image required' });

    const assetsDir = path.join(__dirname, '..', 'atomfeeds', 'user-assets');
    const dataPath = path.join(assetsDir, 'data.json');

    try {
        // Strip out the Base64 Data URI header to isolate raw binary data
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const ext = filename.split('.').pop();
        
        // Static file naming structure enforced to overwrite historical avatars and eliminate asset bloat
        const safeFilename = `profile_pic.${ext}`; 
        
        await fs.writeFile(path.join(assetsDir, safeFilename), base64Data, 'base64');
        
        // Appending a cache-busting timestamp string forces deterministic CDN and local browser cache invalidation
        await updateDataJson(dataPath, {
            profile_image_url: `./user-assets/${safeFilename}?v=${Date.now()}`,
            profile_image_desc: "Profile Picture"
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};
