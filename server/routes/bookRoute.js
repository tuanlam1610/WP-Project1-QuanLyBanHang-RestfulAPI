const bookController = require('../controllers/bookController');
const uploadMiddleware = require('../middleware/uploadFile');
const router = require('express').Router();

router.post('/add', uploadMiddleware, bookController.addBook);

router.get('/search', bookController.searchBook);

router.get('/report', bookController.saleReport);

router.get('/detail/:id', bookController.getABook)

router.delete('/delete/:id', bookController.deleteBook);

router.put('/deleteImg/:id', bookController.deleteImg);

router.put('/update/:id', uploadMiddleware, bookController.updateBook);

module.exports = router;