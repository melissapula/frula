-- =============================================
-- RLS: transactions + transaction_checklists
-- Either party (buyer or seller) can read and update
-- their shared transaction and both checklists.
-- =============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_checklists ENABLE ROW LEVEL SECURITY;

-- ----- transactions -----

DROP POLICY IF EXISTS "Parties can read transactions" ON public.transactions;
CREATE POLICY "Parties can read transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid() OR buyer_id = auth.uid());

DROP POLICY IF EXISTS "Parties can create transactions" ON public.transactions;
CREATE POLICY "Parties can create transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid() OR buyer_id = auth.uid());

DROP POLICY IF EXISTS "Parties can update transactions" ON public.transactions;
CREATE POLICY "Parties can update transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid() OR buyer_id = auth.uid())
    WITH CHECK (seller_id = auth.uid() OR buyer_id = auth.uid());

-- ----- transaction_checklists -----

DROP POLICY IF EXISTS "Parties can read both checklists" ON public.transaction_checklists;
CREATE POLICY "Parties can read both checklists"
    ON public.transaction_checklists
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_checklists.transaction_id
              AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Parties can create checklists" ON public.transaction_checklists;
CREATE POLICY "Parties can create checklists"
    ON public.transaction_checklists
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_checklists.transaction_id
              AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
        )
    );

-- Either party can update either checklist (so they can see live progress).
-- We rely on the UI to attribute completion to the correct party via completed_by.
DROP POLICY IF EXISTS "Parties can update checklists" ON public.transaction_checklists;
CREATE POLICY "Parties can update checklists"
    ON public.transaction_checklists
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_checklists.transaction_id
              AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_checklists.transaction_id
              AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
        )
    );
