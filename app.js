require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDb } = require('./mongodb/index.js')
const verifyToken = require('./utils/verifyToken.js')
const apiResponseMiddleware = require('./utils/apiResponseMiddleware.js')
const userRouter = require('./router/user')
const loginRouter = require('./router/login')
const settingRouter = require('./router/setting')
const postRouter = require('./router/post')
const otherRouter = require('./router/other')

const app = express()

app.set('trust proxy', true)
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(apiResponseMiddleware)

app.use('/login', loginRouter)
app.use('/user', verifyToken, userRouter)
app.use('/setting', verifyToken, settingRouter)
app.use('/post', verifyToken, postRouter)
app.use('/other', otherRouter)

const startServer = async () => {
	try {
		await connectDb()
		app.listen(3007, () => {
			console.log('启动服务器 http://127.0.0.1:3007')
		})
	} catch (error) {
		console.error('Failed to start server:', error)
		process.exit(1)
	}
}
startServer()

app.get('/', (req, res) => {
	res.send('hello world')
})
