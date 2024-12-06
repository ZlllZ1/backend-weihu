const express = require('express')
const postHandler = require('../router_handler/post')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/uploadCover', upload.single('cover'), postHandler.uploadCover)

router.post('/publishPost', postHandler.publishPost)

router.post('/saveToDraft', postHandler.saveToDraft)

router.get('/getDraft', postHandler.getDraft)

router.post('/publishScheduledPost', postHandler.publishScheduledPost)

module.exports = router
