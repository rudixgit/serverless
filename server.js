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
const twitter = require('./src/twitter.js')
app.get('/', async (req, res) => {
    res.header('Content-Type', 'text/html')
    if (req.query.id) {
        const url = await s3.uploadFile(req.originalUrl.replace('/?id=', ''))
        res.send(url.split('/').reverse()[0] + '<img src="' + url + '">')
    } else {
        const contents = await s3.getS3('views/rudix.html')
        res.end(contents.Body.toString())
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
app.get('/env', (req, res) => res.json(process.env))
app.get('/sitemap', async function (req, res) {
    res.header('Content-Type', 'text/plain')
    const data = await db.query({
        id: 1,
        collection: 't',
        limit: 50000,
        descending: false,
    })
    res.end(
        data.Items.map(
            (item) =>
                'https://rudixlab.com/t/' + item.vreme + '/' + item.u + '/'
        ).join('\n')
    )
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

app.get('/s3/*', async (req, res) => {
    const contents = await s3.getS3(req.path.replace('/s3/', ''))
    res.header('Content-Type', contents.ContentType)
    res.end(contents.Body)
})

app.get('/t/:time/:id', async (req, res) => {
    res.header('Content-Type', 'text/html')
    const { time, id } = req.params
    const data = await db.query({
        id: Math.round(time),
        collection: 't',
        limit: 50,
        descending: true,
    })
    const tweets = await twitter.timeline(id)
    const contents = await s3.getS3('views/t.html')
    res.end(
        ejs.render(contents.Body.toString(), {
            ...data,
            tweets,
            tweets_stringified: JSON.stringify(tweets, null, 4),
            ...req.params,
        })
    )
})
app.get('/:colid/:time/:id', async (req, res) => {
    res.header('Content-Type', 'text/html')
    const { time, id, colid } = req.params

    const data = await db.query({
        id: Math.round(time),
        collection: colid,
        limit: 10,
        descending: true,
    })
    const contents = await s3.getS3('views/' + colid + '.html')

    res.end(
        ejs.render(contents.Body.toString(), {
            ...data,
            ...req.params,
        })
    )
})
app.get('/:appid/:id', async (req, res) => {
    res.header('Content-Type', 'text/html')
    const { appid, id } = req.params
    const data = await db.get(id)
    const contents = await s3.getS3('views/' + appid + '.html')
    res.end(ejs.render(contents, { ...data, ...req.query }))
})

if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//Abhishe69741079
module.exports.handler = serverless(app)
