const { Post } = require('../../mongodb/post.js')
const Comment = require('../../mongodb/comment.js')

const syncCommentCount = async () => {
	try {
		const commentCounts = await Comment.aggregate([
			{
				$group: {
					_id: '$postId',
					count: { $sum: 1 }
				}
			}
		])
		for (const { _id: postId, count } of commentCounts) {
			await Post.updateOne({ postId: postId }, { $set: { commentNum: count } })
		}
	} catch (error) {
		console.error('同步帖子评论数量时出错:', error)
	}
}

module.exports = syncCommentCount
