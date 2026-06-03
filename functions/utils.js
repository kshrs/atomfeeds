const fs = require('fs/promises');

/**
 * Shared Utility: Read-modify-write helper for mutating the core metadata JSON registry.
 * Handles parsing, payload injection, and automatic format adjustments for modification records.
 */
const updateDataJson = async (dataPath, updates) => {
    const fileData = await fs.readFile(dataPath, 'utf-8');
    const jsonData = JSON.parse(fileData);
    
    // Mutate state configurations atomically via object assignment
    Object.assign(jsonData, updates);
    
    // System-wide timestamp standardization (DD MMM YYYY) for cross-service parsers
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    jsonData.last_updated = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    
    // Human-readable formatting retained (4-space indent) for easy local development debugging
    await fs.writeFile(dataPath, JSON.stringify(jsonData, null, 4));
};

module.exports = { updateDataJson };
