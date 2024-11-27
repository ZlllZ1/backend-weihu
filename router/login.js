const express = require('express')
const loginHandler = require('../router_handler/login')

const router = express.Router()

router.post('/sendAuthCode', loginHandler.sendAuthCode)

router.post('/codeLogin', loginHandler.codeLogin)

router.post('/passwordLogin', loginHandler.passwordLogin)

router.post('/logout', loginHandler.logout)

module.exports = router
