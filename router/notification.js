const express = require('express')
const notificationHandler = require('../router_handler/notification')
const router = express.Router()

router.post('/judgeNewNotification', notificationHandler.judgeNewNotification)

router.post('/calcNewNum', notificationHandler.calcNewNum)

router.get('/getNotifications', notificationHandler.getNotifications)

router.post('/readNew', notificationHandler.readNew)

module.exports = router
