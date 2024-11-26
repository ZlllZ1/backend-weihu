const express = require('express')
const userHandler = require('../router_handler/user')

const router = express.Router()

router.get('/getUserInfo', userHandler.getUserInfo)

router.post('/logout', userHandler.logout)

module.exports = router
