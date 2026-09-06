const rateLimit = (req, res, next) => {
  const now = Date.now()
  const ip = req.ip || 'unknown'

  if (!global.__rateLimitMap) {
    global.__rateLimitMap = new Map()
  }

  const recentRequests = global.__rateLimitMap.get(ip) || []
  const filteredRequests = recentRequests.filter((timestamp) => now - timestamp < 60000)

  filteredRequests.push(now)

  if (filteredRequests.length > 60) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      },
    })
  }

  global.__rateLimitMap.set(ip, filteredRequests)
  next()
}

module.exports = {
  rateLimit,
}
