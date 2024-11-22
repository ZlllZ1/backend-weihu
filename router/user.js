const express = require('express')
const userHandler = require('../router_handler/user')

const router = express.Router()


router.post('/register', userHandler.register)

router.post('/login', userHandler.login)

module.exports = router
