const express = require('express')
const userHandler = require('../router_handler/user')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const router = express.Router()

router.get('/getUserInfo', userHandler.getUserInfo)

router.post('/changeNickname', userHandler.changeNickname)

router.post('/changeLive', userHandler.changeLive)

router.post('/changeSex', userHandler.changeSex)

router.post('/changeEmail', userHandler.changeEmail)

router.post('/changePassword', userHandler.changePassword)

router.post('/changeIntroduction', userHandler.changeIntroduction)

router.post('/changeBirthDate', userHandler.changeBirthDate)

router.post('/changeAvatar', upload.single('avatar'), userHandler.changeAvatar)

router.post('/changeHomeBg', upload.single('homeBg'), userHandler.changeHomeBg)

router.post('/changeCircleBg', upload.single('circleBg'), userHandler.changeCircleBg)

router.post('/followUser', userHandler.followUser)

module.exports = router
