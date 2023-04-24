const categoryController = require('../controllers/categoryController');

const router = require('express').Router();

router.post('/add', categoryController.addCategory);

router.get('/searchCategory', categoryController.showListOfCategory)

router.get('/showBook/:id', categoryController.showBookByCategory)

router.delete('/delete/:id', categoryController.deleteCategory);

router.put('/update/:id', categoryController.updateCategory);

module.exports = router;