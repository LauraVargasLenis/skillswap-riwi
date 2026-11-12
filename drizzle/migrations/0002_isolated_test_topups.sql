CREATE TABLE public.skillswap_test_state (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 revision bigint NOT NULL DEFAULT 0,
 data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.skillswap_test_state TO service_role;
ALTER TABLE public.skillswap_test_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.skillswap_test_compare_swap(test_id uuid, expected bigint, replacement jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.skillswap_test_state SET data = replacement, revision = revision + 1 WHERE id = test_id AND revision = expected;
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.skillswap_test_compare_swap(uuid,bigint,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.skillswap_test_compare_swap(uuid,bigint,jsonb) TO service_role;
COMMENT ON TABLE public.skillswap_test_state IS 'Isolated per-browser test environment: simulated topup statuses and ledger atomically persisted; never touches real account balances.';