const model = require('../model/model');

const categoryController = {
    addCategory: async (req, res) => {
        try {
            const newCategory = new model.Category(req.body);
            console.log(req.body)
            const savedCategory = await newCategory.save();
            res.status(200).json(savedCategory);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    showBookByCategory: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const itemPerPage = req.query.itemPerPage || 10;
            const listOfBook = await model.Book.find({ category: req.params.id }).sort({ name: 1 }).skip((req.query.page - 1) * req.query.itemPerPage).limit(itemPerPage);
            res.status(200).json(listOfBook);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    deleteCategory: async (req, res) => {
        try {
            let msg = "";
            await model.Book.updateMany({ category: req.params.id }, { $set: { category: null } });
            await model.Category.deleteOne({ _id: req.params.id });
            res.status(200).json("Xóa thành công, vui lòng cập nhật lại thể loại của các loại sách.")
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    },
    updateCategory: async (req, res) => {
        try {
            const a = await model.Category.findByIdAndUpdate(req.params.id, { $set: { name: req.body.newName } });
            res.status(200).json(a)
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = categoryController;