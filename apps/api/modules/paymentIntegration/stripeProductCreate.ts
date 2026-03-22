import stripe from "stripe";

const Stripe = new stripe(process.env.STRIPE_SECRET_KEY!);

interface Price {
     amountInCents: number;
     interval: "month" | "year";
     currency: string;
}

interface stripeProducts {
     name: string;
     description: string;
     prices: Price[];
}

const createSubscriptions = async (products: stripeProducts[]) => {
     products.map(async (product) => {
          const subscription = await Stripe.products.create({
               name: product.name,
               description: product.description,
          });

          const prices = product.prices.map(async (price) => {
               const subscriptionPrice = await Stripe.prices.create({
                    product: subscription.id,
                    unit_amount: price.amountInCents,
                    currency: price.currency,
                    recurring: {
                         interval: price.interval,
                    },
               });
          });
     });
};

const products: stripeProducts[] = [
     {
          name: "Pro Subscription of Realty CRM",
          description: "Pro Subscription of Realty CRM (TIER-1)",
          prices: [
               {
                    amountInCents: 6500,
                    interval: "month",
                    currency: "usd",
               },
          ],
     },
];

createSubscriptions(products);
