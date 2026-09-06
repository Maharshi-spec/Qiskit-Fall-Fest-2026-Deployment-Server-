const attendanceService = require('../services/attendance.service')

const getEventsList = async (req, res, next) => {
  try {
    const events = await attendanceService.getEventsList()
    return res.status(200).json({
      success: true,
      data: events,
    })
  } catch (error) {
    return next(error)
  }
}

const createEvent = async (req, res, next) => {
  try {
    const event = await attendanceService.createEvent(req.body)
    return res.status(201).json({
      success: true,
      data: event,
    })
  } catch (error) {
    return next(error)
  }
}

const startSession = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const organizerId = req.user?.userId || req.user?.id
    const userEmail = req.user?.email
    const session = await attendanceService.startAttendanceSession(eventId, organizerId, userEmail)
    return res.status(200).json({
      success: true,
      data: session,
    })
  } catch (error) {
    return next(error)
  }
}

const stopSession = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const organizerId = req.user?.userId || req.user?.id
    const userEmail = req.user?.email
    const result = await attendanceService.stopAttendanceSession(eventId, organizerId, userEmail)
    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    return next(error)
  }
}

const getLiveQrToken = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const tokenData = await attendanceService.generateLiveQrToken(eventId)
    return res.status(200).json({
      success: true,
      data: tokenData,
    })
  } catch (error) {
    return next(error)
  }
}

const getAttendanceData = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const records = await attendanceService.getAttendanceRecords(eventId)
    return res.status(200).json({
      success: true,
      data: {
        eventId,
        count: records.length,
        records,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const markAttendance = async (req, res, next) => {
  try {
    const attendanceToken = req.body?.attendance_token || req.body?.token
    const participantUser = req.user
    const result = await attendanceService.markAttendance(participantUser, attendanceToken)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getEventsList,
  createEvent,
  startSession,
  stopSession,
  getLiveQrToken,
  getAttendanceData,
  markAttendance,
}
