require("dotenv").config();
const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const isBot = require("isbot-fast");
const ejs = require("ejs");
const app = express();
const compression = require("compression");
var cors = require("cors");

app.use(compression());
app.use(cors());
app.use(bodyParser.json());

const { get, put, query } = require("./src/db.js");
const { getS3 } = require("./src/s3.js");
const { timeline, readFile, writeFile } = require("./src/twitter.js");

app.use(async function (req, res, next) {
  const json = {
    path: "https://rudixlab.com" + req.path,
    t: new Date(),
    ua: req.headers["user-agent"],
  };
  const prev = await readFile("/tmp/log.txt");
  await writeFile(
    "/tmp/log.txt",
    prev ? "\n" + JSON.stringify(json) + "," + prev + "" : JSON.stringify(json)
  );
  next();
});
app.get("/", async (req, res) => {
  res.header("Content-Type", "text/html");

  const contents = await getS3("views/rudix.html");
  const json = await readFile("./views/rudix.json");

  res.end(ejs.render(contents.Body.toString(), JSON.parse(json)));
});
app.get("/robots.txt", (req, res) => {
  res.sendFile(__dirname + "/views/robots.txt");
});

app.post("/db/", async (req, res) => {
  const data = await query(req.body);
  res.json(data);
});
app.post("/dbput/", async (req, res) => {
  const data = await put(req.body);
  res.json(data);
});
app.get("/log", async (req, res) => {
  const contents = await readFile("/tmp/log.txt");
  res.end("[" + contents + "]");
});
app.get("/sitemap/", async function (req, res) {
  res.header("Content-Type", "text/plain");
  const data = await query({
    id: Math.round(req.query.id || 1),
    collection: "t",
    limit: 50000,
    descending: true,
  });

  res.end(
    data.Items.map(
      (item) => "https://rudixlab.com/t/" + item.vreme + "/" + item.u + "/"
    ).join("\n")
  );
});

app.get("/i/:id", async (req, res) => {
  const ua = req.headers["user-agent"] || "";
  if (isBot(ua)) {
    await downloadFile(req.params.id);
    res.sendFile("/tmp/test.jpg");
  } else {
    res.render("kartinki", { id: req.params.id });
  }
});

app.get("/s3/*", async (req, res) => {
  const contents = await getS3(req.path.replace("/s3/", ""));
  res.header("Content-Type", contents.ContentType);
  res.end(contents.Body);
});

app.get("/t/:time/:id", async (req, res) => {
  res.header("Content-Type", "text/html");
  const { time, id } = req.params;

  const data = await query({
    id: Math.round(time),
    collection: "t",
    limit: 10,
    descending: true,
  });
  const tweets = await timeline(id);

  const user = tweets[0]
    ? tweets[0].user
    : {
        profile_image_url_https: "http://twivatar.glitch.me/" + id,
        profile_background_color: "black",
      };

  const tags = tweets[0]
    ? tweets
        .map((item) => item.text)
        .join(" ")
        .split(" ")
        .filter(function (n) {
          if (/#/.test(n)) return n.replace("#", "");
        })
    : [];

  const contents = await getS3("views/t.html");
  res.end(
    ejs.render(contents.Body.toString(), {
      ...data,
      tweets,
      user,
      tags,
      //tweets_stringified: JSON.stringify(tweets, null, 4),
      ...req.params,
    })
  );
});
app.get("/:colid/:time/:id", async (req, res) => {
  res.header("Content-Type", "text/html");
  const { time, id, colid } = req.params;

  const data = await query({
    id: Math.round(time),
    collection: colid,
    limit: 10,
    descending: true,
  });
  const contents = await getS3("views/" + colid + ".html");

  res.end(
    ejs.render(contents.Body.toString(), {
      ...data,
      ...req.params,
    })
  );
});
app.get("/:appid/:id", async (req, res) => {
  res.header("Content-Type", "text/html");
  const { appid, id } = req.params;

  const data = await query({
    id: Math.round(id),
    collection: appid,
    limit: 10,
    descending: true,
  });
  console.log(data);
  const contents = await getS3("views/" + appid + ".html");
  res.end(ejs.render(contents.Body.toString(), { ...data, ...req.query }));
});

if (!process.env.LAMBDA_RUNTIME_DIR) {
  app.listen(process.env.PORT || 3000);
  console.log("working on localhost");
}
//dsdsdsdsaddsadsadasdas
module.exports.handler = serverless(app);
