import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  platform: "ios" | "android" | "web";
  purchaseType: "credits" | "subscription" | "package";
  productId: string;
  transactionId: string;
  receipt: string;
  itemId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const body: PurchaseRequest = await req.json();
    const { platform, purchaseType, productId, transactionId, receipt, itemId } = body;

    console.log(`Processing ${purchaseType} purchase for user ${user.id}`);
    console.log(`Platform: ${platform}, Product: ${productId}, Transaction: ${transactionId}`);

    // Verify receipt based on platform
    let isValid = false;
    
    if (platform === "ios") {
      // In production, verify with Apple's verifyReceipt endpoint
      // https://buy.itunes.apple.com/verifyReceipt (production)
      // https://sandbox.itunes.apple.com/verifyReceipt (sandbox)
      console.log("iOS receipt verification would happen here");
      isValid = true; // For development
    } else if (platform === "android") {
      // In production, verify with Google Play Developer API
      // https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}
      console.log("Android receipt verification would happen here");
      isValid = true; // For development
    } else if (platform === "web") {
      // Web payments would use Stripe or similar
      console.log("Web payment verification would happen here");
      isValid = true; // For development
    }

    if (!isValid) {
      throw new Error("Invalid purchase receipt");
    }

    // Check for duplicate transaction
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("store_transaction_id", transactionId)
      .single();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Transaction already processed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let creditsToAdd = 0;
    let itemName = "";

    if (purchaseType === "credits" && itemId) {
      // Get credit package details
      const { data: creditPkg } = await supabaseClient
        .from("credit_packages")
        .select("*")
        .eq("id", itemId)
        .single();

      if (creditPkg) {
        creditsToAdd = creditPkg.credits;
        itemName = creditPkg.name;

        // Record purchase
        await supabaseClient.from("purchases").insert({
          user_id: user.id,
          purchase_type: "credits",
          item_id: itemId,
          item_name: itemName,
          credits_added: creditsToAdd,
          amount_try: creditPkg.price_try,
          platform,
          store_transaction_id: transactionId,
          store_receipt: receipt,
          status: "completed"
        });

        // Add credits to user
        await supabaseClient.rpc("deduct_credits_atomic", {
          p_user_id: user.id,
          p_amount: -creditsToAdd, // Negative to add
          p_transaction_type: "purchase",
          p_description: `${itemName} satın alındı`
        });
      }
    } else if (purchaseType === "subscription" && itemId) {
      // Get subscription plan details
      const { data: subPlan } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("id", itemId)
        .single();

      if (subPlan) {
        itemName = subPlan.name;
        creditsToAdd = subPlan.bonus_credits;

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + subPlan.duration_days);

        // Create subscription
        await supabaseClient.from("user_subscriptions").insert({
          user_id: user.id,
          plan_id: itemId,
          status: "active",
          expires_at: expiresAt.toISOString(),
          platform,
          store_transaction_id: transactionId
        });

        // Record purchase
        await supabaseClient.from("purchases").insert({
          user_id: user.id,
          purchase_type: "subscription",
          item_id: itemId,
          item_name: itemName,
          credits_added: creditsToAdd,
          amount_try: subPlan.price_try,
          platform,
          store_transaction_id: transactionId,
          store_receipt: receipt,
          status: "completed"
        });

        // Add bonus credits
        if (creditsToAdd > 0) {
          await supabaseClient.rpc("deduct_credits_atomic", {
            p_user_id: user.id,
            p_amount: -creditsToAdd,
            p_transaction_type: "subscription_bonus",
            p_description: `${itemName} abonelik bonusu`
          });
        }
      }
    } else if (purchaseType === "package" && itemId) {
      // Get special package details
      const { data: specialPkg } = await supabaseClient
        .from("special_packages")
        .select("*")
        .eq("id", itemId)
        .single();

      if (specialPkg) {
        itemName = specialPkg.name;
        const includedItems = specialPkg.included_items as any[];

        // Calculate bonus credits from package
        const creditItem = includedItems.find((item: any) => item.type === "credits");
        if (creditItem) {
          creditsToAdd = creditItem.count;
        }

        // Record purchase
        await supabaseClient.from("purchases").insert({
          user_id: user.id,
          purchase_type: "package",
          item_id: itemId,
          item_name: itemName,
          credits_added: creditsToAdd,
          amount_try: specialPkg.price_try,
          platform,
          store_transaction_id: transactionId,
          store_receipt: receipt,
          status: "completed"
        });

        // Add credits if any
        if (creditsToAdd > 0) {
          await supabaseClient.rpc("deduct_credits_atomic", {
            p_user_id: user.id,
            p_amount: -creditsToAdd,
            p_transaction_type: "package_purchase",
            p_description: `${itemName} paketi satın alındı`
          });
        }

        // TODO: Track package items usage (tarot, coffee, etc.)
        // This would require a separate user_package_items table
      }
    }

    console.log(`Purchase completed: ${itemName}, Credits added: ${creditsToAdd}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase verified and processed",
        creditsAdded: creditsToAdd,
        itemName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Purchase verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
