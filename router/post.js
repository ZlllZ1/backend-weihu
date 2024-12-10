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

router.get('/getPosts', postHandler.getPosts)

router.post('/praisePost', postHandler.praisePost)

router.post('/collectPost', postHandler.collectPost)

module.exports = router
