const request = require("request");

const async = require("async");
const db = require("../src/db.js");
request.get(
  "https://pouchdb.herokuapp.com/jokes/_all_docs?limit=10000&include_docs=true&skip=60000",
  function (e, x, body) {
    const json = JSON.parse(body);
    console.log(json.rows.length);
    json.rows.forEach(async (element) => {
      console.log(element);
      await db.put({
        tip: "jokesbg",
        vreme: new Date().getTime(),
        ...element.doc,
      });
    });
  }
);
//insert into `jokes` () values ()
