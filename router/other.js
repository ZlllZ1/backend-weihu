const express = require('express')
const otherHandler = require('../router_handler/other')
const router = express.Router()

router.post('/commitErrorLog', otherHandler.commitErrorLog)

module.exports = router
