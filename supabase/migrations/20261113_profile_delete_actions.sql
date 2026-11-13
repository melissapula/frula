-- Gives every key that points at public.profiles a deliberate delete action (audit items 5 and 21).
--
-- These six keys had no delete action (NO ACTION), so a profile delete failed while any row still
-- named the profile. Because profiles.id cascades from auth.users, so did any auth.users delete:
-- Frula account deletion failed for anyone who had sent or received a message, and ChoreQuest
-- kid deletes failed for anyone with a Frula message. Even a seller whose rows all sit on their
-- own listings was refused, because Postgres runs the NO ACTION check before the listing cascade
-- removes those rows.
--
-- Chosen behavior: the departing user's messages, offers and viewing requests go in both
-- directions, as do their checklists, listing plans and any transaction naming them as seller.
-- A transaction where they were the buyer stays with the seller, with buyer_id set to null.
--
-- Run the pg_constraint check in MIGRATION_CHECKLIST.md step 24 before and after.

BEGIN;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey,
  ADD CONSTRAINT messages_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_seller_id_fkey,
  ADD CONSTRAINT transactions_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS transactions_buyer_id_fkey,
  ADD CONSTRAINT transactions_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.transaction_checklists
  DROP CONSTRAINT IF EXISTS transaction_checklists_user_id_fkey,
  ADD CONSTRAINT transaction_checklists_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.listing_plans
  DROP CONSTRAINT IF EXISTS listing_plans_user_id_fkey,
  ADD CONSTRAINT listing_plans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
