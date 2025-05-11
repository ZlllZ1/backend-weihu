const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tempUploadSchema = new Schema({
	email: String,
	ossPath: String,
	url: String,
	createdAt: { type: Date, default: Date.now }
})

// 用户查看上传记录
tempUploadSchema.index({ email: 1, createdAt: -1 })

// 清理过期文件
tempUploadSchema.index({ createdAt: 1 })

const TempUpload = mongoose.model('TempUpload', tempUploadSchema)

module.exports = TempUpload
