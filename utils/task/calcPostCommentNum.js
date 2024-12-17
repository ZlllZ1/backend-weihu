const { Post } = require('../../mongodb/post.js')
const Comment = require('../../mongodb/comment.js')

const syncCommentCount = async () => {
	try {
		const batchSize = 1000
		let totalUpdated = 0
		let totalProcessed = 0
		const cursor = Post.aggregate([
			{
				$lookup: {
					from: 'comments',
					localField: 'postId',
					foreignField: 'postId',
					as: 'comments'
				}
			},
			{
				$project: {
					postId: 1,
					commentNum: { $size: '$comments' }
				}
			}
		]).cursor({ batchSize })
		let batch = []
		for await (const post of cursor) {
			batch.push({
				updateOne: {
					filter: { postId: post.postId },
					update: { $set: { commentNum: post.commentNum } }
				}
			})
			if (batch.length === batchSize) {
				try {
					const result = await Post.bulkWrite(batch)
					totalUpdated += result.modifiedCount
					totalProcessed += batch.length
				} catch (error) {
					console.error('批量更新时出错:', error)
				}
				batch = []
			}
		}
		if (batch.length > 0) {
			try {
				const result = await Post.bulkWrite(batch)
				totalUpdated += result.modifiedCount
				totalProcessed += batch.length
			} catch (error) {
				console.error('最后一批更新时出错:', error)
			}
		}
	} catch (error) {
		console.error('同步帖子评论数量时出错:', error)
	}
}

module.exports = syncCommentCount
