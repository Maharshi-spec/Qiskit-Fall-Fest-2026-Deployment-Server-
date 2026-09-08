class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    })
  }

  if (err?.type === 'entity.parse.failed' || err?.status === 400 || err?.name === 'SyntaxError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload.',
      },
    })
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    const isHackathon = Boolean(req?.originalUrl?.includes('/hackathon') || req?.baseUrl?.includes('/hackathon') || req?.path?.includes('/hackathon'))
    const maxMb = Number(process.env.MAX_HACKATHON_FILE_SIZE_MB) || 10
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: isHackathon ? `File size must not exceed ${maxMb} MB.` : 'ID card file size must not exceed 500 KB.',
      },
    })
  }

  if (err?.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message,
      },
    })
  }

  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_FIELD',
        message: 'The uploaded file field is invalid.',
      },
    })
  }

  if (err?.code === '23505') {
    if (err?.constraint === 'registrations_email_key' || String(err?.detail || '').includes('email')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'This email is already registered.',
        },
      })
    }
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this information already exists.',
      },
    })
  }

  console.error('[UNHANDLED_ERROR]', err)

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error.',
    },
  })
}

module.exports = {
  AppError,
  errorMiddleware,
}
