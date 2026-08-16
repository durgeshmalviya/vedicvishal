/**
 * Numerology calculations supporting both Pythagorean and Vedic systems
 * Derives meaningful numbers from a person's birth date and name
 */

export interface NumerologyProfile {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  birthDay: number;
  expression: number;
  maturity: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  descriptions: {
    lifePath: string;
    destiny: string;
    soulUrge: string;
    personality: string;
    birthDay: string;
    expression: string;
    maturity: string;
    personalYear: string;
  };
  compatibility: {
    lifePath: string[];
    destiny: string[];
  };
  years: Array<{ year: number; personalYear: number; description: string }>;
}

const VIBRATION_MAP: Record<number, string> = {
  1: "Leadership, Independence, Innovation",
  2: "Cooperation, Balance, Partnership",
  3: "Creativity, Expression, Communication",
  4: "Stability, Foundation, Order",
  5: "Freedom, Adventure, Change",
  6: "Harmony, Responsibility, Care",
  7: "Spirituality, Analysis, Wisdom",
  8: "Power, Abundance, Material",
  9: "Completion, Compassion, Idealism",
  11: "Intuition, Insight, Master Number",
  22: "Master Builder, Vision Manifested",
  33: "Master Teacher, Compassion Elevated",
};

const LIFE_PATH_DESCRIPTIONS: Record<number, string> = {
  1: "Natural leader with innovative spirit. You're driven to pioneer new paths and achieve independence. Success comes through bold action and original thinking.",
  2: "Diplomatic peacemaker sensitive to others' needs. You excel in partnerships and collaboration. Your strength lies in mediation and finding balance in relationships.",
  3: "Creative communicator with artistic talents. You thrive in self-expression and bringing joy to others. Your journey involves inspiring through words, art, or ideas.",
  4: "Practical builder creating solid foundations. You're reliable, disciplined, and organized. Success comes through steady work and establishing lasting structures.",
  5: "Free spirit drawn to adventure and experience. You learn through variety and change. Your path involves freedom, flexibility, and dynamic life experiences.",
  6: "Nurturing soul devoted to service and family. You find purpose in caring for others. Your strength is creating harmony and supporting those around you.",
  7: "Spiritual seeker on a quest for understanding. You're intuitive and analytical. Your path involves inner development, wisdom, and spiritual growth.",
  8: "Ambitious achiever in material and business realms. You have natural authority and drive. Success through strategic thinking and executive ability.",
  9: "Humanitarian with universal perspective. You care deeply about the world. Your journey is about completion, wisdom, and serving humanity.",
  11: "Visionary with heightened intuition. You have access to profound insights and spiritual awareness. Your role is to illuminate and inspire.",
  22: "Master builder manifesting grand visions. You're called to create something that lasts generations. Your potential for impact is extraordinary.",
};

const DESTINY_DESCRIPTIONS: Record<number, string> = {
  1: "You're destined to lead, innovate, and create original solutions. Embrace your pioneering nature and trust your instincts.",
  2: "Your purpose centers on bringing people together and creating balance. Develop your diplomatic and intuitive abilities.",
  3: "You're meant to express yourself creatively and uplift others through communication, art, or performance.",
  4: "Your calling is to build enduring structures—be it systems, businesses, or communities. Focus on practical mastery.",
  5: "You're destined for exploration and freedom. Use your adaptability to bring change and new perspectives.",
  6: "Your purpose is to serve, teach, and nurture. Find fulfillment in helping others and creating loving environments.",
  7: "You're called to seek truth and spiritual understanding. Your quest for knowledge will benefit many.",
  8: "You're destined for success, authority, and material achievement. Use power wisely and generously.",
  9: "Your calling is to complete cycles and serve humanity. You're meant to leave a lasting, compassionate legacy.",
  11: "You're destined to inspire and elevate consciousness. Trust your intuitive wisdom to guide others.",
  22: "You're called to manifest grand visions that benefit civilization. Your dreams can become reality.",
};

