# Twilio Frontline with Airtable + Twilio Studio Bot for WhatsApp and Voice Calls

### This repository is built on top of the project [Frontline Airtable Serverless Quickstart](https://github.com/twilio-labs/frontline-airtable-serverless-quickstart). To make it easier, I copied their instructions here on this repo and made a few changes to include the features I added.

This is a solution for Twilio Frontline that integrates Twilio Serverless Functions with Airtable as the contact database, and adds a few other functions to assit on building a powerful bot with Twilio Studio for WhatsApp messages and Voice calls. It implements a few features:

- 📇 Display a contact list in Frontline from a list of Airtable Contacts
- 🔀 Route inbound conversations in Frontline based on Airtable record ownership
- 📓 Define message templates in Airtable
- 🔐 Okta SSO setup script for easy SSO integration
- 💻 Functions to make the message bot better
- 💻 A function to make an automated voice call bot to redirect to WhatsApp

> **Note**: Airtable's API has a maximum throughput of 5 requests per second. This product is not suitable for large teams, see the Integration Limits section for more details.

## Prerequisites

We recommend following the setup outlined Frontline node.js quickstart, which shows you how to do the following:

- A Twilio Account. Don't have one? [Sign up](https://www.twilio.com/try-twilio) for free!
- A WhatsApp enabled [phone number](https://www.twilio.com/docs/whatsapp/self-sign-up).
- A [Twilio Frontline instance](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#create-a-new-twilio-frontline-instance).
- Twilio Conversations [configured](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#configure-twilio-conversations) to use the Frontline Conversations service as it's default conversation service.
- Additionally, you'll need to [copy this Airtable Base template](https://airtable.com/shrbXF88oQlRh7ZXh) and have your [Airtable API key](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-) along with your [Base ID](https://support.airtable.com/hc/en-us/articles/4405741487383-Understanding-Airtable-IDs).

Once you reach the step to "Configure the Frontline Integration Service" you are ready to deploy this app.

## Project Setup

Follow these steps to clone the repository, install dependencies, and set environment variables:

```bash
# Clone the repository:
git clone

# Change to the project directory:
cd frontline-airtable-studio-bot

# Install dependencies:
npm install

# Copy the sample environment variables file to .env:
cp .env.example .env
```

### Environment Variables Reference

Here are the environment variables that must be configured for the app to run:

```bash
ACCOUNT_SID= # Your twilio account SID, found in the console.
AUTH_TOKEN= # Your auth token, found in the console.

SSO_REALM_SID= # Go to console > Frontline > Manage > SSO/Log in

TWILIO_SMS_NUMBER= # Phone number in e164 format (e.g. +5511912345678)
TWILIO_WHATSAPP_NUMBER= # A Twilio WhatsApp sender (e.g. whatsapp:+5511912345678).

AIRTABLE_API_KEY= # Your Airtable API key
AIRTABLE_BASE_ID= # Your Airtable Base ID
```

## Deploy

Deploy this Serverless app with one command:

```bash
twilio serverless:deploy --service-name=frontline-airtable-studio-bot
```

> :information_source: **Always deploy to the same Twilio Account as your Frontline Service**: This integration service uses Twilio-signed requests to protect the callback URLs. The callback URLs will reject requests from a different Twilio account with a 403 error. You can check which account you're deploying to with `twilio profiles:list` and add another account with `twilio profiles:add`.

The app provides the following callback URLs:

- `/callbacks/add-convo-name`: called inside the Twilio Studio flow to add a name to the conversation.
- `/callbacks/crm`: called when Frontline loads the contact list or a user detail page.
- `/callbacks/get-convo-name`: called inside the Twilio Studio flow to get the name of the existing conversation (if there is one).
- `/callbacks/get-customer`: called inside the Twilio Studio flow to get the customer name on Airtable that is making the contact (if there is a record).
- `/callbacks/outgoing-conversation`: called when a user initiates an outbound conversation.
- `/callbacks/routing`: called when a messages is sent inbound that does not match an open conversation.
- `/callbacks/templates`: called when a user opens the templates menu.
- `/callbacks/voice-to-wa`: called inside the Twilio Studio flow in the incoming call trigger to transfer the call to a whatsapp conversation.

## Configure Callbacks

Copy and paste the callback URLs (uncluding your unique subdomain) into your Frontline configuration in the console.

### Routing configuration

In the Twilio Console, go to **_Frontline > Manage > Routing_** and select the option **Do not route**.

### Frontline callbacks

In the Twilio Console, go to **_Frontline > Manage > Callbacks_** and copy / paste the following callback URLs from your Frontline integration service:

- CRM Callback URL: `[your_app_url]/callbacks/crm`
- Outgoing Conversations Callback URL: `[your_app_url]/callbacks/outgoing-conversation`
- Templates Callback URL: `[your_app_url]/callbacks/templates`

<img width="1535" alt="Screen Shot 2022-02-28 at 11 42 24 PM" src="https://user-images.githubusercontent.com/1418949/156145175-a458a1d8-62be-433f-870c-31151f5996a6.png">

## Conversations Address Configuration

Now we need to [create a Conversation Address Configuration](https://www.twilio.com/docs/conversations/api/address-configuration-resource#create-an-addressconfiguration-resource) and setup the webhook which will be called with the `onMessageAdded` event, that redirects the message to our bot on Twilio Studio:

```bash
twilio api:conversations:v1:configuration:addresses:create \
    --friendly-name "Frontline Bot" \
    --auto-creation.enabled  \
    --auto-creation.type studio \
    --auto-creation.studio-flow-sid FWXXXXXXXXXXXXXXXXXXXXXX \
    --auto-creation.webhook-filters onMessageAdded \
    --type whatsapp \
    --address <Your WhatsApp Twilio Number> # e.g. whatsapp:+5511912345678
```

## Data Format

A sample Airtable template can be found [here](https://airtable.com/shrbXF88oQlRh7ZXh).

Note that addresses in the `sms` and `whatsapp` columns must be in e164 format, e.g. +1234567890. If numbers are formatted differently, the integration may fail to find customers in Airtable when a conversation is initiated from an inbound message.

## Integration Limits

We don't recommend using this integration to support more than 30 Frontline users and/or more than 4000 contacts. Here are the details to know:

Airtable's API has a maximum throughput of 5 requests per second. This integration service generates a request to Airtable under the following conditions:

- When a user opens the contact list the first time, or refreshes the contact list after the Twilio Serverless instance has "cooled off". Multiple API calls may be generated if more than 100 contacts are returned.
- When a user opens a customer profile page.
- When a user opens the templates menu from the mesage compose input.
- When a new customer texts inbound and creates a new conversation.

Additionally, Twilio Functions has the following limits:

- Functions may not run for longer than 10 seconds.
- You can't have more than 30 function invocations running concurrently.

### Contact Data Caching

Since pulling in a large list of contacts is the most data-intensive operation against Airtable, we cache contact data between Twilio Serverless invocations. You can see the implementation of the caching mechanism [here](https://github.com/cweems/frontline-airtable-quickstart/blob/main/assets/providers/customers.private.js#L166).

Each time a user refreshes, we check to see if a contact list is stored in memory from another Serverless invocation. If there's nothing in memory, we do a pull of all contacts for that Frontline worker. If there is a replica stored in memory, we query Airtable for any records added after the last data pull, and then append those to the list of contacts. Twilio Serverless retains the cache of contacts for about 5 minutes, reducing the need to pull data from Airtable and speeding up interactions for Frontline users.

### Integration Limits tl;dr

If you are returning a large contact list to users, your Twilio function may time out before Airtable returns all the pages of the query results.
