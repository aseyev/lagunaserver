const config = require("config");
const mongoose = require("mongoose");
const proxy = require("express-http-proxy");
const cors = require("cors");
const path = require("path");
const express = require("express");
const xml2js = require("xml2js");
const {useState} = require('react');
// const parseString = require("xml2js").parseString;

const [userCredentials, setUserCredentials] = useState({
  card_giv:'',
  card_sur:'',
  cardno:'',
  password:'',
  photo:'',
})
//https://stackoverflow.com/questions/54150783/react-hooks-usestate-with-object

// const http = require('http')
// const xmlparser = require('express-xml-bodyparser');
// const server = http.createServer(app);
// const { xml2json, responseXml } = require( './utils/xml2json')
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
        limit: "1mb",
        proxyErrorHandler: (err, res, next) => {
            next(err);
        },
        
        proxyReqBodyDecorator: async (body) => {
            let changedData = await xml2js.parseStringPromise(body);
            if (changedData.RequestMessage["$"].ElementType === "MbsCardLogin4") {
              for (var prop in changedData.RequestMessage) {
                console.log("RequestMessage." + prop + " = " + changedData.RequestMessage[prop]);
              }
            return body;
          }
        },

        userResDecorator: async (proxyRes, proxyResData) => {
            // console.log(`proxyResDat:`, proxyResData)
            let changedData = await xml2js.parseStringPromise(proxyResData);
            // console.dir(changedData);
            // console.log('Done, xml?', changedData);
            if (changedData.MbsCardLogin4ResponseMessage) {
                let interceptedData =
                    changedData.MbsCardLogin4ResponseMessage.Response;
                interceptedData[0].card_giv[0] = "Anton";
                // console.log('interceptedData: ', interceptedData)
            }
            var builder = new xml2js.Builder();
            var xmlChangedData = builder.buildObject(changedData);
            // console.log('xmlChangedData: ', xmlChangedData)

            if (changedData.ActiveMemberResponseMessage) {
                console.log(
                    `XXX ActiveMemberResponseMessage`,
                    changedData.ActiveMemberResponseMessage
                );
            }
            return proxyResData;
            // return xmlChangedData
        },
    })
);

const PORT = config.get("port") || 5050;

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

const activeMemberListLoader = setInterval(() => {
    console.log(`timer 1000 sec!`);
}, 1000 * 1000);

app.listen(PORT, () => console.log(`App has been started on pOrT ${PORT}!`));
