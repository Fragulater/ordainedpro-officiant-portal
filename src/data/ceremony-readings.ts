// Ceremony Readings Collection
// Each reading includes metadata for smart matching with ceremony style

export interface CeremonyReading {
  id: string;
  title: string;
  author: string;
  category: "religious" | "poetry" | "modern" | "humorous" | "cultural";
  text: string;
  length: "short" | "medium";
  tone: string[];
}

export const READING_CATEGORIES = [
  { value: "none", label: "No Reading" },
  { value: "religious", label: "Religious/Spiritual" },
  { value: "poetry", label: "Classic Poetry" },
  { value: "modern", label: "Modern/Secular" },
  { value: "humorous", label: "Lighthearted" },
  { value: "cultural", label: "Cultural Blessings" },
] as const;

export const CEREMONY_READINGS: CeremonyReading[] = [
  // Religious
  {
    id: "rel-1",
    title: "1 Corinthians 13:4-8",
    author: "The Bible",
    category: "religious",
    text: `Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres. Love never fails.`,
    length: "short",
    tone: ["traditional", "formal", "romantic"],
  },
  {
    id: "rel-2",
    title: "Ecclesiastes 4:9-12",
    author: "The Bible",
    category: "religious",
    text: `Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up. Also, if two lie down together, they will keep warm. But how can one keep warm alone? Though one may be overpowered, two can defend themselves. A cord of three strands is not quickly broken.`,
    length: "short",
    tone: ["traditional", "formal"],
  },

  // Classic Poetry
  {
    id: "poetry-1",
    title: "Sonnet 116",
    author: "William Shakespeare",
    category: "poetry",
    text: `Let me not to the marriage of true minds
Admit impediments. Love is not love
Which alters when it alteration finds,
Or bends with the remover to remove.
O no! it is an ever-fixed mark
That looks on tempests and is never shaken;
It is the star to every wandering bark,
Whose worth's unknown, although his height be taken.
Love's not Time's fool, though rosy lips and cheeks
Within his bending sickle's compass come;
Love alters not with his brief hours and weeks,
But bears it out even to the edge of doom.
If this be error and upon me proved,
I never writ, nor no man ever loved.`,
    length: "medium",
    tone: ["romantic", "formal", "traditional"],
  },
  {
    id: "poetry-2",
    title: "How Do I Love Thee?",
    author: "Elizabeth Barrett Browning",
    category: "poetry",
    text: `How do I love thee? Let me count the ways.
I love thee to the depth and breadth and height
My soul can reach, when feeling out of sight
For the ends of being and ideal grace.
I love thee to the level of every day's
Most quiet need, by sun and candle-light.
I love thee freely, as men strive for right.
I love thee purely, as they turn from praise.
I love thee with the passion put to use
In my old griefs, and with my childhood's faith.
I love thee with a love I seemed to lose
With my lost saints. I love thee with the breath,
Smiles, tears, of all my life; and, if God choose,
I shall but love thee better after death.`,
    length: "medium",
    tone: ["romantic", "passionate"],
  },

  // Modern/Secular
  {
    id: "modern-1",
    title: "The Art of Marriage",
    author: "Wilferd Arlan Peterson",
    category: "modern",
    text: `Happiness in marriage is not something that just happens. A good marriage must be created. In the art of marriage, the little things are the big things. It is never being too old to hold hands. It is remembering to say "I love you" at least once a day. It is never going to sleep angry. It is having a mutual sense of values and common objectives. It is standing together facing the world. It is forming a circle of love that gathers in the whole family. It is speaking words of appreciation and demonstrating gratitude in thoughtful ways. It is having the capacity to forgive and forget. It is giving each other an atmosphere in which each can grow.`,
    length: "medium",
    tone: ["warm", "personal", "modern"],
  },
  {
    id: "modern-2",
    title: "Union",
    author: "Robert Fulghum",
    category: "modern",
    text: `You have known each other from the first glance of acquaintance to this point of commitment. At some point, you decided to marry. From that moment of yes, to this moment of yes, indeed, you have been making commitments in an informal way. All of those conversations that were held in a car, or over a meal, or during long walks—all those conversations that began with, "When we're married," and continued with "I will" and "you will" and "we will"—all those late-night talks that included "someday" and "somehow" and "maybe"—and all those promises that are unspoken matters of the heart. All these common things, and more, are the real process of a wedding.`,
    length: "medium",
    tone: ["warm", "personal", "intimate"],
  },

  // Humorous/Lighthearted
  {
    id: "humor-1",
    title: "A Lovely Love Story",
    author: "Edward Monkton",
    category: "humorous",
    text: `The fierce Dinosaur was trapped inside his cage of ice. Although it was cold he was happy in there. It was, after all, parsing home. Then along came the Lovely Other Dinosaur. The Lovely Other Dinosaur melted the Dinosaur's cage with kind words and loving thoughts. "I like this Dinosaur," thought the Lovely Other Dinosaur. "Although he is fierce he is also許 許gentile and he is funny and he is funtimes. And together they were the best of friends. And more. Much more.`,
    length: "short",
    tone: ["fun", "casual", "lighthearted"],
  },
  {
    id: "humor-2",
    title: "Yes, I'll Marry You",
    author: "Pam Ayres",
    category: "humorous",
    text: `Yes, I'll marry you, my dear, and here's the reason why:
So I can push you out of bed when the baby starts to cry.
And if we hear a knocking and it's creepy and it's late,
I hand you the torch, you see, and you investigate.
Yes, I'll marry you, my dear, you may not apprehend it,
But when the tumble dryer goes, it's you that has to mend it.
You have to face the neighbor should our dog attack his cat,
And if a Jehovah's Witness calls, then you can see to that.
Yes, I'll marry you, you're virile and you're lean,
My house is like a pigsty; you can help to keep it clean.
That sexy little dinner which you served by candlelight,
As I do chipmunk, you can cook it every night!`,
    length: "medium",
    tone: ["fun", "casual", "humorous"],
  },

  // Cultural
  {
    id: "cultural-1",
    title: "Apache Wedding Blessing",
    author: "Traditional Apache",
    category: "cultural",
    text: `Now you will feel no rain, for each of you will be shelter for the other. Now you will feel no cold, for each of you will be warmth to the other. Now there will be no loneliness, for each of you will be companion to the other. Now you are two persons, but there is only one life before you. May beauty surround you both in the journey ahead and through all the years. May happiness be your companion and your days together be good and long upon the earth.`,
    length: "short",
    tone: ["spiritual", "warm", "traditional"],
  },
  {
    id: "cultural-2",
    title: "Irish Wedding Blessing",
    author: "Traditional Irish",
    category: "cultural",
    text: `May the road rise to meet you. May the wind be always at your back. May the sun shine warm upon your face, the rains fall soft upon your fields. And until we meet again, may God hold you in the palm of his hand. May you have love that never ends, lots of money, and lots of friends. Health be yours, whatever you do, and may God send many blessings to you.`,
    length: "short",
    tone: ["warm", "blessing", "traditional"],
  },
];

// Helper function to get readings by category
export const getReadingsByCategory = (category: string): CeremonyReading[] => {
  if (category === "none") return [];
  return CEREMONY_READINGS.filter((r) => r.category === category);
};

// Helper function to get a random reading from a category
export const getRandomReading = (category: string): CeremonyReading | null => {
  const readings = getReadingsByCategory(category);
  if (readings.length === 0) return null;
  return readings[Math.floor(Math.random() * readings.length)];
};
