import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            Deno.env.get("STRIPE_WEBHOOK_SECRET")!
        );

        console.log(`[Stripe Webhook] Received event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as any;
                const userId = session.metadata.user_id;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (userId) {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_tier: "monarch",
                            subscription_status: "active",
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                        })
                        .eq("id", userId);
                    console.log(`[Stripe Webhook] User ${userId} upgraded to Monarch.`);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as any;
                const status = subscription.status; // e.g., 'active', 'past_due', 'canceled'
                const subscriptionId = subscription.id;

                await supabase
                    .from("profiles")
                    .update({ subscription_status: status })
                    .eq("stripe_subscription_id", subscriptionId);

                console.log(`[Stripe Webhook] Subscription ${subscriptionId} updated to ${status}.`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as any;
                const subscriptionId = subscription.id;

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: "hunter",
                        subscription_status: "canceled"
                    })
                    .eq("stripe_subscription_id", subscriptionId);

                console.log(`[Stripe Webhook] Subscription ${subscriptionId} deleted. User downgraded to Hunter.`);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(`[Webhook Error] ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
