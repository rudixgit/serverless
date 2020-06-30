require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const isBot = require('isbot-fast')
const ejs = require('ejs')
const fs = require('fs')
const app = express()
const compression = require('compression')
app.use(compression())
app.use(bodyParser.json())
app.use(express.static('public'))
//app.set('view engine', 'ejs')

const db = require('./src/db.js')
const s3 = require('./src/s3.js')

app.get('/', async (req, res) => {
    if (req.query.id) {
        const url = await s3.uploadFile(req.originalUrl.replace('/?id=', ''))
        res.send(url.split('/').reverse()[0] + '<img src="' + url + '">')
    } else {
        res.sendFile(__dirname + '/views/rudix.html')
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
app.get('/env', (req, res) => {
    res.json(process.env)
})
app.get('/test/:apppid/:id', async (req, res) => {
    const template = await s3.getS3('views/' + req.params.appid + '.html')
    const data = await db.get(req.params.id)
    res.end(ejs.render(template, { ...data, ...req.query }))
})

app.get('/:appid/:id', async (req, res) => {
    const data = await db.get(req.params.id)
    res.header('Content-Type', 'text/html')
    //const template = await s3.getS3('views/' + req.params.appid + '.html')
    res.end(
        ejs.render(
            fs.readFileSync('./views/' + req.params.appid + '.html', 'utf8'),
            { ...data, ...req.query }
        )
    )
})

if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//Abhishe69741079
module.exports.handler = serverless(app)
