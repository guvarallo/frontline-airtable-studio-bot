exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient()
  const twilioNumber = context.TWILIO_WHATSAPP_NUMBER

  try {
    const { To } = event
    const trimmedTo = To.substr(1)

    const messageSid = await client.messages
      .create({
        from: twilioNumber,
        body: 'Podemos seguir?',
        to: `whatsapp:+55${trimmedTo}`
      })
      .then(message => message.sid)

    callback(null, { messageSid })
  } catch (err) {
    callback(err)
  }
}
