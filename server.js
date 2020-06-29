require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const isBot = require('isbot-fast')
const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))
app.set('view engine', 'ejs')

const db = require('./src/db.js')
const s3 = require('./src/s3.js')

app.all('/', async (req, res) => {
    if (req.query.id) {
        const url = await s3.uploadFile(req.originalUrl.replace('/?id=', ''))
        res.send(url.split('/').reverse()[0] + '<img src="' + url + '">')
    } else {
        if (
            //req.hostname === 'localhost' ||
            req.hostname === 'img.rudixlab.com'
        ) {
            res.render('kartinki', { id: 1 })
        } else {
            res.render('rudix', {})
        }
    }
})

app.get('/i/:id', async (req, res) => {
    const ua = req.headers['user-agent'] || ''
    if (isBot(ua)) {
        await s3.downloadFile(req.params.id)
        res.sendFile('/tmp/test.jpg')
    } else {
        res.render('kartinki', { id: req.params.id })
    }
})

app.get('/ddb/:id', async (req, res) => {
    const data = await db.get(req.params.id)
    res.json(data)
})
app.post('/ddb/', async (req, res) => {
    const data = await db.put(req.body)
    res.json(data)
})

if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//testdsdsddddsds
module.exports.handler = serverless(app)
