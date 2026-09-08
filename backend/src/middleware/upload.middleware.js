const path = require('path')
const multer = require('multer')
const { maxHackathonFileSizeMb } = require('../config/env')

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

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf'])
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])

const hackathonUpload = multer({
  storage,
  limits: {
    fileSize: (maxHackathonFileSizeMb || 10) * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const mime = (file.mimetype || '').toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
      const error = new Error('Only JPG, JPEG, PNG, or PDF files are allowed.')
      error.code = 'INVALID_FILE_TYPE'
      return cb(error)
    }

    return cb(null, true)
  },
})

module.exports = {
  upload,
  hackathonUpload,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
}

