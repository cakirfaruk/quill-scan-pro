-- Create atomic credit deduction function to prevent race conditions
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Lock the row to prevent concurrent updates (prevents race condition)
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % < %', v_current_credits, p_amount;
  END IF;

  -- Deduct credits atomically
  v_new_credits := v_current_credits - p_amount;
  
  UPDATE profiles
  SET credits = v_new_credits
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    -p_amount,
    p_transaction_type,
    p_description
  );

  RETURN v_new_credits;
END;
$$;