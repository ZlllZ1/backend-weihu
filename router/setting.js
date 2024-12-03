const express = require('express')
const settingHandler = require('../router_handler/setting')
const router = express.Router()

router.post('/changeShowIp', settingHandler.changeShowIp)

router.post('/changeShowFan', settingHandler.changeShowFan)

router.post('/changeShowFollow', settingHandler.changeShowFollow)

router.post('/changeShowLive', settingHandler.changeShowLive)

router.post('/changeShowShare', settingHandler.changeShowShare)

router.post('/changeShowFriend', settingHandler.changeShowFriend)

router.post('/changeShowPraise', settingHandler.changeShowPraise)

router.post('/changeShowCollect', settingHandler.changeShowCollect)

router.post('/changePostLimit', settingHandler.changePostLimit)

router.post('/changeChatLimit', settingHandler.changeChatLimit)

router.post('/changeCircleLimit', settingHandler.changeCircleLimit)

module.exports = router
