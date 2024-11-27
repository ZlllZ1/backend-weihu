const nodemailer = require('nodemailer')

const EMAIL_PROVIDERS = {
	QQ: '@qq.com',
	NETEASE: '@163.com'
}
const SENDER_EMAILS = {
	[EMAIL_PROVIDERS.QQ]: '2060909362@qq.com',
	[EMAIL_PROVIDERS.NETEASE]: '15292021323@163.com'
}
const generateEmailCode = () => {
	return Array(6)
		.fill(0)
		.map(() => Math.floor(Math.random() * 10))
		.join('')
}
const createEmailContent = (account, emailCode, providerName) => {
	const title = `微乎---${providerName}邮箱验证码`
	const body = `
    <p><strong>您好：</strong></p>
    <p style="font-size: 16px;color:#000;">
			您正在进行微乎账号登录操作,请使用下方6位验证码,验证身份并完成注册/登录:
    </p>
		<p style="font-size: 28px;color:#1172F6;margin: 20px 0 0 20px;text-align: center;"> ${emailCode}</p>
    <p>验证码告知他人将会导致数据信息被盗，请勿泄露</p>
    <p style="font-size: 12px;color:#999;">过期时间 ${new Date(Date.now() + 60 * 1000 * 3)}</p>
  `
	return {
		from: SENDER_EMAILS[providerName],
		to: account,
		subject: title,
		html: body
	}
}

const transporter163 = nodemailer.createTransport({
	host: 'smtp.163.com',
	port: 465,
	secure: true,
	auth: {
		user: '15292021323@163.com',
		pass: 'TGP7LxJTDA5Vr7KY'
	}
})

const transporterQQ = nodemailer.createTransport({
	host: 'smtp.qq.com',
	port: 465,
	secure: true,
	auth: {
		user: '2060909362@qq.com',
		pass: 'avzqbwhhbxtrcjgh'
	}
})

const send163 = mailOptions => {
	transporter163.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error)
		}
	})
}

const sendQQ = mailOptions => {
	transporterQQ.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error)
		}
	})
}

module.exports = {
	EMAIL_PROVIDERS,
	generateEmailCode,
	createEmailContent,
	send163,
	sendQQ
}
