CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, name text NOT NULL, tagline text NOT NULL DEFAULT 'Coder RIWI', teaches jsonb NOT NULL DEFAULT '[]', learns jsonb NOT NULL DEFAULT '[]', availability jsonb NOT NULL DEFAULT '{"days":[1,2,3,4,5],"from":"09:00","to":"17:00"}');
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profile fields for community" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE TABLE public.skillswap_state (id boolean PRIMARY KEY DEFAULT true CHECK(id), revision bigint NOT NULL DEFAULT 0, data jsonb NOT NULL DEFAULT '{"version":1,"seq":100,"activeUserId":"","profiles":{},"rescues":[],"sessions":[],"movements":[],"drafts":{}}');
GRANT ALL ON public.skillswap_state TO service_role;
ALTER TABLE public.skillswap_state ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.skillswap_compare_swap(expected bigint, replacement jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.skillswap_state SET data=replacement, revision=revision+1 WHERE id=true AND revision=expected; RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.skillswap_compare_swap(bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.skillswap_compare_swap(bigint,jsonb) TO service_role;
CREATE FUNCTION public.skillswap_new_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.profiles; BEGIN
INSERT INTO public.profiles(id,name) VALUES(NEW.id,coalesce(nullif(trim(NEW.raw_user_meta_data->>'name'),''),'Coder')) RETURNING * INTO p;
INSERT INTO public.skillswap_state(id) VALUES(true) ON CONFLICT DO NOTHING;
UPDATE public.skillswap_state SET revision=revision+1, data=jsonb_set(jsonb_set(data,'{profiles}',data->'profiles'||jsonb_build_object(NEW.id::text,jsonb_build_object('id',p.id,'name',p.name,'tagline',p.tagline,'teaches',p.teaches,'learns',p.learns,'availability',p.availability))),' {movements}'::text[],(data->'movements')||jsonb_build_array(jsonb_build_object('id','welcome-'||NEW.id,'kind','welcome','toId',NEW.id,'minutes',30,'concept','Minutos iniciales de prueba','at',floor(extract(epoch from now())*1000)))) WHERE id=true;
RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.skillswap_new_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER skillswap_profile_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.skillswap_new_profile();