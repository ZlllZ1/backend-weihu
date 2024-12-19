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
const { v4: uuidv4 } = require('uuid')
const TempUpload = require('../mongodb/tempUpload.js')

const uploadCover = async (req, res) => {
	const { account } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const uniqueId = uuidv4()
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `cover/${uniqueId}${fileExt}`
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		fs.unlinkSync(req.file.path)
		await TempUpload.create({
			email,
			ossPath,
			url: result.url,
			createdAt: new Date()
		})
		res.sendSuccess({ message: 'Cover upload successfully', coverUrl: result.url })
	} catch (error) {
		console.error('Error in uploadCover:', error)
		res.sendError(500, 'Internal server error')
	}
}

const extractImageUrls = content => {
	const htmlImgRegex = /<img[^>]+src="?([^"\s]+)"?\s*\/?>/g
	const markdownImgRegex = /!\[.*?\]\((.*?)\)/g
	const urlRegex = /(https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp))/g
	const urls = new Set()
	let match
	while ((match = htmlImgRegex.exec(content)) !== null) urls.add(match[1])
	while ((match = markdownImgRegex.exec(content)) !== null) urls.add(match[1])
	while ((match = urlRegex.exec(content)) !== null) urls.add(match[1])
	return Array.from(urls)
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
		const contentImageUrls = extractImageUrls(content)
		const allImageUrls = [coverUrl, ...contentImageUrls]
		await confirmPostImages(email, allImageUrls)
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
				email: 1,
				show: 1
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
			query = { show: true }
		switch (type) {
			case 'recommend':
				posts = await getHotPosts(email, skip, limit)
				posts = posts.filter(p => p.show)
				total = await Post.countDocuments({ show: true })
				break
			case 'follow':
				const follows = await Fan.find({ fanEmail: email }).lean()
				const followedEmails = follows.map(f => f.followedEmail)
				query = { ...query, email: { $in: followedEmails } }
				break
			case 'friend':
				const friends = await Friend.find({ $or: [{ email1: email }, { email2: email }] })
				const friendEmails = friends.map(f => (f.email1 === email ? f.email2 : f.email1))
				query = { ...query, email: { $in: friendEmails } }
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

const clearDraft = async (req, res) => {
	const { email } = req.body
	if (!email) return res.sendError(400, 'email is required')
	try {
		await Draft.deleteMany({ email })
		res.sendSuccess({ message: 'Posts cleared from draft successfully' })
	} catch (error) {
		console.error('Error in clearDraft:', error)
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
		} else query.email = email
		if (!userEmail) query.$or = [{ email: email }, { show: true }]
		else query.show = true
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
		const newComment = new Comment({
			postEmail,
			postId,
			content,
			parentId,
			parentEmail,
			commentDate: Date.now(),
			user: { email: email },
			parentUser: { email: parentEmail },
			commentNum: 0,
			rate: 0
		})
		post.commentNum = post.commentNum + 1
		await post.save()
		if (parentId) {
			const parentComment = await Comment.findOne({ _id: parentId })
			parentComment.commentNum = parentComment.commentNum + 1
			parentComment.rate = parentComment.rate + 2
			await parentComment.save()
		}
		await newComment.save()
		const updatedComments = await Comment.find({ postId }).lean()
		const organizedComments = organizeCommentsAfterNew(updatedComments, newComment._id)
		res.sendSuccess({ message: 'Comment successfully', comments: organizedComments })
	} catch (error) {
		console.error('Error in comment:', error)
		res.sendError(500, 'Internal server error')
	}
}

const organizeCommentsAfterNew = (comments, newCommentId) => {
	const newComment = comments.find(c => c._id.toString() === newCommentId.toString())
	const otherComments = comments.filter(c => c._id.toString() !== newCommentId.toString())
	const rootComments = otherComments.filter(c => !c.parentId)
	const childComments = otherComments.filter(c => c.parentId)
	const repliesMap = new Map()
	childComments.forEach(comment => {
		const rootParentId = findRootParentId(comment, otherComments)
		if (!repliesMap.has(rootParentId)) repliesMap.set(rootParentId, [])
		repliesMap.get(rootParentId).push(comment)
	})
	function findRootParentId(comment, allComments) {
		if (!comment.parentId) return comment._id.toString()
		const parent = allComments.find(c => c._id.toString() === comment.parentId)
		return parent ? findRootParentId(parent, allComments) : comment.parentId
	}
	if (newComment) {
		const rootParentId = findRootParentId(newComment, otherComments)
		if (rootParentId !== newComment._id.toString()) {
			if (!repliesMap.has(rootParentId)) repliesMap.set(rootParentId, [])
			repliesMap.get(rootParentId).unshift(newComment)
		} else rootComments.unshift(newComment)
	}
	rootComments.forEach(comment => {
		comment.replies = (repliesMap.get(comment._id.toString()) || []).sort((a, b) => {
			if (a.rate !== b.rate) return b.rate > a.rate
			return b.commentDate >= a.commentDate
		})
	})
	return rootComments
}

const getComments = async (req, res) => {
	const { postId, email } = req.query
	if (!postId || !email) return res.sendError(400, 'postId and email is required')
	const limit = parseInt(req.query.limit) || 10
	const page = parseInt(req.query.page) || 1
	const skip = limit * (page - 1)
	try {
		const comments = await Comment.find({ postId }).lean()
		const organizedComments = organizeComments(comments)
		const paginatedComments = organizedComments.slice(skip, skip + limit)
		const allCommentIds = comments.map(comment => comment._id.toString())
		const userPraises = await PraiseComment.find({
			commentId: { $in: allCommentIds },
			email: email
		}).lean()
		const userPraiseSet = new Set(userPraises.map(praise => praise.commentId.toString()))
		const addPraiseInfo = comment => {
			comment.isPraise = userPraiseSet.has(comment._id.toString())
			if (comment.replies) comment.replies.forEach(addPraiseInfo)
			return comment
		}
		const commentsWithPraise = paginatedComments.map(addPraiseInfo)
		res.sendSuccess({
			comments: commentsWithPraise,
			total: organizedComments.length,
			currentPage: page,
			totalPages: Math.ceil(organizedComments.length / limit)
		})
	} catch (error) {
		console.error('Error in getComments:', error)
		res.sendError(500, 'Internal server error')
	}
}

