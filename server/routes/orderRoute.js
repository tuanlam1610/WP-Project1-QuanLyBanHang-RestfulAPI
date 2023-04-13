const orderController = require('../controllers/orderController');

const router = require('express').Router();

router.post('/add', orderController.addOrder);

router.get('/search', orderController.searchOrder);

router.get('/report', orderController.incomeReport);

router.get('/detail/:id', orderController.getAnOrder)

router.delete('/delete/:id', orderController.deleteAnOrder);

router.put('/update/:id', orderController.updateAnOrder);

module.exports = router;