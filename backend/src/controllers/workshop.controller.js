const workshopService = require('../services/workshop.service')

const getWorkshops = async (req, res, next) => {
  try {
    const result = await workshopService.getWorkshops()
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getWorkshops,
}
