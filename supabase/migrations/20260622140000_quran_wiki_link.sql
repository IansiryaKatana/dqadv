-- Point Qur'an Wiki banner (and homepage grid tiles that use its link) to quran-wiki.com

UPDATE public.dq_quran_wiki_banner
SET
  link_url = 'https://www.quran-wiki.com/',
  updated_at = now()
WHERE is_active = true;
