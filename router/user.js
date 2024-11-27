const express = require('express')
const userHandler = require('../router_handler/user')

const router = express.Router()

router.get('/getUserInfo', userHandler.getUserInfo)

// router.post('/logout', userHandler.logout)

router.post('/changeNickname', userHandler.changeNickname)

router.post('/changeSex', userHandler.changeSex)

router.post('/changeEmail', userHandler.changeEmail)

module.exports = router
