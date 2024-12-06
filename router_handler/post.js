const { Post, createPost } = require('../mongodb/post.js')
const schedule = require('node-schedule')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const User = require('../mongodb/user.js')
const Draft = require('../mongodb/draft.js')
const ScheduledPost = require('../mongodb/scheduledPost.js')

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
	const { email, title, coverUrl, content, introduction, delta, type } = req.body
	if (!email || !title || !coverUrl || !content || !introduction || !delta) {
		return res.sendError(
			400,
			'email, title or coverUrl or content or introduction or delta is required'
		)
	}
	try {
		const user = await User.findOne({ email })
		const commitUser = {
			email: user.email,
			nickname: user.nickname,
			live: user.live,
			avatar: user.avatar,
			introduction: user.introduction
		}
		const postData = {
			email,
			title,
			coverUrl,
			content,
			introduction,
			delta,
			publishData: Date.now,
			user: commitUser
		}
		if (type === 'draft') {
			await Draft.deleteMany({ email })
		}
		const post = await createPost(postData)
		res.sendSuccess({ message: 'Post published successfully', postId: post.postId })
	} catch (error) {
		console.error('Error in publishPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const saveToDraft = async (req, res) => {
	const { email, title, coverUrl, content, introduction, delta } = req.body
	if (!email) {
		return res.sendError(400, 'email is required')
	}
	try {
		const user = await User.findOne({ email })
		if (!user) {
			return res.sendError(404, 'User not found')
		}
		const draft = new Draft({
			email,
			title,
			coverUrl,
			content,
			introduction,
			draftDate: Date.now(),
			delta
		})
		await Draft.deleteMany({ email })
		await draft.save()
		res.sendSuccess({ message: 'Post saved to draft successfully' })
	} catch (error) {
		console.error('Error in saveToDraft:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getDraft = async (req, res) => {
	const { email } = req.query
	if (!email) {
		return res.sendError(400, 'email is required')
	}
	try {
		const draft = await Draft.findOne({ email })
		res.sendSuccess({ message: 'Post saved to draft successfully', draft })
	} catch (error) {
		console.error('Error in getDraft:', error)
		res.sendError(500, 'Internal server error')
	}
}

const publishScheduledPost = async (req, res) => {
	const { email, title, coverUrl, content, introduction, delta, publishDate } = req.body
	if (!email || !title || !coverUrl || !content || !introduction || !delta) {
		return res.sendError(
			400,
			'email, title or coverUrl or content or introduction or delta is required'
		)
	}
	try {
		const user = await User.findOne({ email })
		const commitUser = {
			email: user.email,
			nickname: user.nickname,
			live: user.live,
			avatar: user.avatar,
			introduction: user.introduction
		}
		const scheduledPost = {
			email,
			title,
			coverUrl,
			content,
			introduction,
			delta,
			publishDate,
			user: commitUser
		}
		const post = new ScheduledPost(scheduledPost)
		await post.save()
		res.sendSuccess({ message: 'Post published successfully', postId: post.postId })
	} catch (error) {
		console.error('Error in publishScheduledPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const publishScheduledPosts = async () => {
	try {
		const now = new Date()
		const schedulePosts = await ScheduledPost.find({
			publishDate: { $lte: now }
		})
		for (const post of schedulePosts) {
			try {
				const req = {
					body: {
						email: post.user.email,
						title: post.title,
						coverUrl: post.coverUrl,
						content: post.content,
						introduction: post.introduction,
						delta: post.delta,
						area: post.area,
						user: post.user,
						type: 'scheduled'
					}
				}
				const res = {
					sendSuccess: data => {
						console.log('Post published successfully:', data)
					},
					sendError: (status, message) => {
						console.error(`Error publishing post: ${status} - ${message}`)
					}
				}
				await publishPost(req, res)
				await ScheduledPost.findByIdAndDelete(post._id)
			} catch (error) {
				console.error('Error in publishScheduledPosts:', error)
			}
		}
	} catch (error) {
		console.error('Error in publishScheduledPosts:', error)
	}
}

schedule.scheduleJob('* * * * *', publishScheduledPosts)

module.exports = {
	uploadCover,
	publishPost,
	saveToDraft,
	getDraft,
	publishScheduledPost
}
