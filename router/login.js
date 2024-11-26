const express = require('express')
const loginHandler = require('../router_handler/login')

const router = express.Router()

router.post('/sendAuthCode', loginHandler.sendAuthCode)

router.post('/codeLogin', loginHandler.codeLogin)

router.post('/passwordLogin', loginHandler.passwordLogin)

module.exports = router
