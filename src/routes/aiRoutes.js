const express = require('express');
const router = express.Router();
const { handleAIChatQuery } = require('../controllers/aiController');
const { sanitizeInput } = require('../middleware/sanitize');

// Public AI Chat Query Endpoint (analyzes website catalog & policies)
router.post('/chat', sanitizeInput, handleAIChatQuery);

module.exports = router;
