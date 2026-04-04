CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

CREATE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (first_name, last_name, user_id)
        VALUES (
          new.raw_user_meta_data ->> 'first_name',
          new.raw_user_meta_data ->> 'last_name',
          new.id
        );
    RETURN new;
END;
$$;


CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE create_profile_for_new_user();
