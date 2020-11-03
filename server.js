require("dotenv").config();
const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

const compression = require("compression");
const cors = require("cors");

app.use(compression());
app.use(cors());
app.use(bodyParser.json());

const { put, query, q1 } = require("./src/db.js");
const { getS3, getFS } = require("./src/s3.js");
const { timeline, readFile, writeFile } = require("./src/twitter.js");

app.use(async (req, res, next) => {
  const json = {
    path: `https://rudixlab.com${req.path}`,
    t: new Date(),
    ua: req.headers["user-agent"],
  };
  const prev = await readFile("/tmp/log.txt");
  await writeFile(
    "/tmp/log.txt",
    prev ? `\n${JSON.stringify(json)},${prev}` : JSON.stringify(json)
  );
  next();
});
app.get("/", async (req, res) => {
  res.header("Content-Type", "text/html");

  const contents = await getFS("./views/rudix.html");
  const json = await readFile("./views/rudix.json");

  res.end(ejs.render(contents.Body.toString(), JSON.parse(json)));
});
app.get("/robots.txt", (req, res) => {
  res.sendFile(`${__dirname}/views/robots.txt`);
});
app.post("/db/q1", async (req, res) => {
  const data = await q1(req.body);
  res.json(data);
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
  res.end(`[${contents}]`);
});
app.get("/sitemap/", async (req, res) => {
  res.header("Content-Type", "text/plain");
  const data = await query({
    id: Math.round(req.query.id || 1),
    collection: "t",
    limit: 50000,
    descending: true,
  });

  res.end(
    data.Items.map(
      (item) => `https://rudixlab.com/t/${item.vreme}/${item.u}/`
    ).join("\n")
  );
});

app.get("/s3/*", async (req, res) => {
  const contents = await getS3(req.path.replace("/s3/", ""));
  res.header("Content-Type", contents.ContentType);
  res.end(contents.Body);
});

app.get("/t/:time/:id", async (req, res) => {
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
        profile_image_url_https: `http://twivatar.glitch.me/${id}`,
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

  const contents = await getFS("views/t.html");

  const jsonOutput = {
    Items: [],
    ...data,
    tweets,
    user,
    tags,
    // tweets_stringified: JSON.stringify(tweets, null, 4),
    ...req.params,
  };
  if (req.query.format) {
    res.header("Content-Type", "application/json");
    res.json(jsonOutput);
  } else {
    res.header("Content-Type", "text/html");
    res.end(ejs.render(contents.Body.toString(), jsonOutput));
  }
});
app.get("/:colid/:time/:id", async (req, res) => {
  res.header("Content-Type", "text/html");
  const { time, colid } = req.params;

  const data = await query({
    id: Math.round(time),
    collection: colid,
    limit: 10,
    descending: true,
  });
  const contents = await getFS(`views/${colid}.html`);

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

  const contents = await getFS(`views/${appid}.html`);
  res.end(ejs.render(contents.Body.toString(), { ...data, ...req.query }));
});

if (!process.env.LAMBDA_RUNTIME_DIR) {
  app.listen(process.env.PORT || 3000);
}
// dsdsdsdsaddsadsadasdas
module.exports.handler = serverless(app);
