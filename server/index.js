const express = require("express")
const app = express()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx')

async function hehe() {
  const hashedPassword = await bcrypt.hash('myPassword', 10);
  // Compare a password with a hash
  const result = await bcrypt.compare('myPassword', hashedPassword);
  console.log(result);
}

const model = require('./model/model')
const bookRoute = require('./routes/bookRoute')
const categoryRoute = require('./routes/categoryRoute')
const orderRoute = require('./routes/orderRoute')
const userRoute = require('./routes/userRoute')
require('dotenv/config');
const PORT = 5000

app.use('/img', express.static("images"));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

app.use('/book', bookRoute);
app.use('/category', categoryRoute);
app.use('/order', orderRoute)

app.get('/', (req, res) => {
  res.send('Hello world.');
})

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './'); // Directory to save the file
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + ext); // File name with timestamp
  }
});

// Set up multer middleware
const upload = multer({ storage: storage });

// API endpoint for uploading Excel file
app.post('/uploadExcel', upload.single('file'), async (req, res) => {
  console.log(req.file); // Log information about the uploaded file
  const file = xlsx.readFile('./file.xlsx')

  let data = []

  const sheets = file.SheetNames

  for (let i = 1; i < sheets.length; i++) {
    const temp = xlsx.utils.sheet_to_json(
      file.Sheets[file.SheetNames[i]])
    temp.forEach(async (res) => {
      const newCategory = new model.Category(res);
      await newCategory.save();
    })
  }

  for (let i = 0; i < 1; i++) {
    const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]])
    temp.forEach(async (res) => {
      try {
        console.log(res);
        if (res.categoryName) {
            const category = await model.Category.findOne({ name: res.categoryName });
            if (!(await category)) {
                
            }
            else {
                res.category = category._id;
                const newBook = new model.Book(res);
                const savedBook = await newBook.save();
                await category.updateOne({ $push: { listOfBook: savedBook._id } });
            }
        }
    } catch (err) {
        res.status(500).json(err);
    }
    })
  }

  res.status(200).json("Thêm thành công");
});

app.post('/user/add', async (req, res) => {
  try {
    // Check if a user with the same username already exists
    const existingUser = await model.User.findOne({ username: req.body.username });

    if (existingUser) {
      return res.status(400).json({ success: false, msg: 'Username đã tồn tại.' });
    }

    req.body.password = await bcrypt.hash(req.body.password, 10);
    const newUser = new model.User(req.body);
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
})

app.post('/user/login', async (req, res) => {
  try {
    const findUser = await model.User.findOne({ username: req.body.username });
    if (findUser) {
      const result = await bcrypt.compare(req.body.password, findUser.password);
      res.status(200).json(result);
    }
    else {
      return res.status(400).json({ success: false, msg: 'Username không tồn tại.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
})

app.post('/login', async (req, res) => {

})

app.get('/dashboard', async (req, res) => {
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