const SOUL_URGE_DESCRIPTIONS: Record<number, string> = {
  1: "Your soul yearns for independence, leadership, and personal achievement. You seek to be first and to succeed.",
  2: "Your soul desires peace, partnership, and deep connection. You seek love, harmony, and meaningful relationships.",
  3: "Your soul craves creative expression, joy, and social connection. You seek to share your gifts through communication.",
  4: "Your soul desires security, order, and solid foundations. You seek stability and a sense of belonging.",
  5: "Your soul yearns for freedom, adventure, and new experiences. You seek variety and dynamic change.",
  6: "Your soul desires to help, nurture, and care for others. You seek family, community, and meaningful service.",
  7: "Your soul seeks truth, wisdom, and spiritual connection. You crave introspection and understanding.",
  8: "Your soul desires power, success, and material abundance. You seek recognition and achievement.",
  9: "Your soul yearns for compassion, wisdom, and universal love. You seek to contribute to a better world.",
};

const BIRTH_DAY_DESCRIPTIONS: Record<number, string> = {
  1: "Born leader with innovative ideas and determination. Natural executive ability.",
  2: "Intuitive and diplomatic. Excellent mediator and team player.",
  3: "Creative and expressive. Natural communicator and entertainer.",
  4: "Practical and hardworking. Reliable and systematic.",
  5: "Adventurous and curious. Thrives on change and variety.",
  6: "Caring and responsible. Natural nurturer and counselor.",
  7: "Analytical and spiritual. Seeks depth and understanding.",
  8: "Ambitious and authoritative. Drawn to success and power.",
  9: "Compassionate and idealistic. Humanitarian at heart.",
  10: "Independent leader with natural charisma and creativity.",
  11: "Intuitive and insightful with master-level perception.",
  12: "Creative communicator with humanitarian ideals.",
  13: "Hardworking builder of lasting foundations.",
  14: "Adaptable and resourceful with business acumen.",
  15: "Creative and social with magnetic personality.",
  16: "Spiritual seeker and analytical thinker.",
  17: "Ambitious achiever with strong leadership drive.",
  18: "Compassionate humanitarian with universal vision.",
  19: "Independent pioneer with fresh perspectives.",
  20: "Intuitive partner and sensitive collaborator.",
  21: "Joyful communicator and creative expresser.",
  22: "Master builder with visionary capabilities.",
  23: "Adaptable teacher and versatile communicator.",
  24: "Harmonious nurturer and loving caregiver.",
  25: "Spiritual analyst and intuitive wisdom-seeker.",
  26: "Ambitious builder of organizations and systems.",
  27: "Compassionate idealist with global perspective.",
  28: "Peaceful harmonizer and diplomatic leader.",
  29: "Highly intuitive spiritual guide.",
  30: "Creative expressionist and joyful teacher.",
  31: "Independent achiever with leadership potential.",
};

function reduceToSingleDigit(num: number): number {
  if (num === 11 || num === 22 || num === 33) return num;
  if (num < 10) return num;
  const sum = Math.floor(num / 10) + (num % 10);
  return reduceToSingleDigit(sum);
}

function dateToNumber(dateStr: string): number {
  // dateStr format: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  let sum = year + month + day;
  return reduceToSingleDigit(sum);
}

function nameToNumber(name: string): number {
  const vowels = "AEIOUaeiou";
  const consonants = "BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz";

  const letterValues: Record<string, number> = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };

  let sum = 0;
  for (const char of name.toLowerCase()) {
    if (letterValues[char]) {
      sum += letterValues[char];
    }
  }
  return reduceToSingleDigit(sum);
}

function getCompatibleNumbers(num: number): number[] {
  const compatibility: Record<number, number[]> = {
    1: [1, 2, 3, 5, 9],
    2: [2, 4, 6, 8, 11],
    3: [1, 3, 5, 6, 9],
    4: [2, 4, 7, 8, 22],
    5: [1, 3, 5, 7, 9],
    6: [2, 3, 4, 6, 9],
    7: [2, 4, 7, 11, 22],
    8: [2, 4, 6, 8, 22],
    9: [1, 3, 5, 6, 9],
    11: [2, 7, 11, 29],
    22: [4, 7, 8, 13, 22],
    33: [6, 9, 15, 24, 33],
  };
  return compatibility[num] || [num];
}

