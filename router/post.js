const express = require('express')
const postHandler = require('../router_handler/post')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/uploadCover', upload.single('cover'), postHandler.uploadCover)

router.post('/publishPost', postHandler.publishPost)

router.post('/saveToDraft', postHandler.saveToDraft)

router.post('/clearDraft', postHandler.clearDraft)

router.get('/getDraft', postHandler.getDraft)

router.post('/publishScheduledPost', postHandler.publishScheduledPost)

router.get('/getPosts', postHandler.getPosts)

router.post('/praisePost', postHandler.praisePost)

router.post('/collectPost', postHandler.collectPost)

router.get('/getPostInfo', postHandler.getPostInfo)

router.get('/getPublishedPost', postHandler.getPublishedPost)

router.get('/getOnesPosts', postHandler.getOnesPosts)

router.post('/updateShareNum', postHandler.updateShareNum)

router.post('/comment', postHandler.comment)

router.get('/getComments', postHandler.getComments)

router.post('/praiseComment', postHandler.praiseComment)

router.post('/deletePost', postHandler.deletePost)

router.post('/hidePost', postHandler.hidePost)

router.post('/showPost', postHandler.showPost)

module.exports = router
