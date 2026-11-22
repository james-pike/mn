// Electrical portal: approved names. An Electrical order whose name isn't on
// this list still goes through, but is flagged with a note on the order in the
// cm-admin panel. Server-side only (imported by the order action).
//
// Matching ignores case, accents, punctuation and extra spaces, and allows one
// small typo (a swapped, missing, extra or wrong letter) so "jason tomlinson"
// matches "Jaosn Tomlinson". A single-name entry ("Bogdan") matches that first
// or last name with any other name.
export const ELECTRICAL_ROSTER: string[] = [
  "Andrew Fadalti",
  "Peter Noris",
  "Mike Iafrate",
  "Aaron Brown",
  "Leighton Tomlinson",
  "Jaosn Tomlinson",
  "Jakub Szczepanek",
  "Kyle Henderson",
  "Paul Snyder",
  "Matthew Du",
  "David Wheelan",
  "Raymond Samuels",
  "Dennis Duran",
  "Andrew Shillinglaw",
  "Allan Seigel",
  "Kadeem Robin",
  "Isaiah Ramirez",
  "Allen Cummings",
  "Brian Lawlor",
  "Adam Borg",
  "Bogdan",
  "Alessandro Palacios",
  "Adrian Mongillo",
  "Marc Sampogna",
  "Paul Figueiredo",
  "Dennis Kupinsy",
  "Daniel Semaan",
  "Nathan Sachse",
  "Greg Canepa",
  "John Stevens",
  "Graham Buttler",
  "Darryl Gisby",
  "Jayden Sandhu",
  "Daniel Marchese",
  "Ben Rodgers",
  "Brandon Jacks",
  "Armand Mizal",
  "Derek Johnston",
  "Suleiman Babiker",
  "Evan Damaren",
];

export const ELECTRICAL_ROSTER_NOTE = "⚠ Name not on Electrical approved list";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

// Damerau–Levenshtein (optimal string alignment) distance.
const dist = (a: string, b: string): number => {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
};
const close = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 4 && dist(a, b) <= 1);

/** Is this order name on the Electrical approved list? First and last names
 *  are compared separately (one typo allowed in each name of 4+ letters; short
 *  names must match exactly); extra middle names / suffixes are ignored. */
export const isApprovedElectricalName = (name: string): boolean => {
  const parts = norm(name).split(" ").filter(Boolean);
  if (!parts.length) return false;
  return ELECTRICAL_ROSTER.some((entry) => {
    const e = norm(entry).split(" ");
    if (e.length === 1) return parts.some((p) => close(p, e[0])); // single-name entry
    const [ef, el] = [e[0], e[e.length - 1]];
    return close(parts[0], ef) && parts.slice(1).some((p) => close(p, el));
  });
};
