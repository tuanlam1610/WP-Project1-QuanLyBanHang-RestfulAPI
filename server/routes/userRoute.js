const userController = require('../controllers/userController');

const router = require('express').Router();

router.post('/login', userController.login)

router.post('/add', userController.addUser);

// router.delete('/delete/:id', userController);

// router.put('update/:id', userController);

module.exports = router;