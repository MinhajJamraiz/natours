// import Stripe from 'stripe';
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(`${process.env.STRIPE_PUBLIC_KEY}`);
  try {
    //1> Get Chechout session from API endpoint
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2> Create checkout form + Charge credit card
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    showAlert('error', err);
  }
};
