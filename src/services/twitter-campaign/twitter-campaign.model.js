// twitter-campaign-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const twitterCampaign = new Schema({
    // Tweet Id from Twitter API
    tweetId: { type: String, required: true },
    // Reward amount in EQB units
    amount: { type: Number, required: true },
    // Dates eligible for reward
    fromDate: { type: Date, default: Date.now },
    toDate: { type: Date, required: true },
    // Total amount in EQB that can be spent for a tweet
    maxRewardAmount: { type: Number, required: true }
  }, {
    timestamps: true
  })

  return mongooseClient.model('twitterCampaign', twitterCampaign)
}
