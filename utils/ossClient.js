const OSS = require('ali-oss')
const path = require('path')

class OssClient {
	constructor() {
		this.client = new OSS({
			accessKeyId: process.env.OSS_ACCESS_KEY_ID,
			accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
			region: process.env.OSS_REGION,
			authorizationV4: true,
			bucket: process.env.OSS_BUCKET
		})

		this.defaultHeaders = {
			'x-oss-storage-class': 'Standard',
			'x-oss-object-acl': 'public-read',
			'Content-Disposition': 'attachment; filename="example.txt"',
			'x-oss-tagging': 'Tag1=1&Tag2=2'
		}
	}

	async uploadFile(ossPath, localPath, options = {}) {
		try {
			const headers = { ...this.defaultHeaders, ...options.headers }
			const ext = path.extname(localPath).toLowerCase()
			if (['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm'].includes(ext)) {
				delete headers['Content-Disposition']
			} else {
				headers['Content-Disposition'] = `attachment; filename="${path.basename(localPath)}"`
			}
			try {
				await this.client.head(ossPath)
				headers['x-oss-forbid-overwrite'] = 'false'
			} catch (err) {
				if (err.code !== 'NoSuchKey') {
					throw err
				}
			}
			const result = await this.client.put(ossPath, path.normalize(localPath), {
				headers: headers
			})
			return result
		} catch (error) {
			console.error('上传文件失败', error)
			throw error
		}
	}

	async deleteFile(ossPath) {
		try {
			const result = await this.client.delete(ossPath)
			return result
		} catch (error) {
			console.error('删除文件失败', error)
			throw error
		}
	}
}

module.exports = new OssClient()
