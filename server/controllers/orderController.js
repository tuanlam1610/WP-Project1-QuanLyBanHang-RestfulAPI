const model = require('../model/model')

const orderController = {
    addOrder: async (req, res) => {
        try {
            // Tính tổng giá trị đơn hàng
            var total = 0;
            for (i in req.body.listOfBook) {
                const book = (await model.Book.findById(req.body.listOfBook[i].book));
                if (book.stock < req.body.listOfBook[i].quantity) {
                    res.status(400).json(`Sách ${book.name} không đủ số lượng yêu cầu của order!`);
                }

                total += req.body.listOfBook[i].quantity * book.price;
            }

            for (i in req.body.listOfBook) {
                await model.Book.updateOne({ _id: req.body.listOfBook[i].book }, { $inc: { stock: - req.body.listOfBook[i].quantity } });
            }

            console.log(total);
            //Tạo đối tượng đơn hàng
            const order = new model.Order({
                listOfBook: req.body.listOfBook,
                totalPrice: total
            });

            // Lưu đơn hàng vào database
            await order.save();

            // Trả về kết quả thành công
            res.status(201).json(order);
        } catch (error) {
            // Trả về thông báo lỗi nếu có lỗi xảy ra
            res.status(500).json({ error: error.message });
        }
    },
    searchOrder: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const minDate = req.query.minDate ? new Date(req.query.minDate) : null;
            const maxDate = req.query.maxDate ? new Date(req.query.maxDate) : Date(Date.now());
            console.log(minDate);
            console.log(maxDate);
            const listOfOrder = await model.Order.find({
                date: {
                    $lte: maxDate,
                    $gte: minDate
                }
            }).sort({ date: -1 }).skip((req.query.page - 1) * req.query.itemPerPage).limit(itemPerPage);
            res.status(200).json(listOfOrder);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    getAnOrder: async (req, res) => {
        try {
            const orderSearch = await model.Order.findById(req.params.id).populate("listOfBook.book");
            res.status(200).json(orderSearch);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteAnOrder: async (req, res) => {
        try {
            await model.Order.findByIdAndDelete(req.params.id);
            res.status(200).json("Xóa đơn hàng thành công.")
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    updateAnOrder: async (req, res) => {
        try {
            const orderToUpdate = await model.Order.findById(req.params.id);
            orderToUpdate.listOfBook = req.body.listOfBook;
            orderToUpdate.save();
            res.status(200).json(orderToUpdate)
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    incomeReport: async (req, res) => {
        try {
            const modeReport = req.query.mode;
            const start = new Date(req.query.minDate);
            const end = req.query.maxDate ? new Date(req.query.maxDate) : Date(Date.now());
            console.log(start);
            console.log(end);

            const filter = {
                date: { $gte: start, $lte: end }
            };

            let aggregateQuery = [
                { $match: filter },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                        },
                        totalIncome: { $sum: "$totalPrice" }
                    }
                }
            ];

            if (modeReport === "month") {
                aggregateQuery[1].$group._id = { $dateToString: { format: "%Y-%m", date: "$date" } };
            } else if (modeReport === "year") {
                aggregateQuery[1].$group._id = { $dateToString: { format: "%Y", date: "$date" } };
            }

            const incomeReport = await model.Order.aggregate(aggregateQuery);

            res.status(200).json(incomeReport);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = orderController;