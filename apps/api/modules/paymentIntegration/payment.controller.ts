import type { Request, Response } from "express";
import stripe from "stripe";
import type { AuthenticatedRequest } from "../../shared/middleware/requireAuth";

const Stripe = new stripe(process.env.STRIPE_SECRET_KEY!);

export const getPaymentUrl = async (
     req: Request,
     res: Response,
) => {
     try {
          const authUser = req as AuthenticatedRequest;
          const { priceId } = req.body;
          const session = await Stripe.checkout.sessions.create({
               mode: "subscription",
               payment_method_types: ["card"],
               line_items: [
                    {
                         price: priceId,
                         quantity: 1,
                    },
               ],
               client_reference_id: authUser.user.id,
               metadata: {
                    userId: authUser.user.id,
                    planType: "PRO"
               },
               success_url:
                    "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
               cancel_url: "http://localhost:3000/cancel",
          });
          res.json({ url: session });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
