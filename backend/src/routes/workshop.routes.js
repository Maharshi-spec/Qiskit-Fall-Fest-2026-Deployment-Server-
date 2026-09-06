const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Workshop endpoint ready' })
})

module.exports = router
