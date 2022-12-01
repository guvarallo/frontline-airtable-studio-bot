exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient()

  try {
    const { conversationSid } = event

    const name = await client.conversations.v1
      .conversations(conversationSid)
      .fetch()
      .then(conversation => conversation.friendlyName)

    callback(null, { name })
  } catch (err) {
    callback(err)
  }
}
