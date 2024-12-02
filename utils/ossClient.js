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

		this.headers = {
			'x-oss-storage-class': 'Standard',
			'x-oss-object-acl': 'private',
			'Content-Disposition': 'attachment; filename="example.txt"',
			'x-oss-tagging': 'Tag1=1&Tag2=2',
			'x-oss-forbid-overwrite': 'true'
		}
	}

	async uploadFile(ossPath, localPath) {
		try {
			const result = await this.client.put(ossPath, path.normalize(localPath), {
				headers: this.headers
			})
			console.log(result)
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
