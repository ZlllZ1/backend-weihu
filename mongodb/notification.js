const mongoose = require('mongoose')
const Schema = mongoose.Schema

const notificationSchema = new Schema({
	userId: String,
	unreadPraise: Array,
	unreadComment: Array,
	unreadFollow: Array,
	unreadMessage: Array
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
