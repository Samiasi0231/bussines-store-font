-- Run this script as a database superuser/admin to add missing PaymentIntent enum values
-- This fixes the error: invalid input value for enum checkout_payments_intent_enum: "ORDER_PAYMENT"

-- Add all PaymentIntent enum values to checkout_payments_intent_enum
-- This will safely skip values that already exist

DO $$ 
BEGIN
  -- Add ORDER_PAYMENT
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ORDER_PAYMENT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'ORDER_PAYMENT';
  END IF;

  -- Add WALLET_FUNDING
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'WALLET_FUNDING' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'WALLET_FUNDING';
  END IF;

  -- Add SUBSCRIPTION
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SUBSCRIPTION' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'SUBSCRIPTION';
  END IF;

  -- Add SERVICE_PAYMENT
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SERVICE_PAYMENT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'SERVICE_PAYMENT';
  END IF;

  -- Add DONATION
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'DONATION' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'DONATION';
  END IF;

  -- Add REFUND
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'REFUND' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'REFUND';
  END IF;

  -- Add GENERAL
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'GENERAL' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'checkout_payments_intent_enum')
  ) THEN
    ALTER TYPE checkout_payments_intent_enum ADD VALUE 'GENERAL';
  END IF;
END $$;

