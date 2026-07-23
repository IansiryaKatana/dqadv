-- Switch default and existing currency from USD to GBP

UPDATE public.dq_donation_products
SET currency = 'GBP'
WHERE currency IS NULL OR currency = 'USD';

UPDATE public.dq_cart_items
SET currency = 'GBP'
WHERE currency = 'USD';

UPDATE public.dq_donations
SET currency = 'GBP'
WHERE currency = 'USD';

ALTER TABLE public.dq_donation_products
  ALTER COLUMN currency SET DEFAULT 'GBP';

ALTER TABLE public.dq_cart_items
  ALTER COLUMN currency SET DEFAULT 'GBP';

ALTER TABLE public.dq_donations
  ALTER COLUMN currency SET DEFAULT 'GBP';
