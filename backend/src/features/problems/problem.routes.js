
const express = require('express');
const router = express.Router();
const { listProblems, getSingleProblem, create, addTestCasesToProblem } = require('./problem.controller');
const authMiddleware = require('../auth/auth.middleware');
const adminMiddleware = require('../admin/admin.middleware');

router.get('/', listProblems);
router.get('/:slug', getSingleProblem);
router.post('/', authMiddleware, adminMiddleware, create);
router.post('/:id/testcases', authMiddleware, adminMiddleware, addTestCasesToProblem);

module.exports = router;