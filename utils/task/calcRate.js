const { Post } = require('../../mongodb/post.js')

const syncCalcRate = async () => {
	try {
		const posts = await Post.find({})
		for (const post of posts) {
			post.rate =
				post.praiseNum * 5 +
				post.commentNum * 2 +
				post.collectNum * 10 +
				post.lookNum +
				post.shareNum * 5
			await post.save()
		}
		const sortedPosts = await Post.find({}).sort({ rate: -1 })
		for (let i = 0; i < sortedPosts.length; i++) {
			sortedPosts[i].sortOrder = i + 1
			await sortedPosts[i].save()
		}
	} catch (error) {
		console.error('Error in updateRate:', error)
	}
}

module.exports = syncCalcRate
