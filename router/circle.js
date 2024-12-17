const express = require('express')
const circleHandler = require('../router_handler/circle')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/publishCircle', circleHandler.publishCircle)

router.get('/getCircles', circleHandler.getCircles)

router.post('/praiseCircle', circleHandler.praiseCircle)

router.post('/uploadCircleImg', upload.single('circleImg'), circleHandler.uploadCircleImg)

module.exports = router
