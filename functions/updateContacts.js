const path = require('path');
const { updateDataJson } = require('./utils');

module.exports = async (req, res) => {
    const { contacts } = req.body;
    
    // Explicit array checking to match internal schema validation for data.json
    if (!Array.isArray(contacts)) return res.status(400).json({ error: 'Contacts array required' });

    const dataPath = path.join(__dirname, '..', 'atomfeeds', 'user-assets', 'data.json');

    try {
        await updateDataJson(dataPath, { contact_links: contacts });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contacts' });
    }
};
