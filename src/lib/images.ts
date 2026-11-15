// Site photography (Unsplash licence: free for commercial use, no attribution required).
// To swap a photo, change the URL here; next/image handles resizing and modern formats.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&q=80&w=2400`;

export const photos = {
  heroShip: {
    src: u("1703585752869-0bffd1c7709b"),
    alt: "Fully laden container ship arriving in port at dusk, with cargo cranes behind",
  },
  vaultBoxes: {
    src: u("1634224152857-69c415153d4a"),
    alt: "A key being turned in one of many steel safe deposit boxes",
  },
  vaultWall: {
    src: u("1565126035964-29e1c95b13f9"),
    alt: "Wall of steel safe deposit boxes with one drawer open",
  },
  happyCouple: {
    src: u("1655683576616-c40706fa79f2"),
    alt: "Smiling husband and wife, relaxed knowing their valuables are in safe custody",
  },
} as const;
