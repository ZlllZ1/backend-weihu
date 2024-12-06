const { Post, createPost } = require('../mongodb/post.js')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const uploadCover = async (req, res) => {
	try {
		const fileExt = path.extname(req.file.originalname)
		const uniqueId = uuidv4()
		const ossPath = `cover/${uniqueId}${fileExt}`
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		fs.unlinkSync(req.file.path)
		res.sendSuccess({ message: 'Cover upload successfully', coverUrl: result.url })
	} catch (error) {
		console.error('Error in uploadCover:', error)
		res.sendError(500, 'Internal server error')
	}
}

const publishPost = async (req, res) => {
	const { email, title, coverUrl, content, introduction } = req.body
	if (!email || !title || !coverUrl || !content || !introduction) {
		return res.sendError(400, 'email, title or coverUrl or content or introduction is required')
	}
	try {
		const postData = { email, title, coverUrl, content, introduction, publishData: Date.now }
		const post = await createPost(postData)
		res.sendSuccess({ message: 'Post published successfully', postId: post.postId })
	} catch (error) {
		console.error('Error in publishPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	uploadCover,
	publishPost
}
