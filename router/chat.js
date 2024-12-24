const express = require('express')
const chatHandler = require('../router_handler/chat')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.get('/getFriendLists', chatHandler.getFriendLists)

router.get('/getChatInfos', chatHandler.getChatInfos)

router.post('/uploadChatImg', upload.single('chatImg'), chatHandler.uploadChatImg)

router.post('/sendMessages', chatHandler.sendMessages)

router.post('/readMessages', chatHandler.readMessages)

module.exports = router
