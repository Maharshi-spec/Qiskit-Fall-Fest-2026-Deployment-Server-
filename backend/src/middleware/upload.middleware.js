const multer = require('multer')

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.mimetype)

    if (!ok) {
      const error = new Error('Only JPG, PNG, or PDF files are allowed.')
      error.code = 'INVALID_FILE_TYPE'
      return cb(error)
    }

    return cb(null, true)
  },
})

module.exports = {
  upload,
}
