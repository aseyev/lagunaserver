const { Schema, model, Types } = require("mongoose");
// ActiveMembersList Raw response string from Aspen/
// Automatically updated each {config} seconds (as cache),
// intercepts users "Active members list" requests to Aspen,
// and returns this string from this db 

const schema = new Schema({
  // users: { type: Types.ObjectId },
  users: { type: String },
  date: { type: Date, required: true }
});

module.exports = model("AMList", schema);
