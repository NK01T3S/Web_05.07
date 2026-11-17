const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const { list, create } = require('../controllers/categoriesController');

router.get('/', list);
router.post('/', auth, adminOnly, create); 

module.exports = router;