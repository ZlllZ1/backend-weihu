const express = require('express')
const chatHandler = require('../router_handler/chat')
const router = express.Router()

router.get('/getFriendLists', chatHandler.getFriendLists)

router.get('/getChatInfos', chatHandler.getChatInfos)

router.post('/uploadChatImg', chatHandler.uploadChatImg)

module.exports = router
