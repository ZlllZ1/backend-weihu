const { Post, createPost } = require('../mongodb/post.js')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const schedule = require('node-schedule')
const User = require('../mongodb/user.js')
const Draft = require('../mongodb/draft.js')
const ScheduledPost = require('../mongodb/scheduledPost.js')
const Praise = require('../mongodb/praise.js')
const Collect = require('../mongodb/collect.js')

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

const getHotPosts = async (email, skip = 0, limit = 10) => {
	const posts = await Post.aggregate([
		{ $skip: skip },
		{ $limit: limit },
		{ $sort: { rate: -1 } },
		{
			$project: {
				_id: 0,
				postId: 1,
				introduction: 1,
				title: 1,
				coverUrl: 1,
				praiseNum: 1,
				collectNum: 1,
				commentNum: 1,
				lookNum: 1,
				publishDate: 1,
				email: 1
			}
		}
	])
	const praise = await Promise.all(
		posts.map(async post => {
			const praise = await Praise.findOne({ email, postId: post.postId })
			return praise ? true : false
		})
	)
	const collect = await Promise.all(
		posts.map(async post => {
			const collect = await Collect.findOne({ email, postId: post.postId })
			return collect ? true : false
		})
	)
	const user = await Promise.all(
		posts.map(async post => {
			const user = await User.aggregate([
				{ $match: { email: post.email } },
				{ $project: { _id: 0, email: 1, nickname: 1, avatar: 1 } }
			])
			return user
		})
	)
	const res = posts.map((post, index) => {
		return {
			...post,
			praise: praise[index],
			collect: collect[index],
			user: user[index][0]
		}
	})
	return res
}

const getPosts = async (req, res) => {
	const { email } = req.query
	const skip = parseInt((req.query.page - 1) * req.query.limit)
	const limit = parseInt(req.query.limit)
	if (!email) {
		return res.sendError(400, 'email is required')
	}
	try {
		const posts = await getHotPosts(email, skip, limit)
		const total = await Post.countDocuments()
		res.sendSuccess({ message: 'Posts fetched successfully', posts, total })
	} catch (error) {
		console.error('Error in getPosts:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getPostInfo = async (req, res) => {
	const { postId } = req.query
	if (!postId) {
		return res.sendError(400, 'postId is required')
	}
	try {
		const post = await Post.findOne({ postId })
		if (!post) {
			return res.sendError(404, 'Post not found')
		}
		const user = await User.findOne({ email: post.email })
		res.sendSuccess({
			message: 'Post fetched successfully',
			post,
			user: {
				email: user.email,
				nickname: user.nickname,
				live: user.live,
				avatar: user.avatar,
				introduction: user.introduction
			}
		})
	} catch (error) {
		console.error('Error in getPostInfo:', error)
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

const praisePost = async (req, res) => {
	const { email, postId } = req.body
	if (!email || !postId) {
		return res.sendError(400, 'email or postId is required')
	}
	try {
		const praise = await Praise.findOne({ email, postId })
		const post = await Post.findOne({ postId })
		if (praise) {
			await Praise.deleteOne({ email, postId })
			post.praiseNum--
			await post.save()
			return res.sendSuccess({ message: 'Praise canceled successfully' })
		} else {
			const praise = new Praise({
				email,
				postId,
				praiseDate: Date.now()
			})
			post.praiseNum++
			await praise.save()
			await post.save()
			return res.sendSuccess({ message: 'Praise successfully' })
		}
	} catch (error) {
		console.error('Error in praisePost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const collectPost = async (req, res) => {
	const { email, postId } = req.body
	if (!email || !postId) {
		return res.sendError(400, 'email or postId is required')
	}
	try {
		const collect = await Collect.findOne({ email, postId })
		const post = await Post.findOne({ postId })
		if (collect) {
			await Collect.deleteOne({ email, postId })
			post.collectNum--
			await post.save()
			return res.sendSuccess({ message: 'Collect canceled successfully' })
		} else {
			const collect = new Collect({
				email,
				postId,
				praiseDate: Date.now()
			})
			post.collectNum++
			await collect.save()
			await post.save()
			return res.sendSuccess({ message: 'Collect successfully' })
		}
	} catch (error) {
		console.error('Error in collectPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	uploadCover,
	publishPost,
	saveToDraft,
	getDraft,
	publishScheduledPost,
	getPosts,
	praisePost,
	collectPost,
	getPostInfo
}
