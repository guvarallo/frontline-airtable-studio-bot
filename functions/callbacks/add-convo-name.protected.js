// eslint-disable-next-line no-undef
const path = Runtime.getAssets()['/providers/customers.js'].path
const { getCustomerByNumber } = require(path)

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient()

  try {
    const { conversationSid, customerNumber } = event

    const trimmedNumber = customerNumber.substr(9)

    const customer = await getCustomerByNumber(context, trimmedNumber)

    const friendlyName = await client.conversations.v1
      .conversations(conversationSid)
      .update({
        friendlyName: customer?.display_name ?? 'Novo cliente'
      })
      .then(conversation => console.log(conversation.friendlyName))

    callback(null, { friendlyName })
  } catch (err) {
    callback(err)
  }
}
