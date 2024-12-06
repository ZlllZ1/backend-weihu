const express = require('express')
const postHandler = require('../router_handler/post')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/uploadCover', upload.single('cover'), postHandler.uploadCover)

router.post('/publishPost', postHandler.publishPost)

module.exports = router
