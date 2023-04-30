const model = require('../model/model')
const mongoose = require('mongoose')

const orderController = {
    addOrder: async (req, res) => {
        try {
            // Tính tổng giá trị đơn hàng
            var total = 0;
            for (let i = 0; i < req.body.listOfBook.length; i++) {
                const book = await model.Book.findById(req.body.listOfBook[i].book);
                if (book.stock < req.body.listOfBook[i].quantity) {
                    res.status(400).json(`Sách ${book.name} không đủ số lượng yêu cầu của order!`);
                    return;
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
            res.status(201).json({
                msg: "Thêm đơn hàng thành công",
                order: order
            });
        } catch (error) {
            // Trả về thông báo lỗi nếu có lỗi xảy ra
            res.status(500).json({ error: error.message });
        }
    },
    searchOrder: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const minDate = req.query.minDate ? new Date(req.query.minDate) : new Date("2000-01-01");
            const maxDate = req.query.maxDate ? new Date(req.query.maxDate) : new Date(Date.now());
            if (req.query.maxDate){
                maxDate.setDate(maxDate.getDate() + 1);
            }
            const numOfOrders = await model.Order.count()
                .where({
                    date: {
                        $lte: maxDate,
                        $gte: minDate
                    }
                });
            console.log(numOfOrders)
            const numOfPage = Math.ceil(numOfOrders / itemPerPage)
            console.log(numOfPage)
            const listOfOrder = await model.Order.find({
                date: {
                    $lte: maxDate,
                    $gte: minDate
                }
            })
                .sort({ date: -1 })
                .skip((page - 1) * itemPerPage)
                .limit(itemPerPage);
            res.status(200).json({
                listOfOrder: listOfOrder,
                numOfOrders: numOfOrders,
                numOfPage: numOfPage
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    getAnOrder: async (req, res) => {
        try {
            const orderSearch = await model.Order.findById(req.params.id).populate("listOfBook.book");
            if (orderSearch) {
                res.status(200).json({
                    order: orderSearch
                });
            }
            else {
                res.status(400).json({
                    msg: "Đơn hàng này không tồn tại"
                })
            }
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteAnOrder: async (req, res) => {
        try {
            await model.Order.findByIdAndDelete(req.params.id);
            res.status(200).json({
                msg: "Xóa đơn hàng thành công."
            })
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    updateAnOrder: async (req, res) => {
        const session = await model.Order.startSession();
        session.startTransaction();
        try {
            const orderToUpdate = await model.Order.findById(req.params.id).session(session);
            if (req.body.listOfBook) {
                for (i in orderToUpdate.listOfBook) {
                    await model.Book.updateOne({ _id: orderToUpdate.listOfBook[i].book }, { $inc: { stock: orderToUpdate.listOfBook[i].quantity } }, { session });
                }
                var total = 0;
                for (i in req.body.listOfBook) {
                    const book = await model.Book.findById(req.body.listOfBook[i].book).session(session);
                    if (book.stock < req.body.listOfBook[i].quantity) {
                        await session.abortTransaction();
                        session.endSession();
                        res.status(400).json(`Sách ${book.name} không đủ số lượng yêu cầu của order!`);
                        return;
                    }
    
                    total += req.body.listOfBook[i].quantity * book.price;
                }
                for (i in req.body.listOfBook) {
                    await model.Book.updateOne({ _id: req.body.listOfBook[i].book }, { $inc: { stock: - req.body.listOfBook[i].quantity } }, { session });
                }
    
                console.log(total);
                orderToUpdate.listOfBook = req.body.listOfBook;
                orderToUpdate.totalPrice = total
            }
            if (req.body.date)
                orderToUpdate.date = new Date(req.body.date)
            await orderToUpdate.save({ session });
            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg: "Cập nhật đơn hàng thành công",
                order: orderToUpdate
            })
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    incomeReport: async (req, res) => {
        try {
            const modeReport = req.query.mode;
            const start = new Date(req.query.minDate);
            const end = req.query.maxDate ? new Date(req.query.maxDate) : new Date(Date.now());
            if (req.query.maxDate){
                end.setDate(end.getDate() + 1);
            }
            console.log(end)
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
                },
                {
                    $sort: {
                        "_id.date": 1
                    }
                }
            ];

            if (modeReport === "month") {
                aggregateQuery[1].$group._id = { $dateToString: { format: "%Y-%m", date: "$date" } };
            } else if (modeReport === "year") {
                aggregateQuery[1].$group._id = { $dateToString: { format: "%Y", date: "$date" } };
            } else if (modeReport === "week") {
                aggregateQuery[1].$group._id = {
                    week: { $isoWeek: "$date" },
                    year: { $year: "$date" }
                };
                aggregateQuery[1].$group.totalIncome = { $sum: "$totalPrice" };
                aggregateQuery[2].$sort = {
                    "_id.year": 1,
                    "_id.week": 1
                }
            }

            const incomeReport = await model.Order.aggregate(aggregateQuery);
            console.log(incomeReport);
            res.status(200).json({
                incomeReport: incomeReport
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }

}

module.exports = orderController;