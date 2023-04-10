// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const { plans, features } = require('./plans');
const auth = require('../../middleware/auth');
const dayjs = require('dayjs');
const router = express.Router();
const Subscription = require('../../model/subscription');
const utils = require('../../middleware/utils');

const { WEB_UI, STRIPE_PRODUCT } = process.env;

const product = STRIPE_PRODUCT;

router.use([utils, auth], async (req, res, next) => {

  next();

});

router.get('/features', async (req, res) => {

  res.send(features());
});

router.get('/plans', async (req, res) => {

  const prices = await stripe.prices.list({ active: true, product: product });

  res.send(plans({ prices: prices.data }));
});

router.get('/products', async (req, res) => {

  const { data } = await stripe.products.list({ active: true, ids: [product] });

  res.send(data);
});

router.get('/prices', async (req, res) => {

  const { data } = await stripe.prices.list({ active: true, product: product });

  res.send(data);
});

router.post('/verify-payment', async (req, res) => {
  const user = req['user'];
  const { now } = req['utils'];
  const { sessionId } = req.body;

  const subscription = await Subscription.findOne({ user });

  if (subscription?.history?.some(x => x.session.id === sessionId) || subscription?.subscription?.session.id === sessionId) {
    return res.send({ status: 'error', message: 'Used payment session' });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    return res.send({ status: 'error', message: 'Invalid payment session' });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

  const displayName = lineItems.data[0].price.metadata.displayName;

  if (session.payment_status !== 'paid') {
    // Payment failed
    return res.send({ status: 'error', message: `Payment didn't go through` });
  }

  const newSub = {
    user: user._id,
    subscription: {
      displayName,
      from: now,
      to: dayjs(now).add(1, 'month').toDate(),
      session
    }
  };

  if (session.payment_status === 'paid') {
    // Payment succeeded
    if (subscription?.subscription && Object.keys(subscription?.subscription).length) {
      // user has active subscription, archive current subscription
      subscription.history.push(subscription.subscription);
      await subscription.updateOne(newSub);
      await subscription.save();
    } else {
      const sub = await Subscription.create(newSub);
      await sub.save();
    }

    res.send({ status: 'success', message: 'Thanks for your payment.' });

  }

});

router.post('/create-checkout-session', async (req, res) => {

  const { id } = req.body;

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: id,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${WEB_UI}/account/payment?success=true&session_id={CHECKOUT_SESSION_ID}&id=${id}`,
    cancel_url: `${WEB_UI}/account/payment?canceled=true`,
  });

  res.send({ url: session.url });
});

router.post('/create-portal-session', async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;

  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = WEB_UI;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });

  res.redirect(303, portalSession.url);
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event = req.body;
  // Replace this endpoint secret with your endpoint's unique secret
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = 'whsec_12345';
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }
  let subscription;
  let status;
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.trial_will_end':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      break;
    case 'customer.subscription.deleted':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription deleted.
      // handleSubscriptionDeleted(subscriptionDeleted);
      break;
    case 'customer.subscription.created':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription created.
      // handleSubscriptionCreated(subscription);
      break;
    case 'customer.subscription.updated':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription update.
      // handleSubscriptionUpdated(subscription);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  // Return a 200 response to acknowledge receipt of the event
  res.send();
}
);

module.exports = router;