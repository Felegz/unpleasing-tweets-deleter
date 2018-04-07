// server.js
// where your node app starts

// init project
var express = require("express");
var app = express();
var moment = require("moment");
var now = moment(); //To get the current date and time, just call moment() with no parameters.

var TWEETS_COUNT = 200; //check 200 last tweets for deletion condition
var CLIENT_TO_DELETE =
  '<a href="http://cheapbotsdonequick.com" rel="nofollow">Cheap Bots, Done Quick!</a>';//enter your c
var DELETION_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

var DELETE_WITH_RETWEETS_LESS_THAN = 1;
var DELETE_WITH_FAVS_LESS_THAN = 1;

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

app.all("/" + process.env.BOT_ENDPOINT, function(request, response) {
  /* The example below tweets out "Hello world!". */
  // Start bot and timer
  BotStart();
  //setInterval(BotStart, INTERVAL);
  var resp = response;
  resp.sendStatus(200); //status "OK"
});

function BotStart() {
  console.log("now is " + now);
  var Twit = require("twit");

  var client = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  });

  client.get("statuses/user_timeline", { count: TWEETS_COUNT }, function(
    error,
    params,
    response
  ) {
    deleteLessThan(
      params,
      DELETE_WITH_RETWEETS_LESS_THAN,
      DELETE_WITH_FAVS_LESS_THAN
    );
    //deleteRetweets(params)
    //console.log(params[0]);
  });

  function deleteLessThan(params, rts, favs) {
    var tweetsDeleted = 0;
    for (var i = 0; i < params.length; i++) {
      var tweetID = params[i].id_str;
      var retweets = params[i].retweet_count;
      var favorites = params[i].favorite_count;
      var is_reply = params[i].in_reply_to_user_id;
      var client = params[i].source;
      //var date = moment(params[i].created_at)

      var posted_at = moment(
        params[i].created_at,
        "dd MMM DD HH:mm:ss ZZ YYYY",
        "en"
      ).valueOf(); //Using moment.js to parse the awkward Twitter date properly
      //'Sun Jul 23 12:43:02 +0000 2017'
      console.log((now - posted_at) / 1000 / 60 / 60);

      if (
        !is_reply &&
        client == CLIENT_TO_DELETE &&
        now - posted_at > DELETION_INTERVAL &&
        retweets < rts &&
        favorites < favs
      ) {
        deleteTweet(tweetID);
        console.log(params[i]);
        tweetsDeleted++;
      }
    }
    console.log("TOTAL NUMBER OF TWEETS DELETED: ", tweetsDeleted);
    console.log(
      "TOTAL NUMBER OF TWEETS SAVED: ",
      params.length - tweetsDeleted
    );
    console.log("TOTAL NUMBER OF TWEETS ANALYZED: ", params.length);
    console.log(
      "PERCENT SAVED: ",
      Math.floor((params.length - tweetsDeleted) / params.length * 100),
      "%"
    );
  }

  
    function deleteTweet(tweetID) {
    tweetID = tweetID.toString();
    client.post("statuses/destroy/:id", { id: tweetID }, function(
      err,
      data,
      res
    ) {
      //console.log("deleted", tweetsDeleted)
    });
  }
  
  
  
  
  
  function deleteRetweets(params) {
    var tweetsDeleted = 0;
    for (var i = 0; i < params.length; i++) {
      if (params[i].retweeted) {
        deleteTweet(params[i].id_str);
        tweetsDeleted++;
      } else if (params[i].text[0] == "R" && params[i].text[1] == "T") {
        //I think twitter used to handle retweets differently so this is a special case for those tweets.
        deleteTweet(params[i].id_str);
        tweetsDeleted++;
      } else {
        console.log(params[i].text);
      }
    }
    console.log("TOTAL NUMBER OF TWEETS DELETED: ", tweetsDeleted);
    console.log(
      "TOTAL NUMBER OF TWEETS SAVED: ",
      params.length - tweetsDeleted
    );
    console.log("TOTAL NUMBER OF TWEETS ANALYZED: ", params.length);
  }

}
