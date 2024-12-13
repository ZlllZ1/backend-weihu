const { Post, createPost } = require('../mongodb/post.js')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const path = require('path')
const schedule = require('node-schedule')
const User = require('../mongodb/user.js')
const Draft = require('../mongodb/draft.js')
const ScheduledPost = require('../mongodb/scheduledPost.js')
const Praise = require('../mongodb/praise.js')
const Collect = require('../mongodb/collect.js')
const { Fan, Friend } = require('../mongodb/fan.js')
const Comment = require('../mongodb/comment.js')
const PraiseComment = require('../mongodb/praiseComment.js')

const uploadCover = async (req, res) => {
	const { account } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `cover/${user._id}${fileExt}`
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
	if (!email || !title || !coverUrl || !content || !introduction || !delta)
		return res.sendError(
			400,
			'email, title or coverUrl or content or introduction or delta is required'
		)
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
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
			publishDate: Date.now(),
			user: commitUser
		}
		if (type === 'draft') await Draft.deleteMany({ email })
		const post = await createPost(postData)
		const updatedUser = await User.findOneAndUpdate(
			{ email },
			{ $inc: { postNum: 1 } },
			{ new: true }
		)
		if (!updatedUser) {
			await Post.deleteOne({ email })
			return res.sendError(409, 'User data has been modified')
		}
		res.sendSuccess({ message: 'Post published successfully', postId: post.postId })
	} catch (error) {
		console.error('Error in publishPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getHotPosts = async (email, skip = 0, limit = 10) => {
	const posts = await Post.aggregate([
		{ $sort: { rate: -1, publishDate: -1 } },
		{ $skip: skip },
		{ $limit: limit },
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
	const res = await Promise.all(
		posts.map(async post => {
			const [praise, collect, user, isFollowing] = await Promise.all([
				Praise.findOne({ email, postId: post.postId }).lean(),
				Collect.findOne({ email, postId: post.postId }).lean(),
				User.findOne({ email: post.email }, { _id: 0, email: 1, nickname: 1, avatar: 1 }).lean(),
				Fan.findOne({ fanEmail: email, followedEmail: post.email }).lean()
			])
			return {
				...post,
				praise: !!praise,
				collect: !!collect,
				user: {
					...user,
					isFollowing: !!isFollowing
				}
			}
		})
	)
	return res
}

const getPosts = async (req, res) => {
	const { email, type } = req.query
	const limit = parseInt(req.query.limit)
	const page = parseInt(req.query.page)
	const skip = (page - 1) * limit
	if (!email) return res.sendError(400, 'email is required')
	try {
		let posts,
			total,
			query = {}
		switch (type) {
			case 'recommend':
				posts = await getHotPosts(email, skip, limit)
				total = await Post.countDocuments()
				break
			case 'follow':
				const follows = await Fan.find({ fanEmail: email }).lean()
				const followedEmails = follows.map(f => f.followedEmail)
				query = { email: { $in: followedEmails } }
				break
			case 'friend':
				const friends = await Friend.find({ $or: [{ email1: email }, { email2: email }] })
				const friendEmails = friends.map(f => (f.email1 === email ? f.email2 : f.email1))
				query = { email: { $in: friendEmails } }
				break
			default:
				return res.sendError(400, 'Invalid type')
		}
		if (type !== 'recommend') {
			posts = await Post.find(query)
				.sort({ publishDate: -1, rate: -1 })
				.skip(skip)
				.limit(limit)
				.lean()
			total = await Post.countDocuments(query)
		}
		const postIds = posts.map(post => post.postId)
		const [praises, collects] = await Promise.all([
			Praise.find({ email, postId: { $in: postIds } }).lean(),
			Collect.find({ email, postId: { $in: postIds } }).lean()
		])
		const praiseSet = new Set(praises.map(p => p.postId.toString()))
		const collectSet = new Set(collects.map(c => c.postId.toString()))
		const postsWithStatus = posts.map(post => ({
			...post,
			praise: praiseSet.has(post.postId.toString()),
			collect: collectSet.has(post.postId.toString())
		}))
		res.sendSuccess({ message: 'Posts fetched successfully', posts: postsWithStatus, total })
	} catch (error) {
		console.error('Error in getPosts:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getPostInfo = async (req, res) => {
	const { postId, email } = req.query
	if (!postId || !email) return res.sendError(400, 'postId or email is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		const user = await User.findOne({ email: post.email })
		post.lookNum += 1
		await post.save()
		let isFollowing = false
		const fanRelation = await Fan.findOne({ fanEmail: email, followedEmail: user.email })
		isFollowing = !!fanRelation
		const isPraise = await Praise.exists({ email, postId })
		const isCollect = await Collect.exists({ email, postId })
		res.sendSuccess({
			message: 'Post fetched successfully',
			post: {
				...post.toObject(),
				isPraise: !!isPraise,
				isCollect: !!isCollect
			},
			user: {
				email: user.email,
				nickname: user.nickname,
				live: user.live,
				avatar: user.avatar,
				introduction: user.introduction,
				isFollowing
			}
		})
	} catch (error) {
		console.error('Error in getPostInfo:', error)
		res.sendError(500, 'Internal server error')
	}
}

const saveToDraft = async (req, res) => {
	const { email, title, coverUrl, content, introduction, delta } = req.body
	if (!email) return res.sendError(400, 'email is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
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
	if (!email) return res.sendError(400, 'email is required')
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
	if (!email || !title || !coverUrl || !content || !introduction || !delta)
		return res.sendError(
			400,
			'email, title or coverUrl or content or introduction or delta is required'
		)
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
	if (!email || !postId) return res.sendError(400, 'email or postId is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const praise = await Praise.findOne({ email, postId })
		if (praise) {
			await Promise.all([
				Praise.deleteOne({ email, postId }),
				Post.updateOne({ postId: post.postId }, { $inc: { praiseNum: -1 } }),
				User.updateOne({ email: user.email }, { $inc: { praiseNum: -1 } })
			])
			return res.sendSuccess({ message: 'Praise canceled successfully' })
		} else {
			const newPraise = new Praise({
				email,
				postId,
				praiseDate: Date.now()
			})
			await Promise.all([
				newPraise.save(),
				Post.updateOne({ postId: post.postId }, { $inc: { praiseNum: 1 } }),
				User.updateOne({ email: user.email }, { $inc: { praiseNum: 1 } })
			])
			return res.sendSuccess({ message: 'Praise successfully' })
		}
	} catch (error) {
		console.error('Error in praisePost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const collectPost = async (req, res) => {
	const { email, postId } = req.body
	if (!email || !postId) return res.sendError(400, 'email or postId is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const collect = await Collect.findOne({ email, postId })
		if (collect) {
			await Promise.all([
				Collect.deleteOne({ email, postId }),
				Post.updateOne({ postId: post.postId }, { $inc: { collectNum: -1 } }),
				User.updateOne({ email: user.email }, { $inc: { collectNum: -1 } })
			])
			return res.sendSuccess({ message: 'Collect canceled successfully' })
		} else {
			const newCollect = new Collect({
				email,
				postId,
				collectDate: Date.now()
			})
			await Promise.all([
				newCollect.save(),
				Post.updateOne({ postId: post.postId }, { $inc: { collectNum: 1 } }),
				User.updateOne({ email: user.email }, { $inc: { collectNum: 1 } })
			])
			return res.sendSuccess({ message: 'Collect successfully' })
		}
	} catch (error) {
		console.error('Error in collectPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getPublishedPost = async (req, res) => {
	const { email } = req.query
	if (!email) return res.sendError(400, 'email is required')
	try {
		const posts = await Post.find({ email })
		const total = await Post.countDocuments({ email })
		res.sendSuccess({ message: 'Posts fetched successfully', posts, total })
	} catch (error) {
		console.error('Error in getPublishedPost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getOnesPosts = async (req, res) => {
	const { email, type, userEmail } = req.query
	const limit = parseInt(req.query.limit)
	const page = parseInt(req.query.page)
	const skip = limit * (page - 1)
	if (!email) return res.sendError(400, 'email is required')
	try {
		let query = {}
		let postIds = []
		if (type === 'praise') {
			const praises = await Praise.find({ email })
			postIds = praises.map(p => p.postId)
			query.postId = { $in: postIds }
		} else if (type === 'collect') {
			const collects = await Collect.find({ email })
			postIds = collects.map(c => c.postId)
			query.postId = { $in: postIds }
		} else {
			query = { email }
		}
		const [posts, total] = await Promise.all([
			Post.find(query).skip(skip).limit(limit).lean(),
			Post.countDocuments(query)
		])
		postIds = posts.map(post => post.postId)
		const [praises, collects] = await Promise.all([
			Praise.find({ email: userEmail || email, postId: { $in: postIds } }).lean(),
			Collect.find({ email: userEmail || email, postId: { $in: postIds } }).lean()
		])
		const praiseSet = new Set(praises.map(p => p.postId.toString()))
		const collectSet = new Set(collects.map(c => c.postId.toString()))
		const postsWithStatus = posts.map(post => ({
			...post,
			isPraise: praiseSet.has(post.postId.toString()),
			isCollect: collectSet.has(post.postId.toString())
		}))
		res.sendSuccess({ message: 'Posts fetched successfully', posts: postsWithStatus, total, page })
	} catch (error) {
		console.error('Error in getOnesPosts:', error)
		res.sendError(500, 'Internal server error')
	}
}

const updateShareNum = async (req, res) => {
	const { postId } = req.body
	if (!postId) return res.sendError(400, 'postId is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		const shareNum = post.shareNum + 1
		await Post.updateOne({ postId: post.postId }, { $set: { shareNum } })
		return res.sendSuccess({ message: 'Share successfully' })
	} catch (error) {
		console.error('Error in updateShareNum:', error)
		res.sendError(500, 'Internal server error')
	}
}

const comment = async (req, res) => {
	const { email, postId, postEmail, content, parentId, parentEmail } = req.body
	if (!email || !postId || !content)
		return res.sendError(400, 'email or postId or content is required')
	try {
		const post = await Post.findOne({ postId })
		const comment = new Comment({
			postEmail,
			postId,
			content,
			parentId,
			parentEmail,
			commentDate: Date.now(),
			user: { email: email },
			parentUser: { email: parentEmail },
			commentNum: 0
		})
		post.commentNum = post.commentNum + 1
		await post.save()
		if (parentId) {
			const parentComment = await Comment.findOne({ _id: parentId })
			parentComment.commentNum = parentComment.commentNum + 1
			parentComment.rate = parentComment.rate + 2
		}
		await comment.save()
		res.sendSuccess({ message: 'Comment successfully' })
	} catch (error) {
		console.error('Error in comment:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getComments = async (req, res) => {
	const { postId, email } = req.query
	if (!postId || !email) return res.sendError(400, 'postId and email is required')
	const limit = parseInt(req.query.limit) || 10
	const page = parseInt(req.query.page) || 1
	const skip = limit * (page - 1)
	try {
		const parentComments = await Comment.find({ postId, parentId: null })
			.sort({ rate: -1, commentDate: -1 })
			.skip(skip)
			.limit(limit)
			.lean()
		const parentIds = parentComments.map(comment => comment._id.toString())
		const childComments = await Comment.find({ postId, parentId: { $in: parentIds } })
			.sort({ commentDate: -1 })
			.lean()
		const allCommentIds = [...parentIds, ...childComments.map(comment => comment._id.toString())]
		const userPraises = await PraiseComment.find({
			commentId: { $in: allCommentIds },
			email: email
		}).lean()
		const userPraiseSet = new Set(userPraises.map(praise => praise.commentId.toString()))
		const addPraiseInfo = comment => ({
			...comment,
			isPraise: userPraiseSet.has(comment._id.toString())
		})
		const commentsWithReplies = parentComments.map(parent => {
			const children = childComments
				.filter(child => child.parentId.toString() === parent._id.toString())
				.map(addPraiseInfo)
			return addPraiseInfo({ ...parent, replies: children })
		})
		const totalComments = await Comment.countDocuments({ postId, parentId: null })
		res.sendSuccess({
			comments: commentsWithReplies,
			total: totalComments,
			currentPage: page,
			totalPages: Math.ceil(totalComments / limit)
		})
	} catch (error) {
		console.error('Error in getComments:', error)
		res.sendError(500, 'Internal server error')
	}
}

const praiseComment = async (req, res) => {
	const { email, commentId } = req.body
	if (!email || !commentId) return res.sendError(400, 'email or commentId is required')
	try {
		const comment = await Comment.findOne({ _id: commentId })
		if (!comment) return res.sendError(404, 'Comment not found')
		const praise = await PraiseComment.findOne({ email, commentId })
		if (praise) {
			await PraiseComment.findOneAndDelete({ email, commentId })
			await Comment.findByIdAndUpdate(commentId, { $inc: { praiseNum: -1 }, $inc: { rate: -5 } })
			res.sendSuccess({ message: 'Praise cancelled successfully' })
		} else {
			const newPraise = new PraiseComment({
				email,
				commentId,
				praiseDate: Date.now()
			})
			await newPraise.save()
			await Comment.findByIdAndUpdate(commentId, { $inc: { praiseNum: 1 }, $inc: { rate: 5 } })
			res.sendSuccess({ message: 'Praised successfully' })
		}
	} catch (error) {
		console.error('Error in praiseComment:', error)
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
	getPostInfo,
	getPublishedPost,
	getOnesPosts,
	updateShareNum,
	comment,
	getComments,
	praiseComment
}
