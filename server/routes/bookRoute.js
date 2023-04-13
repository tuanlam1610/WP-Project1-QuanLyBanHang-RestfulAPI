const bookController = require('../controllers/bookController');

const router = require('express').Router();

router.post('/add', bookController.addBook);

router.get('/search', bookController.searchBook);

router.get('/report/:id', bookController.saleReport);

router.get('/detail/:id', bookController.getABook)

router.delete('/delete/:id', bookController.deleteBook);

router.put('/update/:id', bookController.updateBook);

module.exports = router;