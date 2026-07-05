const homoglyphMap: Record<string, string[]> = {
  'a': ['á', 'à', 'ä', 'â', 'ã', 'å'],
  'e': ['é', 'è', 'ë', 'ê', 'ē'],
  'i': ['í', 'ì', 'ï', 'î', 'į'],
  'o': ['ó', 'ò', 'ö', 'ô', 'õ', 'ø'],
  'u': ['ú', 'ù', 'ü', 'û', 'ū'],
  'n': ['ñ', 'ń', 'ň'],
  'c': ['ç', 'ć', 'č'],
  's': ['š', 'ś', 'ş'],
  'r': ['ř', 'ŕ'],
  'z': ['ž', 'ź', 'ż'],
  'l': ['ł', 'ľ'],
  'A': ['Á', 'À', 'Ä', 'Â', 'Ã', 'Å'],
  'E': ['É', 'È', 'Ë', 'Ê', 'Ē'],
  'I': ['Í', 'Ì', 'Ï', 'Î', 'Į'],
  'O': ['Ó', 'Ò', 'Ö', 'Ô', 'Õ', 'Ø'],
  'U': ['Ú', 'Ù', 'Ü', 'Û', 'Ū'],
  'N': ['Ñ', 'Ń', 'Ň'],
  'C': ['Ç', 'Ć', 'Č'],
  'S': ['Š', 'Ś', 'Ş'],
  'R': ['Ř', 'Ŕ'],
  'Z': ['Ž', 'Ź', 'Ż'],
  'L': ['Ł', 'Ľ'],
  '0': ['Ο', 'О', 'Օ'],
  '1': ['l', 'I', '|'],
  '2': ['Z', 'Ƨ'],
  '3': ['З', 'Э', 'Ȝ'],
  '5': ['S', 'Ş'],
};

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

export function confusableObfuscate(text: string, seed?: string): string {
  if (!text || text.length < 2) return text;

  const hash = seed ? hashCode(`${text}:${seed}`) : hashCode(text);
  const result: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const options = homoglyphMap[char];
    if (options && options.length > 0) {
      const idx = Math.abs((hash ^ (i * 7)) % (options.length + 1));
      result.push(idx === 0 ? char : options[idx - 1]);
    } else {
      result.push(char);
    }
  }

  return result.join('');
}

export function stripConfusables(text: string): string {
  const reverseMap: Record<string, string> = {};
  for (const [base, variants] of Object.entries(homoglyphMap)) {
    for (const v of variants) {
      reverseMap[v] = base;
    }
  }

  return text.split('').map(ch => reverseMap[ch] || ch).join('');
}
