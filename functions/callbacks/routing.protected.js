// eslint-disable-next-line no-undef
const path = Runtime.getAssets()['/providers/customers.js'].path
const { findWorkerForCustomer, findRandomWorker } = require(path)

exports.handler = async function (context, event, callback) {
  console.log('Handling custom routing callback.')

  const client = context.getTwilioClient()

  try {
    const { conversationSid, customerNumber } = event

    const workerIdentity = await routeConversation(
      context,
      conversationSid,
      customerNumber
    )
    const resp = await routeConversationToWorker(
      client,
      conversationSid,
      workerIdentity
    )

    callback(null, resp)
  } catch (err) {
    callback(err)
  }
}

const routeConversation = async (context, conversationSid, customerNumber) => {
  let workerIdentity = await findWorkerForCustomer(context, customerNumber)

  if (!workerIdentity) {
    // Customer doesn't have a worker
    // Select a random worker
    console.log('No assigned worker found, selecting a random worker.')
    workerIdentity = await findRandomWorker(context)

    // Or you can define default worker for unknown customers.
    // workerIdentity = 'john@example.com'

    if (!workerIdentity) {
      throw new Error(
        `Routing failed, please add workers to customersToWorkersMap or define a default worker. Conversation SID: ${conversationSid}`
      )
    }
  }

  return workerIdentity
}

const routeConversationToWorker = async (
  client,
  conversationSid,
  workerIdentity
) => {
  // Add worker to the conversation with a customer
  await client.conversations
    .conversations(conversationSid)
    .participants.create({ identity: workerIdentity })
    .then(async participant => {
      console.log('Created agent participant: ', participant.sid)

      const worker = await client.conversations.v1.users
        .list()
        .then(users => users.filter(u => u.identity === workerIdentity))

      await client.conversations.v1
        .conversations(conversationSid)
        .messages.create({
          author: workerIdentity,
          body: `Olá, aqui é o ${worker[0].friendlyName} e vou prosseguir com seu atendimento!`
        })
        .then(message => console.log(message.sid))
    })
    .catch(err => console.log(`Failed to create agent participant: ${err}`))
}
