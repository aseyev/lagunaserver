const { Schema, model, Types } = require("mongoose");
// ActiveMembersList Raw response string from Aspen/
// Automatically updated each {config} seconds (as cache),
// intercepts users "Active members list" requests to Aspen,
// and returns this string from this db 

const schema = new Schema({
  rawList: { type: String },
  lastUpdate: { type: Date, required: true }
});

module.exports = model("AMList", schema);
