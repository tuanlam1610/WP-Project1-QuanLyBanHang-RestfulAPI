const model = require('../model/model')
const mongoose = require('mongoose')
const fs = require('fs');
const path = require('path');

const bookController = {
    addBook: async (req, res) => {
        try {
            console.log(req.file)
            console.log(req.body)
            if (req.body.stock < 0) {
                res.status(400).json({
                    msg: "Số lượng hàng phải lớn hơn 0!"
                });
                return;
            }
            if (req.body.category_Name) {
                const category = await model.Category.findOne({ name: req.body.category_Name });
                if (!(await category)) {
                    res.status(400).json({
                        msg: "Thể loại này không tồn tại"
                    });
                    return;
                }
                else {
                    req.body.category = category._id;
                    if (req.file) {
                        try {
                            const newImg = new model.Img({
                                data: fs.readFileSync(path.join('./' + req.file.filename))
                            })
                            newImg.save()
                            req.body.imagePath = newImg._id
                        } catch (error) {
                            res.status(500).json({ msg: "Can not find path" })
                        } finally {
                            // Remove the uploaded file from the server
                            fs.unlinkSync(req.file.path);
                        }
                    }
                    else {
                        req.body.imagePath = null
                    }
                    const newBook = new model.Book(req.body);
                    const savedBook = await newBook.save();
                    await category.updateOne({ $push: { listOfBook: savedBook._id } });

                    res.status(200).json({
                        msg: "Thêm sách thành công!",
                        book: savedBook
                    });
                }
            } else {
                res.status(400).json({ msg: "bạn phải nhập thể loại sách" })
                return;
            }
        } catch (err) {
            res.status(500).json(err);
        }
    },
    getABook: async (req, res) => {
        try {
            const bookSearch = await model.Book.findById(req.params.id).populate({ path: "category", select: "name" });;
            if (bookSearch)
                res.status(200).json({
                    book: bookSearch
                });
            else {
                res.status(400).json({
                    msg: "Không tìm thấy sách này!"
                })
                return;
            }
        } catch (err) {
            res.status(500).json(err);
        }
    },
    updateBook: async (req, res) => {
        try {
            if (req.body.stock) {
                if (req.body.stock < 0) {
                    res.status(400).json({
                        msg: "Số lượng hàng phải lớn hơn 0!"
                    });
                    return;
                }
            }
            const bookToUpdate = await model.Book.findById(req.params.id);
            if (req.body.category_Name) {
                const category = await model.Category.findOne({ name: req.body.category_Name });
                if (!category) {
                    res.status(400).json({
                        msg: "Thể loại không tồn tại! Vui lòng nhập thể loại khác."
                    })
                    return;
                }
                req.body.category = category._id
                await model.Category.findByIdAndUpdate(bookToUpdate.category, { $pull: { listOfBook: bookToUpdate._id } })
                await model.Category.findByIdAndUpdate(category._id, { $push: { listOfBook: bookToUpdate._id } })
            }
            if (req.file) {
                try {
                    if (bookToUpdate.imagePath) {
                        await model.Img.findByIdAndDelete(bookToUpdate.imagePath)
                    }
                    const newImg = new model.Img({
                        data: fs.readFileSync(path.join('./' + req.file.filename))
                    })
                    newImg.save()
                    req.body.imagePath = newImg._id
                } catch (error) {
                    res.status(500).json({ msg: "Can not find path" })
                } finally {
                    // Remove the uploaded file from the server
                    fs.unlinkSync(req.file.path);
                }
            }
            const updatedBook = await model.Book.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
            res.status(200).json({
                msg: "Cập nhật sách thành công",
                updatedBook: updatedBook
            })
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteImg: async (req, res) => {
        try {
            const bookToUpdate = await model.Book.findById(req.params.id);
            if (bookToUpdate.imagePath) {
                await model.Img.findByIdAndDelete(bookToUpdate.imagePath)
            }
            bookToUpdate.imagePath = null;
            bookToUpdate.save();
            res.status(200).json({
                msg: "Xóa hình thành công",
                book: bookToUpdate
            })
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteBook: async (req, res) => {
        try {
            const bookToDelete = await model.Book.findById(req.params.id);
            await model.Img.findByIdAndDelete(bookToDelete.imagePath);
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
            const numOfBooks = await model.Book.count()
                .where({
                    name: { $regex: new RegExp(nameToSearch, "i") }
                }).where({
                    price: {
                        $lte: maxPrice,
                        $gte: minPrice
                    }
                });
            console.log(numOfBooks)
            const numOfPage = Math.ceil(numOfBooks / itemPerPage)
            console.log(numOfPage)
            const listOfBook = await model.Book.find()
                .where({
                    name: { $regex: new RegExp(nameToSearch, "i") }
                }).where({
                    price: {
                        $lte: maxPrice,
                        $gte: minPrice
                    }
                })
                .sort({ name: 1 })
                .skip((page - 1) * itemPerPage)
                .limit(itemPerPage);
            res.status(200).json({
                listOfBook: listOfBook,
                numOfBooks: numOfBooks,
                numOfPage: numOfPage
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    saleReport: async (req, res) => {
        try {
            const modeReport = req.query.mode;
            const start = new Date(req.query.minDate);
            const end = req.query.maxDate ? new Date(req.query.maxDate) : new Date(Date.now());
            if (req.query.maxDate){
                end.setDate(end.getDate() + 1);
            }
            const filter = {
                date: { $gte: start, $lte: end },
            };

            let aggregateQuery = [
                {
                    $match: filter
                },
                {
                    $unwind: "$listOfBook"
                },
                {
                    $lookup: {
                        from: "books",
                        localField: "listOfBook.book",
                        foreignField: "_id",
                        as: "bookDetails",
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            book: "$bookDetails",
                        },
                        totalQuantity: { $sum: "$listOfBook.quantity" }
                    }
                }, {
                    $sort: {
                        "_id.date": 1,
                        totalQuantity: -1
                    }
                }
            ];

            if (modeReport === "month") {
                aggregateQuery[3].$group._id.date = { $dateToString: { format: "%Y-%m", date: "$date" } };
            } else if (modeReport === "year") {
                aggregateQuery[3].$group._id.date = { $dateToString: { format: "%Y", date: "$date" } };
            } else if (modeReport === "week") {
                aggregateQuery[3].$group._id = {
                    week: { $isoWeek: "$date" },
                    year: { $year: "$date" },
                    book: "$bookDetails",
                };
                aggregateQuery[4].$sort = {
                    "_id.year": 1,
                    "_id.week": 1,
                    totalQuantity: -1
                }
            }

            const saleReport = await model.Order.aggregate(aggregateQuery);
            res.status(200).json({
                saleReport: saleReport
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = bookController;