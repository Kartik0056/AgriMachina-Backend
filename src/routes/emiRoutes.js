const express = require('express');
const router = express.Router();
const { calculateEMI, getProductEMIPlans } = require('../controllers/emiController');

router.post('/calculate', calculateEMI);
router.get('/products/:id', getProductEMIPlans);

module.exports = router;
