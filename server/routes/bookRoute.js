const bookController = require('../controllers/bookController');
const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images'); // Directory to save the file
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // File name with timestamp
    }
});

// Set up multer middleware
const upload = multer({ storage: storage });
const router = require('express').Router();

router.post('/add', upload.single("image"), bookController.addBook);

router.get('/search', bookController.searchBook);

router.get('/report', bookController.saleReport);

router.get('/detail/:id', bookController.getABook)

router.delete('/delete/:id', bookController.deleteBook);

router.put('/deleteImg/:id', bookController.deleteImg);

router.put('/update/:id', upload.single("image"), bookController.updateBook);

module.exports = router;