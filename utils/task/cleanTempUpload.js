const TempUpload = require('../../mongodb/tempUpload.js')
const OssClient = require('../../utils/ossClient.js')
const Draft = require('../../mongodb/draft.js')

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

const cleanTempUpload = async () => {
	try {
		const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
		const expiredUploads = await TempUpload.find({ createdAt: { $lt: expirationTime } })
		const allDrafts = await Draft.find({})
		const draftImageUrls = new Set()
		allDrafts.forEach(draft => {
			const urls = extractImageUrls(draft.content)
			urls.forEach(url => draftImageUrls.add(url))
		})
		for (const upload of expiredUploads) {
			if (!draftImageUrls.has(upload.url)) {
				await OssClient.deleteFile(upload.ossPath)
				await TempUpload.deleteOne({ _id: upload._id })
			}
		}
	} catch (error) {
		console.error('Error in cleanTempUpload:', error)
	}
}

module.exports = cleanTempUpload
