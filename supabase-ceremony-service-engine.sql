-- Ceremony Type Engine service knowledge base
-- Run this in Supabase SQL Editor after reviewing seed data.
-- The explicit GRANT statements keep these tables available through the Data API
-- after Supabase's public schema grant changes.

create table if not exists public.ceremony_service_types (
  id text primary key,
  category text not null,
  display_name text not null,
  short_name text not null,
  description text not null,
  sensitivity text not null check (sensitivity in ('celebratory', 'grief', 'neutral')),
  legal_status text not null check (legal_status in ('yes', 'no', 'possibly', 'writing_only')),
  grief_related boolean not null default false,
  writing_only boolean not null default false,
  religious_or_cultural text not null default 'optional' check (religious_or_cultural in ('optional', 'required', 'no')),
  virtual_available text not null default 'depends' check (virtual_available in ('yes', 'no', 'depends', 'writing_only')),
  can_be_writing_only boolean not null default false,
  aliases jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  user_phrases jsonb not null default '[]'::jsonb,
  tone_options jsonb not null default '[]'::jsonb,
  tone_rules jsonb not null default '[]'::jsonb,
  required_questions jsonb not null default '[]'::jsonb,
  optional_questions jsonb not null default '[]'::jsonb,
  story_prompts jsonb not null default '[]'::jsonb,
  intake_question_groups jsonb not null default '[]'::jsonb,
  output_types jsonb not null default '[]'::jsonb,
  script_sections jsonb not null default '[]'::jsonb,
  officiant_requirements jsonb not null default '[]'::jsonb,
  client_facing_description text,
  price_field text,
  default_duration text,
  travel_required text not null default 'depends' check (travel_required in ('yes', 'no', 'depends')),
  suggested_checklist jsonb not null default '[]'::jsonb,
  admin_service_tags jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ceremony_service_types_category_idx
  on public.ceremony_service_types (category);

create index if not exists ceremony_service_types_active_idx
  on public.ceremony_service_types (is_active);

create index if not exists ceremony_service_types_keywords_gin_idx
  on public.ceremony_service_types using gin (keywords);

alter table public.ceremony_service_types enable row level security;

drop policy if exists "Anyone can read active ceremony service types" on public.ceremony_service_types;
create policy "Anyone can read active ceremony service types"
  on public.ceremony_service_types
  for select
  using (is_active = true);

-- Tight write access by default. Use service role/server code for admin edits.
drop policy if exists "Authenticated users cannot directly edit ceremony service types" on public.ceremony_service_types;
create policy "Authenticated users cannot directly edit ceremony service types"
  on public.ceremony_service_types
  for all
  to authenticated
  using (false)
  with check (false);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.ceremony_service_types to anon, authenticated;
grant all on public.ceremony_service_types to service_role;

create or replace function public.update_ceremony_service_types_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_ceremony_service_types_updated_at on public.ceremony_service_types;
create trigger update_ceremony_service_types_updated_at
  before update on public.ceremony_service_types
  for each row
  execute function public.update_ceremony_service_types_updated_at();

insert into public.ceremony_service_types (
  id,
  category,
  display_name,
  short_name,
  description,
  sensitivity,
  legal_status,
  grief_related,
  writing_only,
  religious_or_cultural,
  virtual_available,
  can_be_writing_only,
  aliases,
  keywords,
  user_phrases,
  tone_options,
  tone_rules,
  required_questions,
  optional_questions,
  story_prompts,
  output_types,
  script_sections,
  officiant_requirements,
  client_facing_description,
  price_field,
  default_duration,
  travel_required,
  suggested_checklist,
  admin_service_tags
) values
(
  'wedding',
  'Marriage & Relationship Ceremonies',
  'Wedding Ceremony',
  'Wedding',
  'A legal or symbolic wedding ceremony script built around the couple, their promises, vows, rings, tone, traditions, and guests.',
  'celebratory',
  'possibly',
  false,
  false,
  'optional',
  'depends',
  false,
  '["legal wedding ceremony","civil ceremony","religious wedding","spiritual wedding","non-religious wedding","commitment ceremony","handfasting"]',
  '["wedding","marry","marriage","ceremony","vows","rings","interfaith","bilingual wedding","destination wedding","hospital wedding","jail wedding","bedside wedding"]',
  '["I need someone to marry us","We are getting married","We need a wedding officiant","We want a non-religious ceremony"]',
  '["Formal and Traditional","Warm and Personal","Light and Joyful","Intimate and Romantic","Fun and Casual","Cultural or Interfaith"]',
  '["Ask whether the ceremony is legal or symbolic before using legal pronouncement language.","Do not assume religion, gender roles, or family structure."]',
  '["What are the couple''s names?","Is this legal, symbolic, religious, spiritual, cultural, or non-religious?","Will the couple exchange vows?","Will there be a ring exchange?"]',
  '["Should loved ones be honored or remembered?","Should a unity ceremony be included?","Are there any readings, prayers, or cultural traditions?","Should family members, children, or guests be included?"]',
  '["How they first met and first impressions","Favorite memories or funny moments","Milestones, proposal, family, challenges, and future hopes"]',
  '["ceremony_script","ceremony_outline","vow_wording","reading_suggestions","checklist"]',
  '["Processional","Welcome","Reflection","Declaration of Intent","Vows","Rings","Pronouncement","Recessional"]',
  '["Confirm local marriage-law requirements.","Confirm whether the couple has a valid marriage license when legal solemnization is requested."]',
  'A personalized wedding ceremony service for legal or symbolic celebrations.',
  'wedding_ceremony_fee',
  '15-30 minutes',
  'depends',
  '["Confirm ceremony date, time, and venue","Confirm legal or symbolic status","Collect vows, ring, unity, and remembrance preferences"]',
  '["wedding","legal_possible","relationship"]'
),
(
  'coming_of_age',
  'Coming-of-Age Ceremonies',
  'Coming-of-Age Ceremony',
  'Coming-of-Age',
  'A family-centered milestone ceremony such as a Quinceanera, sweet sixteen, graduation blessing, youth blessing, or rite of passage.',
  'celebratory',
  'no',
  false,
  false,
  'optional',
  'yes',
  false,
  '["Quinceanera Ceremony","Sweet Sixteen Ceremony","Rite of Passage","Graduation Blessing","Youth Blessing"]',
  '["quinceanera","quince","sweet sixteen","sweet 16","coming of age","15th birthday","daughter turning 15","rite of passage","graduation blessing"]',
  '["My daughter is turning 15","We need a quince blessing","We need a sweet sixteen ceremony","We want a coming-of-age ceremony"]',
  '["Joyful and Family-Centered","Traditional","Spiritual","Cultural","Bilingual","Light and Warm"]',
  '["Honor the honoree without infantilizing them.","Ask about faith, language, and cultural traditions before including them."]',
  '["What is the honoree''s name?","What milestone is being celebrated?","Should the ceremony feel religious, spiritual, cultural, non-religious, or bilingual?","Which family members or mentors should be mentioned?"]',
  '["Should traditions like candle, crown, shoe, Bible, rosary, parent blessing, or court of honor be included?","Should grandparents, godparents, or siblings have speaking moments?"]',
  '["The honoree''s personality, values, talents, and interests","Family members, mentors, or friends who helped shape them","Future hopes such as college, career, travel, goals, or adulthood"]',
  '["ceremony_script","family_blessing","parent_speech","bilingual_welcome","ceremony_outline"]',
  '["Welcome","Meaning of the Milestone","Family Recognition","Traditions","Blessing","Closing"]',
  '[]',
  'A milestone ceremony for Quinceaneras, sweet sixteen celebrations, graduations, or youth blessings.',
  'coming_of_age_fee',
  '15-30 minutes',
  'depends',
  '["Collect honoree and parent names","Confirm tradition list","Confirm language preference","Confirm family blessing roles"]',
  '["quinceanera","coming_of_age","family"]'
),
(
  'celebration_of_life',
  'Memorial, Funeral & Grief Ceremonies',
  'Celebration of Life or Memorial',
  'Celebration of Life',
  'A gentle remembrance script for a funeral, wake, memorial, graveside service, or celebration of life.',
  'grief',
  'no',
  true,
  false,
  'optional',
  'yes',
  true,
  '["wake officiant","funeral service","memorial service","graveside service","ash scattering","vigil"]',
  '["funeral","memorial","celebration of life","wake","graveside","passed away","loss","died","eulogy","remembrance","ashes","vigil"]',
  '["My father passed away","We need someone to speak at the wake","We need a graveside service"]',
  '["Gentle and Comforting","Solemn","Hopeful","Celebration of Life","Spiritual","Non-Religious"]',
  '["Express condolences before asking logistical questions.","Use gentle, compassionate language.","Do not sound salesy or overly cheerful.","Do not assume religious beliefs."]',
  '["What was your loved one''s name?","What relationship should the service honor?","Should the service feel religious, spiritual, non-religious, or celebration-of-life?","Are there stories, readings, songs, prayers, or speakers to include?"]',
  '["Is there anything the family wants avoided?","Should the tone include humor, gratitude, hope, or quiet reflection?","Will this include burial, cremation, ashes, or a graveside moment?"]',
  '["The kind of person they were and how people experienced them","What they loved: family, work, hobbies, faith, service, or simple joys","Favorite stories, lessons, legacy, and what they leave behind"]',
  '["memorial_script","wake_opening_words","eulogy","graveside_service","closing_blessing","celebration_of_life_outline"]',
  '["Words of Condolence","Welcome","Life Tribute","Readings or Music","Reflection","Closing Words"]',
  '[]',
  'A compassionate service for families gathering to remember, honor, and celebrate someone who has passed away.',
  'memorial_service_fee',
  '10-30 minutes',
  'depends',
  '["Confirm service location and time","Collect life story notes","Confirm speakers, readings, music, and prayers","Ask family what should be avoided"]',
  '["funeral","wake","memorial","celebration_of_life","grief"]'
),
(
  'pet_memorial',
  'Memorial, Funeral & Grief Ceremonies',
  'Pet Memorial',
  'Pet Memorial',
  'A gentle remembrance ceremony or written tribute for a beloved pet, companion animal, or family animal memorial.',
  'grief',
  'no',
  true,
  false,
  'optional',
  'yes',
  true,
  '["pet funeral","dog memorial","cat memorial","animal memorial","pet tribute","pet remembrance"]',
  '["pet memorial","pet funeral","dog passed","cat passed","my dog died","my cat died","beloved pet","animal memorial","pet tribute"]',
  '["My dog passed away","My cat died","We want to remember our pet","We need words for a pet memorial"]',
  '["Gentle and Comforting","Warm and Grateful","Family-Centered","Non-Religious","Spiritual"]',
  '["Treat the pet as a meaningful family relationship.","Use gentle, compassionate language without minimizing the loss."]',
  '["What was the pet''s name?","What kind of pet or companion animal are they remembering?","Who should be included in the remembrance?","Should the tone be spiritual, non-religious, gentle, hopeful, or celebration-of-life?"]',
  '["Are there favorite memories, habits, nicknames, or places to include?","Will there be a burial, ashes, photo table, candle, or keepsake moment?"]',
  '["The pet''s name, personality, favorite habits, and quirks","How the family found or adopted them","Favorite memories, places, routines, and the comfort they brought"]',
  '["pet_memorial_script","pet_tribute","closing_blessing","family_reading","memorial_outline"]',
  '["Words of Sympathy","Welcome","Pet Life Tribute","Family Reflection","Remembrance Moment","Closing Words"]',
  '[]',
  'A tender remembrance service or tribute for a beloved pet.',
  'pet_memorial_fee',
  '5-15 minutes',
  'depends',
  '["Collect pet name and story","Confirm remembrance setting","Ask about children or family speakers","Confirm burial, ashes, candle, or keepsake details"]',
  '["pet_memorial","grief","tribute","writing_optional"]'
),
(
  'custom_life_ceremony',
  'Custom Life Ceremonies',
  'Custom Life Ceremony',
  'Custom Life Ceremony',
  'A personalized ceremony for a meaningful transition, remembrance, blessing, healing moment, new beginning, chosen family moment, or community milestone.',
  'neutral',
  'no',
  false,
  false,
  'optional',
  'yes',
  true,
  '["custom ceremony","life ceremony","chosen family ceremony","name change ceremony","gender affirmation ceremony","ancestor remembrance","garden blessing"]',
  '["custom","life ceremony","blessing","transition","new beginning","healing","honor","remember","ritual","chosen family","name change","gender affirmation","ancestor","garden","moving on"]',
  '["I do not know what this is called","We want to honor my grandma''s garden","We want a ceremony for our chosen family","We want a positive divorce ceremony"]',
  '["Symbolic","Spiritual","Non-Religious","Healing","Celebratory","Reflective"]',
  '["Ask whether the ceremony is meant to celebrate, honor, remember, bless, heal, or mark a transition.","Do not assume religion, culture, or legal meaning."]',
  '["What life moment should this ceremony mark?","Is it meant to celebrate, honor, remember, bless, heal, or mark a transition?","Should it feel spiritual, religious, cultural, symbolic, or non-religious?","Who should be included or named?"]',
  '["Should there be a reading, symbolic action, candle, object, blessing, or community response?","Is there anything that should be avoided?"]',
  '["The life moment, transition, or milestone being marked","Who is being honored, included, remembered, blessed, or supported","Stories, values, symbols, traditions, or objects that matter"]',
  '["custom_ceremony_script","ceremony_outline","symbolic_action_wording","blessing","intake_questionnaire"]',
  '["Welcome","Meaning of the Moment","Story or Reflection","Symbolic Action","Blessing","Closing"]',
  '[]',
  'A personalized ceremony created around a meaningful life transition, blessing, remembrance, or milestone.',
  'custom_life_ceremony_fee',
  '10-30 minutes',
  'depends',
  '["Clarify ceremony purpose","Confirm tone and people involved","Confirm symbols, readings, objects, or rituals","Confirm boundaries and avoidances"]',
  '["custom","life_ceremony","symbolic","milestone"]'
)
on conflict (id) do update set
  category = excluded.category,
  display_name = excluded.display_name,
  short_name = excluded.short_name,
  description = excluded.description,
  sensitivity = excluded.sensitivity,
  legal_status = excluded.legal_status,
  grief_related = excluded.grief_related,
  writing_only = excluded.writing_only,
  religious_or_cultural = excluded.religious_or_cultural,
  virtual_available = excluded.virtual_available,
  can_be_writing_only = excluded.can_be_writing_only,
  aliases = excluded.aliases,
  keywords = excluded.keywords,
  user_phrases = excluded.user_phrases,
  tone_options = excluded.tone_options,
  tone_rules = excluded.tone_rules,
  required_questions = excluded.required_questions,
  optional_questions = excluded.optional_questions,
  story_prompts = excluded.story_prompts,
  output_types = excluded.output_types,
  script_sections = excluded.script_sections,
  officiant_requirements = excluded.officiant_requirements,
  client_facing_description = excluded.client_facing_description,
  price_field = excluded.price_field,
  default_duration = excluded.default_duration,
  travel_required = excluded.travel_required,
  suggested_checklist = excluded.suggested_checklist,
  admin_service_tags = excluded.admin_service_tags,
  is_active = true,
  updated_at = now();