function getYearCycle(birthDate: string, currentYear: number): Array<{ year: number; personalYear: number; description: string }> {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const years: Array<{ year: number; personalYear: number; description: string }> = [];

  const yearDescriptions: Record<number, string> = {
    1: "New beginnings. Plant seeds for future growth.",
    2: "Patience and cooperation. Build partnerships.",
    3: "Creative expression and social activity.",
    4: "Hard work and building foundations.",
    5: "Change, freedom, and new adventures.",
    6: "Responsibility, family, and service.",
    7: "Reflection, spirituality, and rest.",
    8: "Power, abundance, and recognition.",
    9: "Completion, wisdom, and new cycles ahead.",
  };

  for (let i = 0; i < 9; i++) {
    const year = currentYear + i;
    const sum = year + birthMonth + birthDay;
    const personalYear = reduceToSingleDigit(sum);
    years.push({
      year,
      personalYear,
      description: yearDescriptions[personalYear] || "Transition year",
    });
  }

  return years;
}

export function calculateNumerology(name: string, dateOfBirth: string): NumerologyProfile {
  const lifePath = dateToNumber(dateOfBirth);
  const destiny = nameToNumber(name);
  const soulUrge = nameToNumber(
    name
      .split("")
      .filter((c) => "AEIOUaeiou".includes(c))
      .join("")
  );
  const personality = nameToNumber(
    name
      .split("")
      .filter((c) => !/[aeiouAEIOU\s]/.test(c))
      .join("")
  );

  const [, , dayStr] = dateOfBirth.split("-");
  const birthDay = parseInt(dayStr);
  const birthDayReduced = reduceToSingleDigit(birthDay);

  const expression = destiny;
  const maturity = reduceToSingleDigit(lifePath + destiny);

  const currentYear = new Date().getFullYear();
  const [birthYear, birthMonth, birthDay2] = dateOfBirth.split("-").map(Number);
  const personalYearSum = currentYear + birthMonth + birthDay2;
  const personalYear = reduceToSingleDigit(personalYearSum);
  
  const currentMonth = new Date().getMonth() + 1;
  const personalMonthSum = personalYear + currentMonth;
  const personalMonth = reduceToSingleDigit(personalMonthSum);
  
  const currentDay = new Date().getDate();
  const personalDaySum = personalMonth + currentDay;
  const personalDay = reduceToSingleDigit(personalDaySum);

  const years = getYearCycle(dateOfBirth, currentYear);

  const lifePathCompatible = getCompatibleNumbers(lifePath).map(
    (n) => VIBRATION_MAP[n] || `Number ${n}`
  );
  const destinyCompatible = getCompatibleNumbers(destiny).map(
    (n) => VIBRATION_MAP[n] || `Number ${n}`
  );

  return {
    lifePath,
    destiny,
    soulUrge: reduceToSingleDigit(soulUrge),
    personality: reduceToSingleDigit(personality),
    birthDay: birthDayReduced,
    expression: reduceToSingleDigit(expression),
    maturity: maturity,
    personalYear,
    personalMonth,
    personalDay,
    descriptions: {
      lifePath: LIFE_PATH_DESCRIPTIONS[lifePath] || "Unique spiritual journey",
      destiny: DESTINY_DESCRIPTIONS[destiny] || "Special purpose awaits",
      soulUrge: SOUL_URGE_DESCRIPTIONS[reduceToSingleDigit(soulUrge)] || "Inner calling",
      personality: VIBRATION_MAP[reduceToSingleDigit(personality)] || "Unique presence",
      birthDay: BIRTH_DAY_DESCRIPTIONS[birthDayReduced] || "Unique nature",
      expression: DESTINY_DESCRIPTIONS[reduceToSingleDigit(expression)] || "Creative power",
      maturity: VIBRATION_MAP[maturity] || "Wisdom develops",
      personalYear: `Year of ${VIBRATION_MAP[personalYear] || "transformation"}`,
    },
    compatibility: {
      lifePath: lifePathCompatible,
      destiny: destinyCompatible,
    },
    years,
  };
}

export function getNumerologySignificance(num: number): string {
  return VIBRATION_MAP[num] || `Number ${num}: Unique vibration`;
}