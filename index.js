const express = require('express')
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const stripe = require('stripe')('sk_test_51P9pziDS51rv9vSE5BoUTMQGD4BMXlZ1qiJ9MKsTTmHy7bXsqK3Q4Ro4US0GcLuFyyJADRZjpzd1UDHv4Rs0yLIG00jt7oRnKx');

app.get('/', function(req, res){
    res.send('Hello World')
})

app.post('/create-customer', async(req, res) =>{
  try{
      const customer = await stripe.customers.create({
          email: req.body.email,
      });

      const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{price: 'price_1PDltwDS51rv9vSEhqs22DYz'}],
          trial_period_days: 1,
      });

      res.status(200).json({ customerId: customer.id, subscriptionId: subscription.id });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
})


app.post('/create-payment-intent', async(req, res) =>{
  try{
      const paymentIntent = await stripe.paymentIntents.create({
          payment_method_types: ['card'],
          amount: 400,
          currency: 'gbp',
        });

        // Send client_secret in the response
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
      res.status(505).send(JSON.stringify(error))
  }
})


app.post('/get-subscription-status', async(req, res) => {
  try {
    const { subscriptionId } = req.body;

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Send the subscription status in the response
    res.status(200).json({ subscriptionStatus: subscription.status,current_period_start: subscription.current_period_start   });
  } catch (error) {
    console.error(error);     
    res.status(500).json({ error: error.message });
  }
});

app.post('/attach-payment-method', async(req, res) => {
  try {
    const { customerId, paymentMethodId } = req.body;

    console.log('Attaching payment method', paymentMethodId, 'to customer', customerId);

    // Attach the PaymentMethod to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    console.log('Payment method attached successfully:', paymentMethod);

    // Set it as the default payment method
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    console.log('Customer updated successfully:', customer);

    res.status(200).json({ customer });
  } catch (error) {
    console.error('Failed to attach payment method:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/create-setup-intent', async(req, res) => {
  try {
    const { customerId } = req.body;

    // Create a setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // The default usage is 'off_session'
    });

    // Send client_secret in the response
    res.status(200).json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    res.status(500).send(JSON.stringify(error))
  }
});





app.listen(4002, () => console.log('Api is running'))
