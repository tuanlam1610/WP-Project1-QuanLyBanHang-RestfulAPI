const express = require("express")
const app = express()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx')
const model = require('./model/model')
const bookRoute = require('./routes/bookRoute')
const categoryRoute = require('./routes/categoryRoute')
const orderRoute = require('./routes/orderRoute')
const userRoute = require('./routes/userRoute')
require('dotenv/config');
const PORT = 5000

app.use(express.json())
app.use('/img', express.static("images"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

app.use('/book', bookRoute);
app.use('/category', categoryRoute);
app.use('/order', orderRoute);
app.use('/user', userRoute);

app.get('/', (req, res) => {
  res.send('Quản lý bán hàng Restful API.');
})

// Set up storage engine for multer
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

// API endpoint for uploading Excel file
app.post('/uploadExcel', upload.single('file'), async (req, res) => {
  try {
    const file = xlsx.readFile(req.file.path);
    const sheets = file.SheetNames;

    // Save categories
    for (let i = 1; i < sheets.length; i++) {
      const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      for (const category of temp) {
        try {
          const newCategory = new model.Category(category);
          await newCategory.save();
        } catch (err) {
          console.error(err);
        }
      }
    }

    const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);
    for (const row of temp) {
      try {
        row.imagePath = null;
        console.log(row);
        if (row.categoryName) {
          const category = await model.Category.findOne({ name: row.categoryName });
          if (category) {
            row.category = category._id;
            const newBook = new model.Book(row);
            const savedBook = await newBook.save();
            await category.updateOne({
              $push: {
                listOfBook: savedBook._id
              }
            });
          } else {
            console.error(`Category ${row.categoryName} not found`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    res.status(200).json("Thêm thành công");
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  } finally {
    // Remove the uploaded file from the server
    fs.unlinkSync(req.file.path);
  }
});

app.post('/uploadImg', upload.single('image'), async (req, res, next) => {
  try {
    const newImg = new model.Img({
      data: fs.readFileSync(path.join('./images/' + req.file.filename))
    })
    newImg.save()
    console.log(req.file)
    console.log(req.body)
    res.status(200).json(newImg)
  } catch (error) {
    res.status(500).json(err);
  } finally {
    // Remove the uploaded file from the server
    fs.unlinkSync(req.file.path);
  }
});

app.get('/getImg/:id', async (req, res) => {
  try {
    const img = await model.Img.findById(req.params.id)
    res.status(200).json(img)
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const numOfBooks = await model.Book.count()
    console.log(numOfBooks);

    const now = new Date(Date.now());
    console.log(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    console.log(start);
    const numOfOrderThisWeek = await model.Order.count().where({
      date: {
        $gte: start,
        $lte: now
      }
    });
    console.log(numOfOrderThisWeek)
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0);
    startOfMonth.setMinutes(0);
    startOfMonth.setSeconds(0);
    startOfMonth.setMilliseconds(0);
    console.log(startOfMonth)

    const numOfOrderThisMonth = await model.Order.count().where({
      date: {
        $gte: startOfMonth,
        $lte: now
      }
    });
    console.log(numOfOrderThisMonth);
    const listOfBookOutOfStock = await model.Book.find({
      stock: {
        $lte: 5
      }
    })
      .sort({ stock: 1 })
      .limit(5);

    console.log(listOfBookOutOfStock);
    res.status(200).json({
      numOfBooks: numOfBooks,
      numOfOrderThisWeek: numOfOrderThisWeek,
      numOfOrderThisMonth: numOfOrderThisMonth,
      listOfBookOutOfStock: listOfBookOutOfStock
    })
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
})

mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to database successfully!!');
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
  });

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})