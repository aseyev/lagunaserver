const config = require('config')
const mongoose = require('mongoose');
const proxy = require('express-http-proxy');
const cors = require('cors');
const path = require('path');
const express = require('express');
const xml2js = require('xml2js');
const parseString = require('xml2js').parseString

// const http = require('http')
// const xmlparser = require('express-xml-bodyparser');
// const server = http.createServer(app);
// const { xml2json, responseXml } = require( './utils/xml2json')
const app = express()


app.use(cors())
app.use('/api/auth', require('./routes/auth.routes'))

if(process.env.NODE_ENV === 'production') {
  app.use ('/', express.static(path.join(__dirname, 'client', 'dist')))

  app.get ('*', (req, res)=>{
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'))
  })
}
// app.use(xmlparser()); 

app.use('/', proxy(config.get('testUrl'), {
  timeout: 10000,
  limit: '1mb',
  proxyErrorHandler: (err, res, next) => {next(err)},
  userResDecorator: (proxyRes, proxyResData) => {
    // console.log(`proxyResDat:`, proxyResData.toString('utf8'))
    console.log(`proxyResDat:`, proxyResData)
    // let data = JSON.parse(proxyResData.toString('utf8'));
    // let parser = new xmlparser.Parser();
    let changedData = xml2js.parseStringPromise(proxyResData).then(function (result) {
      console.dir(result);
      console.log('Done, xml?', result);
      if (result.MbsCardLogin4ResponseMessage) {
        let interruptedData = result.MbsCardLogin4ResponseMessage.Response
        interruptedData[0].card_giv[0] = 'Anton'
        console.log('interruptedData: ', interruptedData)
      }
      return result
    }).catch(function(err){
      console.log('deal with error of xml-parcing!:', err)
    });
    console.log('changedData: ', changedData)
    var builder = new xml2js.Builder();
    var xmlChangedData = builder.buildObject(changedData);
    console.log('xmlChangedData: ', xmlChangedData)
    // return proxyResData
    return xmlChangedData
  }
}))

const PORT = config.get('port') || 5050

async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
  } catch (e) {
    console.log('server error: ', e.message)
    process.exit(1)
  }
}

start()

// server.listen(PORT, () => console.log(`App has been started on pOrT ${PORT}!`))
app.listen(PORT, () => console.log(`App has been started on pOrT ${PORT}!`))