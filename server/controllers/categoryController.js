const model = require('../model/model');

const categoryController = {
    addCategory: async (req, res) => {
        try {
            const newCategory = new model.Category(req.body);
            console.log(req.body)
            const savedCategory = await newCategory.save();
            res.status(200).json({
                msg: "Thêm thể loại thành công!",
                category: savedCategory
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    showListOfCategory: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const nameToSearch = req.query.name || "";
            const numOfCategory = await model.Category.count()
                .where({
                    name: { $regex: new RegExp(nameToSearch, "i") }
                });
            console.log(numOfCategory);
            const numOfPage = Math.ceil(numOfCategory / itemPerPage)
            console.log(numOfPage)
            const listOfCategory = await model.Category.find()
                .where({
                    name: { $regex: new RegExp(nameToSearch, "i") }
                })
                .sort({ name: 1 })
                .skip((page - 1) * itemPerPage)
                .limit(itemPerPage);
            res.status(200).json({
                listOfCategory: listOfCategory,
                numOfCategory: numOfCategory,
                numOfPage: numOfPage
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    showBookByCategory: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const numOfBooks = await model.Book.count({ category: req.params.id });
            console.log(numOfBooks)
            const numOfPage = Math.ceil(numOfBooks / itemPerPage)
            const listOfBook = await model.Book.find({ category: req.params.id }).sort({ name: 1 })
                .skip((page - 1) * req.query.itemPerPage)
                .limit(itemPerPage)
                .populate({ path: "category", select: "name" });
            const categoryDetail = await model.Category.findById(req.params.id).select("name");
            res.status(200).json({
                categoryDetail: categoryDetail,
                listOfBook: listOfBook,
                numOfBooks: numOfBooks,
                numOfPage: numOfPage
            });
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteCategory: async (req, res) => {
        try {
            let msg = "";
            await model.Book.updateMany({ category: req.params.id }, { $set: { category: null } });
            await model.Category.deleteOne({ _id: req.params.id });
            res.status(200).json({
                msg: "Xóa thành công, vui lòng cập nhật lại thể loại của các loại sách."
            })
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    updateCategory: async (req, res) => {
        try {
            const a = await model.Category.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name } }, {new: true});
            res.status(200).json({
                msg: "Cập nhật thể loại thành công",
                categoryAfterUpdated: a
            })
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = categoryController;