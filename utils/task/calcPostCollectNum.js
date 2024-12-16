const { Post } = require('../../mongodb/post.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	try {
		const batchSize = 1000
		let lastPostId = null
		let totalUpdated = 0
		let totalProcessed = 0
		while (true) {
			const posts = await Post.find(lastPostId ? { _id: { $gt: lastPostId } } : {})
				.select('postId collectNum')
				.sort({ _id: 1 })
				.limit(batchSize)
				.lean()
			if (posts.length === 0) break
			const postIds = posts.map(p => p.postId.toString())
			const collectCounts = await Collect.aggregate([
				{ $match: { postId: { $in: postIds } } },
				{ $group: { _id: '$postId', count: { $sum: 1 } } }
			])
			const collectCountMap = new Map(collectCounts.map(({ _id, count }) => [_id, count]))
			const bulkOps = posts
				.map(post => {
					const newCollectNum = collectCountMap.get(post.postId.toString()) || 0
					if (newCollectNum !== post.collectNum) {
						return {
							updateOne: {
								filter: { postId: post.postId },
								update: { $set: { collectNum: newCollectNum } }
							}
						}
					}
					return null
				})
				.filter(op => op !== null)
			if (bulkOps.length > 0) {
				const result = await Post.bulkWrite(bulkOps)
				totalUpdated += result.modifiedCount
			}
			totalProcessed += posts.length
			lastPostId = posts[posts.length - 1]._id
		}
	} catch (error) {
		console.error('同步帖子喜欢数量时出错:', error)
	}
}

module.exports = syncCollectCount
