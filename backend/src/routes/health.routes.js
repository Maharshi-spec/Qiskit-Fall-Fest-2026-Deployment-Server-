const express = require('express')
const router = express.Router()

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'qiskit-fall-fest-backend',
  })
})

module.exports = router
