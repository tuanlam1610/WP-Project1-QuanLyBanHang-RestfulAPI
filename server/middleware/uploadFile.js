const multer = require('multer');

// create a storage engine to specify where to store the uploaded files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

// create a multer instance with the storage engine
const upload = multer({ storage });

// create a middleware function that uses multer to handle file uploads
const uploadMiddleware = upload.single('file');

// export the middleware function for use in your routes
module.exports = uploadMiddleware;
