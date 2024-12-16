const mongoose = require('mongoose')
const Schema = mongoose.Schema

// chatLimit 0 全部人可私信，1 好友可私信，2 关注和好友可私信，3 关注、粉丝和好友可私信，4 都不可私信
// circleLimit 0 全部可见，3 三天可见，7 一周可见，30 一个月可见，180 半年可见，360 一年可见
// postLimit 0 全部可见，1 尽自己可见，3 三天可见，7 一周可见，30 一个月可见，180 半年可见，360 一年可见
const settingSchema = new Schema({
	email: String,
	showIp: { type: Boolean, default: true },
	showFan: { type: Boolean, default: true },
	showFollow: { type: Boolean, default: true },
	showFriend: { type: Boolean, default: true },
	showPraise: { type: Boolean, default: true },
	showLive: { type: Boolean, default: true },
	showCollect: { type: Boolean, default: true },
	showShare: { type: Boolean, default: true },
	chatLimit: { type: Number, default: 0 },
	circleLimit: { type: Number, default: 0 },
	postLimit: { type: Number, default: 0 }
})

const Setting = mongoose.model('Setting', settingSchema)

module.exports = Setting
