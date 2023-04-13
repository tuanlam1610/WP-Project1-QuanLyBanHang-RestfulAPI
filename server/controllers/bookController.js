const model = require('../model/model')
const mongoose = require('mongoose')

const bookController = {
    addBook: async (req, res) => {
        try {
            let msg;

            if (req.body.category_Name) {
                const category = await model.Category.findOne({ name: req.body.category_Name });
                if (!(await category)) {
                    msg = "Thể loại này không tồn tại.!\n"
                }
                else {
                    req.body.category = category._id;
                    const newBook = new model.Book(req.body);
                    const savedBook = await newBook.save();
                    await category.updateOne({ $push: { listOfBook: savedBook._id } });
                    msg = "Add success!!!"
                }
            }
            res.send(msg);
        } catch (err) {
            res.status(500).json(err);
        }
    },
    getABook: async (req, res) => {
        const bookSearch = await model.Book.findById(req.params.id).populate("category");
        console.log(bookSearch);
        res.status(200).json(bookSearch);
    },
    updateBook: async (req, res) => {
        try {
            const bookToUpdate = await model.Book.findById(req.params.id);
            if (req.body.category) {
                await model.Category.findByIdAndUpdate(bookToUpdate.category, { $pull: { listOfBook: bookToUpdate._id } })
                await model.Category.findByIdAndUpdate(req.body.category, { $push: { listOfBook: bookToUpdate._id } })
            }
            const updatedBook = await model.Book.findByIdAndUpdate(req.params.id, { $set: req.body })
            res.status(200).json(updatedBook)
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteBook: async (req, res) => {
        try {
            const bookToDelete = await model.Book.findById(req.params.id);
            await model.Category.findByIdAndUpdate(bookToDelete.category, { $pull: { listOfBook: bookToDelete._id } })
            await model.Book.findByIdAndDelete(req.params.id)
            res.status(200).json("Xóa thành công.")
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    searchBook: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const nameToSearch = req.query.name || "";
            const minPrice = req.query.minPrice || 0;
            const maxPrice = req.query.maxPrice || 100000000;
            console.log(page, itemPerPage, nameToSearch, minPrice, maxPrice);
            const listOfBook = await model.Book.find()
                .where({
                    name: { $regex: nameToSearch }
                }).where({
                    price: {
                        $lte: maxPrice,
                        $gte: minPrice
                    }
                })
                .sort({ name: 1 })
                .skip((page - 1) * itemPerPage)
                .limit(itemPerPage);
            res.status(200).json(listOfBook);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    saleReport: async (req, res) => {
        try {
            const modeReport = req.query.mode;
            const start = new Date(req.query.minDate);
            const end = req.query.maxDate ? new Date(req.query.maxDate) : Date(Date.now());
            console.log(start);
            console.log(end);
            // const bookSearch = await model.Book.findById(req.params.id);
            // console.log(bookSearch);
            const filter = {
                date: { $gte: start, $lte: end },
                "listOfBook.book": { $in: [new mongoose.Types.ObjectId(req.params.id)] }
            };

            // const orderSearch = await model.Order.find(filter);
            // console.log("Search")
            // console.log(orderSearch)
            // console.log(req.params.id)
            // res.status(200).json(orderSearch)
            let aggregateQuery = [
                {
                    $match: filter
                },
                {
                    $unwind: "$listOfBook"
                },
                {
                    $match: {
                        "listOfBook.book": new mongoose.Types.ObjectId(req.params.id)
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            book: "$listOfBook.book",
                        },
                        totalQuantity: { $sum: "$listOfBook.quantity" }
                    }
                }
            ];

            if (modeReport === "month") {
                aggregateQuery[3].$group._id.date = { $dateToString: { format: "%Y-%m", date: "$date" } };
            } else if (modeReport === "year") {
                aggregateQuery[3].$group._id.date = { $dateToString: { format: "%Y", date: "$date" } };
            }

            const incomeReport = await model.Order.aggregate(aggregateQuery);
            console.log(incomeReport)
            res.status(200).json(incomeReport);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = bookController;