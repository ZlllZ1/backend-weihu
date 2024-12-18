const express = require('express')
const circleHandler = require('../router_handler/circle')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/publishCircle', circleHandler.publishCircle)

router.get('/getCircles', circleHandler.getCircles)

router.post('/praiseCircle', circleHandler.praiseCircle)

router.post('/uploadCircleImg', upload.single('circleImg'), circleHandler.uploadCircleImg)

router.post('/commentCircle', circleHandler.commentCircle)

router.get('/getCircleComments', circleHandler.getCircleComments)

router.get('/getPraiseUsers', circleHandler.getPraiseUsers)

router.get('/getMyCircles', circleHandler.getMyCircles)

router.post('/deleteCircle', circleHandler.deleteCircle)

router.post('/hideCircle', circleHandler.hideCircle)

router.post('/showCircle', circleHandler.showCircle)

module.exports = router
