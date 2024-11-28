const express = require('express')
const userHandler = require('../router_handler/user')

const router = express.Router()

router.get('/getUserInfo', userHandler.getUserInfo)

router.post('/changeNickname', userHandler.changeNickname)

router.post('/changeSex', userHandler.changeSex)

router.post('/changeEmail', userHandler.changeEmail)

router.post('/changePassword', userHandler.changePassword)

router.post('/changeIntroduction', userHandler.changeIntroduction)

router.post('/changeBirthDate', userHandler.changeBirthDate)

module.exports = router
