-- OrdainedPro ceremony reading library
-- Safe starter library for Mr. Script recommendations.

create table if not exists public.ceremony_readings (
  id text primary key,
  title text not null,
  author text not null default 'OrdainedPro',
  source text not null default '',
  category text not null,
  ceremony_types text[] not null default '{}',
  reading_text text not null,
  reading_length text not null default 'short',
  tones text[] not null default '{}',
  tags text[] not null default '{}',
  copyright_status text not null default 'original_ordainedpro',
  allowed_use_notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ceremony_readings_category_check check (
    category in (
      'bible',
      'classic_poetry',
      'original_blessing',
      'spiritual',
      'non_religious',
      'memorial',
      'family',
      'cultural',
      'unity',
      'song_placeholder'
    )
  ),
  constraint ceremony_readings_length_check check (reading_length in ('short', 'medium', 'long')),
  constraint ceremony_readings_copyright_check check (
    copyright_status in (
      'public_domain',
      'original_ordainedpro',
      'user_provided',
      'licensed',
      'placeholder_only'
    )
  )
);

alter table public.ceremony_readings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.ceremony_readings to anon, authenticated;
grant all on table public.ceremony_readings to service_role;

drop policy if exists "Active ceremony readings are readable" on public.ceremony_readings;
create policy "Active ceremony readings are readable"
  on public.ceremony_readings
  for select
  to anon, authenticated
  using (is_active = true);

create or replace function public.set_ceremony_readings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ceremony_readings_updated_at on public.ceremony_readings;
create trigger set_ceremony_readings_updated_at
  before update on public.ceremony_readings
  for each row
  execute function public.set_ceremony_readings_updated_at();

insert into public.ceremony_readings (
  id,
  title,
  author,
  source,
  category,
  ceremony_types,
  reading_text,
  reading_length,
  tones,
  tags,
  copyright_status,
  allowed_use_notes
) values
(
  'kjv-1-corinthians-13',
  'Love Is Patient',
  'King James Version',
  '1 Corinthians 13:4-8',
  'bible',
  array['wedding','vow_renewal'],
  'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; rejoiceth not in iniquity, but rejoiceth in the truth; beareth all things, believeth all things, hopeth all things, endureth all things. Charity never faileth.',
  'short',
  array['religious','traditional','romantic','formal'],
  array['love','patience','marriage','christian'],
  'public_domain',
  'KJV text is public domain in the United States. Confirm local rules for other countries.'
),
(
  'kjv-psalm-23',
  'The Lord Is My Shepherd',
  'King James Version',
  'Psalm 23',
  'bible',
  array['celebration_of_life','memorial','baby_blessing'],
  'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.',
  'medium',
  array['religious','comforting','gentle','traditional'],
  array['comfort','grief','christian','memorial'],
  'public_domain',
  'KJV text is public domain in the United States. Confirm local rules for other countries.'
),
(
  'shakespeare-sonnet-116',
  'Let Me Not to the Marriage of True Minds',
  'William Shakespeare',
  'Sonnet 116',
  'classic_poetry',
  array['wedding','vow_renewal'],
  'Let me not to the marriage of true minds admit impediments. Love is not love which alters when it alteration finds, or bends with the remover to remove. O no, it is an ever-fixed mark that looks on tempests and is never shaken.',
  'medium',
  array['romantic','classic','formal','literary'],
  array['love','steadfast','classic','poetry'],
  'public_domain',
  'Public-domain classic text.'
),
(
  'op-wedding-heart-of-the-room',
  'The Heart of the Room',
  'OrdainedPro',
  'Original OrdainedPro reading',
  'original_blessing',
  array['wedding','vow_renewal'],
  'A ceremony is not only the moment two people make promises. It is the moment everyone present is invited to remember why love matters. It asks us to pause, to witness, and to bless the life being built in front of us.',
  'short',
  array['warm','personal','non_religious','romantic'],
  array['love','witness','community','opening'],
  'original_ordainedpro',
  'Original OrdainedPro text for use inside OrdainedPro ceremonies.'
),
(
  'op-memorial-all-who-are-missed',
  'All Who Are Missed',
  'OrdainedPro',
  'Original OrdainedPro remembrance',
  'memorial',
  array['wedding','vow_renewal','celebration_of_life','memorial'],
  'Before we continue, we take a quiet moment to honor the loved ones who are not physically with us today. Their love, lessons, laughter, and memory remain part of this gathering, and part of the lives we carry forward.',
  'short',
  array['gentle','inclusive','remembrance','non_religious'],
  array['remembrance','general loved ones','memorial','inclusive'],
  'original_ordainedpro',
  'Original OrdainedPro text. Designed to avoid excluding unnamed loved ones.'
),
(
  'op-baby-blessing-welcome-child',
  'Welcome to This Circle',
  'OrdainedPro',
  'Original OrdainedPro blessing',
  'family',
  array['baby_blessing'],
  'Today we welcome this child into a circle of love. May they grow with kindness around them, courage within them, and people beside them who will teach, protect, guide, and celebrate who they are becoming.',
  'short',
  array['tender','family','spiritual','non_religious'],
  array['child','family','welcome','blessing'],
  'original_ordainedpro',
  'Original OrdainedPro text for use inside OrdainedPro ceremonies.'
),
(
  'op-coming-of-age-threshold',
  'A Threshold Moment',
  'OrdainedPro',
  'Original OrdainedPro reading',
  'family',
  array['coming_of_age'],
  'A milestone is not a finish line. It is a threshold. Today honors who you have been, who you are becoming, and the family, mentors, and community who walk beside you as your life opens into its next chapter.',
  'short',
  array['joyful','family','mentor','hopeful'],
  array['coming of age','family','future','mentor'],
  'original_ordainedpro',
  'Original OrdainedPro text for use inside OrdainedPro ceremonies.'
),
(
  'op-unity-candle',
  'Unity Candle Reflection',
  'OrdainedPro',
  'Original OrdainedPro unity reading',
  'unity',
  array['wedding','vow_renewal','family'],
  'The lighting of this candle is a simple act with a lasting meaning. Two flames remain themselves, yet together they create one shared light, a symbol of the life, home, and future being formed here today.',
  'short',
  array['warm','symbolic','romantic','family'],
  array['unity candle','symbolic','ritual'],
  'original_ordainedpro',
  'Original OrdainedPro text for use inside OrdainedPro ceremonies.'
),
(
  'song-lyrics-placeholder',
  'Song Lyric Placement',
  'User-provided or licensed lyrics',
  'Copyrighted song lyrics placeholder',
  'song_placeholder',
  array['wedding','vow_renewal','celebration_of_life','memorial','coming_of_age'],
  '[Insert the couple''s selected song lyric or song reading here only if they provide the text and have permission to use it. Mr. Script can write original transition wording before and after the song moment.]',
  'short',
  array['music','custom','copyright-safe'],
  array['song','lyrics','permission','placeholder'],
  'placeholder_only',
  'Do not generate full copyrighted song lyrics. Use only user-provided or licensed text.'
)
on conflict (id) do update set
  title = excluded.title,
  author = excluded.author,
  source = excluded.source,
  category = excluded.category,
  ceremony_types = excluded.ceremony_types,
  reading_text = excluded.reading_text,
  reading_length = excluded.reading_length,
  tones = excluded.tones,
  tags = excluded.tags,
  copyright_status = excluded.copyright_status,
  allowed_use_notes = excluded.allowed_use_notes,
  is_active = true,
  updated_at = now();