const organizeComments = comments => {
	const rootComments = comments.filter(c => !c.parentId)
	const childComments = comments.filter(c => c.parentId)
	rootComments.sort((a, b) => b.rate - a.rate || b.commentDate - a.commentDate)
	const repliesMap = new Map()
	childComments.forEach(comment => {
		let parentId = comment.parentId
		while (parentId) {
			const parent = comments.find(c => c._id.toString() === parentId)
			if (!parent?.parentId) {
				if (!repliesMap.has(parentId)) repliesMap.set(parentId, [])
				repliesMap.get(parentId).push(comment)
				break
			}
			parentId = parent.parentId
		}
	})
	rootComments.forEach(comment => {
		const replies = repliesMap.get(comment._id.toString()) || []
		replies.sort((a, b) => b.rate - a.rate || b.commentDate - a.commentDate)
		comment.replies = replies
	})
	return rootComments
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

const deletePost = async (req, res) => {
	const { postId, email } = req.body
	if (!postId || !email) return res.sendError(400, 'postId or email is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		if (post.email !== email) return res.sendError(403, 'You are not the author of this post')
		await User.findOneAndUpdate({ email }, { $inc: { postNum: -1 } })
		await Post.findOneAndDelete({ postId })
		await Comment.deleteMany({ postId })
		await PraiseComment.deleteMany({ postId })
		await Praise.deleteMany({ postId })
		await Collect.deleteMany({ postId })
		res.sendSuccess({ message: 'Post deleted successfully' })
	} catch (error) {
		console.error('Error in deletePost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const hidePost = async (req, res) => {
	const { postId, email } = req.body
	if (!postId || !email) return res.sendError(400, 'postId or email is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		if (post.email !== email) return res.sendError(403, 'You are not the author of this post')
		post.show = false
		await post.save()
		res.sendSuccess({ message: 'Post hidden successfully' })
	} catch (error) {
		console.error('Error in hidePost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const showPost = async (req, res) => {
	const { postId, email } = req.body
	if (!postId || !email) return res.sendError(400, 'postId or email is required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		if (post.email !== email) return res.sendError(403, 'You are not the author of this post')
		post.show = true
		await post.save()
		res.sendSuccess({ message: 'Post hidden successfully' })
	} catch (error) {
		console.error('Error in hidePost:', error)
		res.sendError(500, 'Internal server error')
	}
}

const deleteComment = async (req, res) => {
	const { postId, commentId, email } = req.body
	if (!postId || !commentId || !email)
		return res.sendError(400, 'postId, commentId and email are required')
	try {
		const post = await Post.findOne({ postId })
		if (!post) return res.sendError(404, 'Post not found')
		const comment = await Comment.findOne({ _id: commentId, postId })
		if (!comment) return res.sendError(404, 'Comment not found')
		if (post.email !== email && comment.user.email !== email)
			return res.sendError(403, 'You are not authorized to delete this comment')
		const commentsToDelete = await getCommentsToDelete(postId, commentId)
		const deleteResult = await Comment.deleteMany({ _id: { $in: commentsToDelete } })
		const deleteNum = deleteResult.deletedCount
		await Post.findOneAndUpdate(
			{ postId },
			{ $inc: { commentNum: -deleteNum, rate: -2 * deleteNum } }
		)
		res.sendSuccess({ message: 'Comment deleted successfully', deleteNum })
	} catch (error) {
		console.error('Error in deleteComment:', error)
		res.sendError(500, 'Internal server error')
	}
}
const getCommentsToDelete = async (postId, commentId) => {
	const commentsToDelete = [commentId]
	let childComments = await Comment.find({ postId, parentId: commentId })
	for (let childComment of childComments) {
		commentsToDelete.push(childComment._id)
		const grandChildComments = await getCommentsToDelete(postId, childComment._id)
		commentsToDelete.push(...grandChildComments)
	}
	return commentsToDelete
}

const confirmPostImages = async (email, usedImageUrls) => {
	try {
		const tempUploads = await TempUpload.find({ email })
		for (const upload of tempUploads) {
			if (usedImageUrls.includes(upload.url)) await TempUpload.deleteOne({ _id: upload._id })
			else {
				await OssClient.deleteFile(upload.ossPath)
				await TempUpload.deleteOne({ _id: upload._id })
			}
		}
	} catch (error) {
		console.error('Error in confirmPostImages:', error)
	}
}

const uploadPostImg = async (req, res) => {
	const { email } = req
	if (!email) return res.sendError(400, 'email is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const uniqueId = uuidv4()
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `post/${uniqueId}${fileExt}`
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		fs.unlinkSync(req.file.path)
		await TempUpload.create({
			email,
			ossPath,
			url: result.url,
			createdAt: new Date()
		})
		res.sendSuccess({ message: 'postImg upload successfully', postImgUrl: result.url })
	} catch (error) {
		console.error('Error in uploadPostImg:', error)
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
	praiseComment,
	clearDraft,
	deletePost,
	hidePost,
	showPost,
	deleteComment,
	uploadPostImg
}
