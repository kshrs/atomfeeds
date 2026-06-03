const path = require('path');
const { updateDataJson } = require('./utils');

module.exports = async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const dataPath = path.join(__dirname, '..', 'atomfeeds', 'user-assets', 'data.json');

    try {
        await updateDataJson(dataPath, { username });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update username' });
    }
};
