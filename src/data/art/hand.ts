/** 手画的像素图（不经 tools/pixelgen.py）：顶栏的金币和心，霜潮专属的三个敌人（法师白袍、乌鸦深紫羽，和其他霜潮敌人用副色分开） / Hand-drawn pixel art (not via tools/pixelgen.py): the top-bar coin and heart, and the three Frost Tide exclusives (the mage in white robes and the crow in deep-violet feathers, set apart from the other Frost Tide foes by secondary colors) */
export const HAND_SPRITES: Record<string, string[]> = {
 "coin": [
  "..kkkk..",
  ".kyYYyk.",
  "kyYwYyyk",
  "kyYYyyyk",
  "kyYyyyyk",
  "kyyyyynk",
  ".kynnnk.",
  "..kkkk.."
 ],
 "heart": [
  ".kk..kk.",
  "kRRkkRRk",
  "kRwRRRRk",
  "kRRRRRRk",
  ".kRRRRk.",
  "..kRRk..",
  "...kk...",
  "........"
 ],
 "f_crow": [
  "................",
  "Ck............kC",
  "kCCk........kCCk",
  "kACCk......kCCAk",
  ".kAACk....kCAAk.",
  ".kaAACkkkkCAAak.",
  "..kaAAaaaaAAak..",
  "..kdaAaaaaAadk..",
  "...kdaaaaaadk...",
  "....kawaawak....",
  "....kdaaaadk....",
  ".....kkYYkk.....",
  "......kYYk......",
  ".......kk.......",
  "................",
  "................"
 ],
 "f_shell": [
  "................",
  "................",
  ".......kk.......",
  ".....kkwwkk.....",
  "....kCwCCwCk....",
  "...kCwCCCCwCk...",
  "kk.kcCCccCCck.kk",
  "kCkkcCcCCcCckkCk",
  "kckdbccbbccbdkck",
  ".kkkdbbddbbdkkk.",
  "..kbkkkkkkkkbk..",
  "..kbwkbbbbkwbk..",
  "...kbbbbbbbbk...",
  "..kbkdbkkbdkbk..",
  "..kk.kk..kk.kk..",
  "................"
 ],
 "f_mage": [
  "............kk..",
  "......kk...kCCk.",
  ".....kCCk..kCwk.",
  "....kCwCwk..kCk.",
  "...kCCwwwgk.knk.",
  "..kCwgkkkggkknk.",
  "..kwgkCkCkgkknk.",
  "..kwgkkkkkgkgnk.",
  ".kwgggkkkggwggk.",
  ".kwggwggggwgknk.",
  ".kggwgggggwgknk.",
  "kggwgggggggwgknk",
  "ksgwgggggggwsknk",
  "kssggggggggssknk",
  ".kkkkkkkkkkkk.k.",
  "................"
 ]
};

/** 4×6 像素数字（战场飘字用）：3 与 8 形状区分明显 / 4×6 pixel digits (for battlefield floating text): 3 and 8 are clearly distinct */
export const DIG: Record<string, string> = {
 "0": "011010011001100110010110",
 "1": "001001100010001000100111",
 "2": "011010010001001001001111",
 "3": "111000010110000100011110",
 "4": "001101011001111100010001",
 "5": "111110001110000100011110",
 "6": "011010001110100110010110",
 "7": "111100010010010001000100",
 "8": "011010010110100110010110",
 "9": "011010011001011100010110",
 "k": "100010011010110010101001",
 "!": "010001000100010000000100",
 "+": "000001001110010000000000",
 "-": "000000001111000000000000",
 "x": "000010010110011010010000"
};
