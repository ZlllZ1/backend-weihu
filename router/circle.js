const express = require('express')
const circleHandler = require('../router_handler/circle')
const router = express.Router()

router.post('/publishCircle', circleHandler.publishCircle)

router.get('/getCircles', circleHandler.getCircles)

router.post('/praiseCircle', circleHandler.praiseCircle)

module.exports = router
