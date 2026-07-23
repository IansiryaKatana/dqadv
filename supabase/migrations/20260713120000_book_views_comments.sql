-- Unique book views + public comments

ALTER TABLE public.dq_books
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.dq_book_views (
  book_id uuid NOT NULL REFERENCES public.dq_books(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS public.dq_book_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.dq_books(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dq_book_comments_book_id_idx
  ON public.dq_book_comments (book_id, created_at DESC);

ALTER TABLE public.dq_book_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_book_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_approved_book_comments"
  ON public.dq_book_comments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "dq_public_insert_book_comments"
  ON public.dq_book_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(author_name)) BETWEEN 1 AND 80
    AND char_length(trim(body)) BETWEEN 1 AND 2000
    AND status = 'approved'
  );

CREATE POLICY "dq_admin_all_book_comments"
  ON public.dq_book_comments
  FOR ALL
  TO authenticated
  USING (dq_is_admin())
  WITH CHECK (dq_is_admin());

CREATE POLICY "dq_admin_read_book_views"
  ON public.dq_book_views
  FOR SELECT
  TO authenticated
  USING (dq_is_admin());

GRANT SELECT ON public.dq_book_comments TO anon, authenticated;
GRANT INSERT ON public.dq_book_comments TO anon, authenticated;
GRANT ALL ON public.dq_book_comments TO authenticated;
GRANT SELECT ON public.dq_book_views TO authenticated;

CREATE OR REPLACE FUNCTION public.dq_record_book_view(p_book_id uuid, p_visitor_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_book_id IS NULL OR p_visitor_id IS NULL OR char_length(trim(p_visitor_id)) < 8 THEN
    RAISE EXCEPTION 'invalid view payload';
  END IF;

  INSERT INTO public.dq_book_views (book_id, visitor_id)
  VALUES (p_book_id, left(trim(p_visitor_id), 80))
  ON CONFLICT (book_id, visitor_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.dq_books
    SET view_count = view_count + 1,
        updated_at = now()
    WHERE id = p_book_id;
  END IF;

  SELECT view_count INTO v_count
  FROM public.dq_books
  WHERE id = p_book_id;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.dq_record_book_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_record_book_view(uuid, text) TO anon, authenticated;
