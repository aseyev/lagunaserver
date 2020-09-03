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
  userId: "",
  userToken: ""
};
let currentRequest = ''

const app = express();

app.use(cors());

app.use(
  "/test",
  proxy(config.get("testUrl"), {
    timeout: 10000,
    limit: "5mb",
    proxyErrorHandler: (err, res, next) => {
      next(err);
    },

    filter: async (req, res) => {
      return true;
    },
    
//DELETE proxyReqOptDecorator FOR THE SAFETY OF PRODUCTION BUILD! 
//IT'S ONLY FOR THE TEST SERVER (NO SSL)
    proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
      proxyReqOpts.rejectUnauthorized = false
      return proxyReqOpts;
    },

    proxyReqBodyDecorator: async (body) => {
      currentRequest = ''
      let requestData = ''
      requestData = await xml2js.parseStringPromise(body);
      if (requestData && requestData.RequestMessage) {
        currentRequest = requestData.RequestMessage["$"].ElementType
        console.log('TEST endpoint request: ', currentRequest)
        if (currentRequest) { // === "MbsCardLogin4"
          for (var prop in requestData.RequestMessage) {
            console.log(
              "RequestMessage." +
                prop +
                " = " +
                requestData.RequestMessage[prop]
            );
          }
        }
      }
      return body;
    },

    userResDecorator: async (proxyRes, responseData) => {
      // console.log(`proxyResponse Payload:`, responseData)
      let encodedData = await xml2js.parseStringPromise(responseData);
      // console.log(`proxyResponse encodedData:`, encodedData)
      if (encodedData && encodedData.MbsCardLogin4ResponseMessage) {
        let responseLogin4 = encodedData.MbsCardLogin4ResponseMessage.Response[0]
        console.log(`responseLogin4 body:`, responseLogin4)
        console.log(`responseLogin4 AnswerStatus:`, responseLogin4.AnswerStatus[0])
        if (responseLogin4 && responseLogin4.AnswerStatus[0] == 'OK') {
          console.log('Ready to GO!')
        }
      }
          
      return responseData;
    },
  })
);

app.use(
  "/",
  proxy(config.get("testUrl"), {
    timeout: 10000,
    limit: "5mb",
    proxyErrorHandler: (err, res, next) => {
      next(err);
    },

    filter: async (req, res) => {
      return true;
    },
    
//DELETE proxyReqOptDecorator FOR THE SAFETY OF PRODUCTION BUILD! 
//IT'S ONLY FOR THE TEST SERVER (NO SSL)
    proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
      proxyReqOpts.rejectUnauthorized = false
      return proxyReqOpts;
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
