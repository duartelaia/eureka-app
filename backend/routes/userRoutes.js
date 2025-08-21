const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/logout', userController.logout);
router.post('/updateUser', authMiddleware, roleMiddleware(['admin']), userController.updateUser);
router.post('/login', userController.login);

router.get('/me', authMiddleware, userController.getProfile);
router.get('/listUsers', authMiddleware, roleMiddleware(['admin']), userController.listUsers);

module.exports = router;
