const config = require("config");
const mongoose = require("mongoose");
const proxy = require("express-http-proxy");
const cors = require("cors");
const path = require("path");
const express = require("express");
const xml2js = require("xml2js");
const fetch = require("node-fetch");
const AMList = require('./models/AMList')

// const parseString = require("xml2js").parseString;

const TimerOfUpdatingList = config.get("TimerOfUpdatingList"); //sec

const userCreds = {
  card_giv: "",
  card_sur: "",
  cardno: "",
  password: "",
  photo: "",
};

const app = express();

app.use(cors());
app.use("/api/auth", require("./routes/auth.routes"));

if (process.env.NODE_ENV === "production") {
  app.use("/", express.static(path.join(__dirname, "client", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
  });
}
// app.use(xmlparser());

app.use(
  "/",
  proxy(config.get("testUrl"), {
    timeout: 10000,
    limit: "5mb",
    proxyErrorHandler: (err, res, next) => {
      next(err);
    },

    filter: async (req, res) => {
      // let changedData = await xml2js.parseStringPromise(req);
      // console.log('filter getOwnPropertyNames req: ', Object.getOwnPropertyNames(resq) )
      console.log('filter getOwnPropertyNames req: ', Object.getOwnPropertyNames(req.params) )
      // console.log('filter reQ: ', req)
      // for (var prop in req.params) {
      //   console.log( "req." + prop + " = " + req[prop] );
      // }
      return true;
      // return req.method == 'GET';
    },

    proxyReqBodyDecorator: async (body) => {
      let changedData = await xml2js.parseStringPromise(body);
      if (changedData && changedData.RequestMessage) {
        // console.log(
        //   "changedData.RequestMessage: ",
        //   changedData.RequestMessage["$"].ElementType
        // );
        console.log("body: ", body);
        if (changedData.RequestMessage["$"].ElementType === "MbsCardLogin4") {
          for (var prop in changedData.RequestMessage) {
            console.log(
              "RequestMessage." +
                prop +
                " = " +
                changedData.RequestMessage[prop]
            );
          }
        }
        // if
      }
      return body;
    },

    userResDecorator: async (proxyRes, proxyResData) => {
      // console.log(`proxyResDat:`, proxyResData)
      let changedData = await xml2js.parseStringPromise(proxyResData);
      console.dir(changedData);
      // console.log('Done, xml?', changedData);
      if (changedData.MbsCardLogin4ResponseMessage) {
        let interceptedData = changedData.MbsCardLogin4ResponseMessage.Response;
        interceptedData[0].card_giv[0] = "Anton";
        // console.log('interceptedData: ', interceptedData)
      }

      // if (changedData.ActiveMemberResponseMessage) {
      //   console.log(
      //     `XXX ActiveMemberResponseMessage`,
      //     changedData.ActiveMemberResponseMessage
      //   );
      // }
      return proxyResData;
      // var builder = new xml2js.Builder();
      // var xmlChangedData = builder.buildObject(changedData);
      // console.log('xmlChangedData: ', xmlChangedData)
      // return xmlChangedData
    },
  })
);

const PORT = config.get("port") || 5050;


const activeMemberListLoader = setInterval(async () => {
  let currentTime = new Date().getTime();
  console.log('currentTime', currentTime)
  try {
    const previousList = await AMList.findOne();
    // console.log('previousList!', previousList)
    let checkDate = previousList ? (currentTime - previousList.date.getTime()) : 10000000
    console.log('checkDate!', checkDate)
    if (checkDate > 1000000 ) {
      let response = await fetch(config.get("testUrl"), {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body:
          '<?xml version="1.0" encoding="UTF-8"?> <RequestMessage ElementType="ActiveMember"> </RequestMessage>',
      });
      if (!response.ok) {
        throw CustomError("HTTP eRRor:! ");
      } 
      else {
        body = await response.text()
        let now = new Date()
        if (!previousList) {
          let currentList = new AMList({
            date: now,
            users: body
          })
          await currentList.save()
        } else {
          previousList.overwrite({
            date: now,
            users: body
          })
          await previousList.save()
        }
        // console.log('AMList body: ', body)
      }
    }
  } catch (error) {
    console.log("HTTP eRRor XYZ: ", error);
  }

  console.log(
    `request for ActiveMembersList was sent. It will be updated after ${TimerOfUpdatingList} sec!`
  );
}, 1000 * TimerOfUpdatingList);

async function start() {
  try {
    await mongoose.connect(config.get("mongoUri"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  } catch (e) {
    console.log("server error: ", e.message);
    process.exit(1);
  }
}

start();

app.listen(PORT, () => console.log(`App has been started on pOrT ${PORT}!`));
