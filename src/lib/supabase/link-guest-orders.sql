-- Trigger to link guest orders to user accounts upon registration
CREATE OR REPLACE FUNCTION public.fn_link_guest_orders() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.orders
SET user_id = NEW.id
WHERE customer_email = NEW.email
    AND user_id IS NULL;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS tr_link_guest_orders ON public.profiles;
CREATE TRIGGER tr_link_guest_orders
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_link_guest_orders();