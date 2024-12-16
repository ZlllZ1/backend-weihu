const { Post } = require('../../mongodb/post.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	try {
		const batchSize = 1000
		let lastPostId = null
		let totalUpdated = 0
		while (true) {
			const postIds = await Post.find(lastPostId ? { _id: { $gt: lastPostId } } : {}, { postId: 1 })
				.sort({ _id: 1 })
				.limit(batchSize)
				.lean()
			if (postIds.length === 0) break
			const collectCounts = await Collect.aggregate([
				{ $match: { postId: { $in: postIds.map(p => p.postId) } } },
				{ $group: { _id: '$postId', count: { $sum: 1 } } }
			])
			const collectCountMap = new Map(collectCounts.map(({ _id, count }) => [_id, count]))
			const bulkOps = postIds.map(({ postId }) => ({
				updateOne: {
					filter: { postId: postId },
					update: { $set: { collectNum: collectCountMap.get(postId) || 0 } }
				}
			}))
			const result = await Post.bulkWrite(bulkOps)
			totalUpdated += result.modifiedCount
			lastPostId = postIds[postIds.length - 1]._id
		}
	} catch (error) {
		console.error('同步帖子收藏数量时出错:', error)
	}
}

module.exports = syncCollectCount
