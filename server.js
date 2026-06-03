const express = require('express');
const path = require('path');

// --- Route Handlers & Controllers ---
const updateUsername = require('./functions/updateUsername');
const updateProfilePic = require('./functions/updateProfilePic');
const { updateAbout, getAboutMd } = require('./functions/updateAbout');
const { updatePost, getPostMd } = require('./functions/updatePost');
const updateContacts = require('./functions/updateContacts');
const createPost = require('./functions/createPost');
const deletePost = require('./functions/deletePost');

const app = express();
const PORT = 8000;

// --- Middleware Configuration ---
// Increased limit to 10mb to handle large payloads (e.g., Base64 profile pictures/images)
app.use(express.json({ limit: '10mb' }));
// Serve client-side static assets from the root directory
app.use(express.static(path.join(__dirname)));

// --- API Routes ---
// User Profile Endpoints
app.post('/api/update-username', updateUsername);
app.post('/api/update-profile-pic', updateProfilePic);
app.post('/api/update-about', updateAbout);
app.get('/api/get-about-md', getAboutMd);

// Content Management Endpoints
app.post('/api/create-post', createPost);
app.post('/api/update-post', updatePost);
app.get('/api/get-post-md', getPostMd);
app.post('/api/delete-post', deletePost);

// Contact Endpoints
app.post('/api/update-contacts', updateContacts);

// --- Server Initialization ---
app.listen(PORT, () => {
    console.log(`Editor server running at http://localhost:${PORT}`);
});
