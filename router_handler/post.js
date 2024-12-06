const Post = require('../mongodb/post.js')
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
	const { postId, userId, title } = req.body
}

module.exports = {
	uploadCover,
	publishPost
}
