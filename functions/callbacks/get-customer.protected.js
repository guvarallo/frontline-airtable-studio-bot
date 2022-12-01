// eslint-disable-next-line no-undef
const path = Runtime.getAssets()['/providers/customers.js'].path
const { getCustomerByNumber } = require(path)

exports.handler = async function (context, event, callback) {
  try {
    const { customerNumber } = event

    const trimmedNumber = customerNumber.substr(9)

    const customer = await getCustomerByNumber(context, trimmedNumber)

    callback(null, { customer })
  } catch (err) {
    callback(err)
  }
}
