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
      // if (encodedData.MbsCardLogin4ResponseMessage) {
      //   console.log('encodedData: ', console.dir(encodedData.MbsCardLogin4ResponseMessage[0]))
      // }

      if (encodedData) { // === "MbsCardLogin4"
        // console.log('TEST response processing, name: ', encodedData)
        // for (let prop in encodedData) {
        //   responseWrap = encodedData[prop]
        //   console.log("XML Response Wrap (Obj???): ");
        //   console.dir(responseWrap)
        //     if (responseWrap) {
        //       for (let prop in responseWrap) {
        //         responseIn = responseWrap[prop]
        //         console.log("XML Response In (Arr???): ");
        //         console.dir(responseIn)
        //         if (responseIn) {
        //           for (let prop in responseIn) {
        //             responseBody = responseIn[prop]
        //             console.log("XML RESPONSE BODY (Obj Again...): ");
        //             console.dir(responseBody)
        //             console.log('response props encoded?')
        //             for (const prop in responseBody) {
        //               if (responseBody.hasOwnProperty(prop)) {
        //                 const element = responseBody[prop];
        //                 console.log(`prop: ${prop} value: ${element}`)
        //                 if (prop == 'AnswerStatus' && element == 'OK') {
        //                   console.log('READY TO PROCESSING RESPONSE!!!')
        //                 }
        //               }
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // if (responseIn) { // === "MbsCardLogin4"
        //   // console.dir(responseIn)
        //   responseBody = responseIn[0]
        //   console.log("XML Response Body: ");
        //   console.dir(responseBody)
        // }
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

    proxyReqBodyDecorator: async (body) => {
      currentRequest = ''
      let changedData = ''
      changedData = await xml2js.parseStringPromise(body);
      if (changedData && changedData.RequestMessage) {
        currentRequest = changedData.RequestMessage["$"].ElementType
        console.log('common endpoint Request Name: ', currentRequest)
        // if (currentRequest === "TeeHold") {
        //   console.log("currentRequest SHOULD BE REPLACED: ", currentRequest);
        //   app.post ("/", (req,res) => {
        //     console.log("!!! REQUEST REPLACED!!!", req);
        //     return
        //   }
        // )}
        // if (currentRequest === "MbsCardLogin4") { // === "MbsCardLogin4"
        //   for (var prop in changedData.RequestMessage) {
        //     console.log(
        //       "RequestMessage1." +
        //         prop +
        //         " = " +
        //         changedData.RequestMessage[prop]
        //     );
        //   }
        // }
      }
      return body;
    },

    // userResDecorator: async (proxyRes, proxyResData) => {
    //   // console.log(`proxyResDat:`, proxyResData)
    //   let changedData = await xml2js.parseStringPromise(proxyResData);
    //   if (changedData.MbsCardLogin4ResponseMessage) {
    //     let interceptedData = changedData.MbsCardLogin4ResponseMessage.Response;
    //     interceptedData[0].card_giv[0] = "Anton";
    //     // console.log('interceptedData: ', interceptedData)
    //   }
    //   return proxyResData;
    // },
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
