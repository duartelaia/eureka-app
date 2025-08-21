const express = require('express');
const router = express.Router();
const workdayController = require('../controllers/workdayController');
const roleMiddleware = require('../middleware/roleMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/updateWorkday', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.updateWorkday);
router.post('/deleteWorkday', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.deleteWorkday);

router.post('/insertBreak', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.insertBreak);
router.post('/updateBreak', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.updateBreak);
router.post('/deleteBreak', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.deleteBreak);

router.get('/listMonth', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.listMonthWorkdays);
router.get('/listBreaks', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.listBreaks);

router.get('/listWorkedHours', authMiddleware, roleMiddleware(['admin', 'member']), workdayController.listWorkedHours);

module.exports = router;