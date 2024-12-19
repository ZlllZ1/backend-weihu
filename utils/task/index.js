const schedule = require('node-schedule')

const cleanAuthCode = require('./cleanAuthCode')
const calcFriendNum = require('./calcFriendNum')
const calcFanNum = require('./calcFanNum')
const calcFollowNum = require('./calcFollowNum')
const calcPostNum = require('./calcPostNum')
const calcPraiseNum = require('./calcPraiseNum')
const calcCollectNum = require('./calcCollectNum')
const calcCircleNum = require('./calcCircleNum')
const calcRate = require('./calcRate')
const calcPostPraiseNum = require('./calcPostPraiseNum')
const calcPostCollectNum = require('./calcPostCollectNum')
const calcPostCommentNum = require('./calcPostCommentNum')
const calcCirclePraiseNum = require('./calcCirclePraiseNum')
const calcCircleCommentNum = require('./calcCircleCommentNum')
const cleanTempUpload = require('./cleanTempUpload')

const scheduleTasks = () => {
	const cronSchedule = '0 0 * * *'
	schedule.scheduleJob(cronSchedule, cleanAuthCode)
	schedule.scheduleJob(cronSchedule, calcFriendNum)
	schedule.scheduleJob(cronSchedule, calcFanNum)
	schedule.scheduleJob(cronSchedule, calcFollowNum)
	schedule.scheduleJob(cronSchedule, calcPostNum)
	schedule.scheduleJob(cronSchedule, calcPraiseNum)
	schedule.scheduleJob(cronSchedule, calcCollectNum)
	schedule.scheduleJob(cronSchedule, calcCircleNum)
	schedule.scheduleJob(cronSchedule, calcPostPraiseNum)
	schedule.scheduleJob(cronSchedule, calcPostCollectNum)
	schedule.scheduleJob(cronSchedule, calcPostCommentNum)
	schedule.scheduleJob(cronSchedule, calcRate)
	schedule.scheduleJob(cronSchedule, calcCirclePraiseNum)
	schedule.scheduleJob(cronSchedule, calcCircleCommentNum)
	schedule.scheduleJob(cronSchedule, cleanTempUpload)
}

module.exports = scheduleTasks
