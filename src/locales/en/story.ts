/* migrated from the old data format; edit here directly */
export default {
 "campLine": "By the fire, an old soldier feeds in another log: “I only know a few tricks of the watch. Pick one?”",
 "secretKarl": {
  "die": "…This sword. Ayla, mine — it's stuck in the dirt at the foot of the Wall.",
  "hero": "Karl, I'll keep your sword for you."
 },
 "secretLetter": "Ying:<br>You remember the lampwright's rule — the lamp must not go out, and neither may you.<br>I'm somewhere very dark, but I can hear the bell, so I know you're still lighting lamps.<br>I wound the last bar of the music box for you. When dawn comes, play it for me yourself.<br><span>— Master</span>",
 "secretBank": "The clerk looks up.<br>“Seven. Seven hundred years, and at last someone walks in with exactly seven coins.”<br>“Greyrobe left a deposit here when he was young. Said he'd collect it at dawn. He never came.”<br>“The interest alone could buy the whole Academy by now. Tell me — did he ever mean for dawn to come?”",
 "prologue": [
  {
   "who": "narr",
   "t": "The Long Night, year seven hundred. The sun has not risen since, and in the north the Abyss has opened its eye."
  },
  {
   "who": "narr",
   "t": "Dawnbell is the last city with its lamps still lit. Beyond it stand only a Wall and the watchers who will not leave."
  },
  {
   "who": "hero",
   "t": "@intro"
  }
 ],
 "win": [
  {
   "who": "narr",
   "t": "The eye closes. From the rift in the north seeps a thread of pale grey light."
  },
  {
   "who": "narr",
   "t": "For the first time in seven hundred years, Dawnbell's bell rings in the morning."
  },
  {
   "who": "hero",
   "t": {
    "ayla": "Karl, it's dawn. Can you see it?",
    "mo": "The light's composition matches my figures exactly. Next time, I light the whole sky.",
    "ying": "Every lamp in the city is still lit. Master, can you see? It's dawn.",
    "jun": "The Wall still stands. My father laid this stretch. It's dawn — time to check for cracks.",
    "li": "The northern star is back. Tonight the starkeepers' record can be filled."
   }
  }
 ],
 "lose": [
  {
   "who": "narr",
   "t": "The Wall fell louder than any bell."
  },
  {
   "who": "hero",
   "t": {
    "ayla": "…I'm sorry. Give me one more chance.",
    "mo": "Experiment failed. Recalculate. Again.",
    "ying": "The lamp… went out. But the wick's still there. It'll light next time.",
    "jun": "The Wall… didn't hold. Next time I sink the footing three feet deeper.",
    "li": "The star chart's in disarray. Next time, my reckoning will be truer."
   }
  }
 ],
 "nights": [
  {
   "title": "Night 1 · Slime Beyond the Wall",
   "beats": [
    [
     1,
     "narr",
     "Dusk has barely passed, and the marsh beyond the Wall begins to writhe."
    ],
    [
     5,
     "soldier",
     {
      "ayla": "They're crawling in! Captain… is this all of us?",
      "mo": "They're crawling in! Alchemist, have you got enough bottles?",
      "ying": "They're crawling in! Miss Ying, get behind me!",
      "jun": "They're crawling in! Master Jun, will the Wall hold?",
      "li": "They're crawling in! Miss Li, what do the stars say?"
     }
    ],
    [
     9,
     "hero",
     {
      "ayla": "It's enough. Everyone on this Wall counts.",
      "mo": "Fewer people, fewer variables. Good.",
      "ying": "First night? Don't be scared. I've lit every lamp.",
      "jun": "It'll hold. Eighteen years I've laid this Wall. I know every loose brick.",
      "li": "The stars are calm tonight. Calm nights need the most care."
     }
    ],
    [
     24,
     "bellman",
     "The bell's still ringing! The whole city's watching us from their windows!"
    ]
   ]
  },
  {
   "title": "Night 2 · Powder Underground",
   "beats": [
    [
     1,
     "narr",
     "Wingbeats drown out the bell. Beneath the ground, something is digging."
    ],
    [
     8,
     "soldier",
     "Rats hauling powder kegs! Who taught them to mix powder?"
    ],
    [
     12,
     "hero",
     {
      "ayla": "Blow them apart. Don't let them reach the Wall's foot.",
      "mo": "That powder recipe… those are Academy ratios.",
      "ying": "There's a sound underground… like rusty gears.",
      "jun": "They're digging at the footing. The east stretch — shallowest foundation.",
      "li": "Powder underground… that's not on the star chart."
     }
    ],
    [
     26,
     "bellman",
     "The foundation's groaning! Quick, flood the foot of the Wall!"
    ]
   ]
  },
  {
   "title": "Night 3 · Familiar Faces in the Mist",
   "beats": [
    [
     1,
     "narr",
     "The dead rise from the mist. Some still carry the shields they bore."
    ],
    [
     7,
     "soldier",
     "That's… old Hans? He's been dead three years!"
    ],
    [
     11,
     "hero",
     {
      "ayla": "Don't look at their faces. They aren't them anymore.",
      "mo": "Soul remnants. They only break while they're “solid.”",
      "ying": "Grandpa Hans… he used to carry my ladder every day.",
      "jun": "Hans… when the east wall fell, he dragged me out from under the bricks.",
      "li": "The stars keep the names of the dead. Hans's has been dark three years."
     }
    ],
    [
     22,
     "bellman",
     "Hans's daughter is right below the bell tower… someone stop her!"
    ]
   ]
  },
  {
   "title": "Night 4 · The Black Knight",
   "beats": [
    [
     1,
     "narr",
     "A knight walks at the front. Every veteran knows the crest on his sword."
    ],
    [
     3,
     "hero",
     {
      "ayla": "Karl. You promised me you'd hold until dawn.",
      "mo": "Something familiar in his magic… as if someone rewrote it.",
      "ying": "That shield… Uncle Karl always polished it till it shone.",
      "jun": "Karl's sword. I replaced the leather strap on that shield myself.",
      "li": "His fate-star belongs in the east. Now it's in the north, dragged along by something."
     }
    ],
    [
     14,
     "soldier",
     "That chest… is it walking?"
    ],
    [
     30,
     "bellman",
     "The knight keeps coming! It doesn't feel pain!"
    ]
   ]
  },
  {
   "title": "Night 5 · Greyrobe's Apprentice",
   "beats": [
    [
     1,
     "narr",
     "With the knight fallen, the enemy no longer charges blind. Chanting rises from the rear."
    ],
    [
     8,
     "necro",
     "I am Greyrobe's apprentice. My teacher sends his regards."
    ],
    [
     11,
     "hero",
     {
      "ayla": "Greyrobe? The Academy's dean? He raised these dead!",
      "mo": "Dean Greyrobe… so he opened the rift. That's why he wanted me gone.",
      "ying": "Greyrobe? The day Master left the city, he went to the Academy to find him.",
      "jun": "Greyrobe? The men who came to seize my plans were his.",
      "li": "Dean Greyrobe spent thirty years in the observatory. He watched the stars and learned to hide the sun."
     }
    ],
    [
     24,
     "soldier",
     "The fallen are getting back up! Hit the one in the robe first!"
    ]
   ]
  },
  {
   "title": "Night 6 · Siege Towers",
   "beats": [
    [
     1,
     "narr",
     "The ground shakes. The Abyss rolls up siege towers — it is learning to wage war like us."
    ],
    [
     6,
     "soldier",
     "Boulders! Get down!"
    ],
    [
     10,
     "hero",
     {
      "ayla": "Save the heaviest weapons for the heaviest brutes.",
      "mo": "A textbook parabola. Someone's teaching them geometry.",
      "ying": "Their catapults… they're built from our plans!",
      "jun": "Those are my plans! Catapults, siege towers — I drew them all years ago!",
      "li": "Their trajectories — the same method starkeepers use for meteors."
     }
    ],
    [
     26,
     "bellman",
     "The east wall's cracked! Everyone who can move, to the east wall!"
    ]
   ]
  },
  {
   "title": "Night 7 · The Longest Night",
   "beats": [
    [
     1,
     "narr",
     "Only one bell in the tower still rings. The whole city is on the Wall; even children haul bricks."
    ],
    [
     6,
     "hero",
     {
      "ayla": "Survive tonight, and only two nights remain.",
      "mo": "Stock runs out tonight. Tomorrow's brews, I'll cook mid-fight.",
      "ying": "The children are hauling bricks. I'll light a lamp on every stretch of Wall.",
      "jun": "The children are hauling bricks. I taught them to stack — neater than my father did.",
      "li": "The longest night. Only a few stars left. I'm counting them one by one."
     }
    ],
    [
     16,
     "soldier",
     {
      "ayla": "The children are passing up bricks! Captain, the Wall still stands!",
      "mo": "The children are passing up bricks! Alchemist, we're holding!",
      "ying": "The children are passing up bricks! Miss Ying, your students came too!",
      "jun": "The children are passing up bricks! Master Jun, say where it's short and we'll fill it!",
      "li": "The children are passing up bricks! Miss Li, are the stars still there?"
     }
    ],
    [
     30,
     "bellman",
     "I can still ring! As long as the bell's here, I can ring!"
    ]
   ]
  },
  {
   "title": "Night 8 · The Eve",
   "beats": [
    [
     1,
     "narr",
     "The northern sky is blacker than ever. Every monster presses forward, as if something behind is driving them."
    ],
    [
     6,
     "soldier",
     {
      "ayla": "Captain, they're running, aren't they? Looks like they're fleeing.",
      "mo": "Alchemist, why do they look like something's chasing them here?",
      "ying": "Miss Ying, there's something bigger behind them.",
      "jun": "Master Jun, they don't look like they're attacking. They look like they're fleeing.",
      "li": "Miss Li, is there a star in the north moving this way?"
     }
    ],
    [
     10,
     "hero",
     {
      "ayla": "Fleeing or charging, none of them cross the Wall.",
      "mo": "A driven herd is the most chaotic. Chaos leaves openings.",
      "ying": "Then I'll turn the lamps up, so the one behind sees clearly — someone's here.",
      "jun": "It arrives tomorrow. Tonight, we shore up the footing.",
      "li": "There is. A very big one. Tomorrow it'll be overhead."
     }
    ],
    [
     28,
     "bellman",
     "Tomorrow night, either I ring the morning bell, or there's no more ringing."
    ]
   ]
  }
 ],
 "nightsFrost": {
  "0": {
   "title": "Night 1 · Whiteout Wind",
   "beats": {
    "0": [
     1,
     "narr",
     "Dusk has barely passed when a whiteout blows in from the north. Something crawls inside the wind."
    ]
   }
  },
  "1": {
   "title": "Night 2 · Eyes in the Snow",
   "beats": {
    "0": [
     1,
     "narr",
     "Snow owls circle the battlements. Under the snow, something burrows toward the Wall with ice mines on its back."
    ],
    "1": [
     8,
     "soldier",
     "Beetles hauling ice lumps! Who taught them to make ice mines?"
    ],
    "2": [
     12,
     "hero",
     {
      "ayla": "Blow them apart, as far from the Wall as you can.",
      "mo": "Ice mines… that's how the Academy cold store makes them.",
      "ying": "The things on their backs are ticking — same rhythm as the bell.",
      "jun": "An ice mine bursting at the Wall freezes the mortar joints. Keep them off the footing.",
      "li": "Starlight can't pierce the snow. We'll have to wait for them to come close."
     }
    ],
    "3": [
     26,
     "bellman",
     "The Wall's foot is icing over! Bring torches, thaw it!"
    ]
   }
  },
  "2": {
   "title": "Night 3 · Familiar Faces in the Ice",
   "beats": {
    "0": [
     1,
     "narr",
     "The frozen rise from the snow. Some still carry the shields they bore."
    ],
    "1": [
     7,
     "soldier",
     "That's… old Hans? He's been frozen in the ice three years!"
    ]
   }
  },
  "4": {
   "title": "Night 5 · The Ice-Coffin Priest",
   "beats": {
    "1": [
     8,
     "f_priest",
     "I am Greyrobe's apprentice. My teacher bids me bring you the cold of the north."
    ],
    "3": [
     24,
     "soldier",
     "The frozen dead are rising again! Hit the one in the ice crown first!"
    ]
   }
  },
  "5": {
   "title": "Night 6 · Icebergs at the Gate",
   "beats": {
    "0": [
     1,
     "narr",
     "The ground shakes. The Abyss drags in whole icebergs, a full squad frozen inside."
    ],
    "1": [
     6,
     "soldier",
     "Icicles! Get down!"
    ],
    "2": [
     10,
     "hero",
     {
      "ayla": "Save the heaviest weapons for the heaviest brutes.",
      "mo": "Textbook trajectory. Someone's teaching them geometry.",
      "ying": "Those ballistae… they're built from our plans!",
      "jun": "Ice ballistae… that winch is my design. They even copied my mistakes.",
      "li": "I can reckon where the icicles land. Three steps left."
     }
    ],
    "3": [
     26,
     "bellman",
     "The east wall's frozen and cracked! Everyone who can move, east!"
    ]
   }
  }
 },
 "barks": {
  "raised": [
   "The fallen are rising!",
   "Hit the robed one!"
  ],
  "chain": {
   "ayla": [
    "Yes! Link by link!",
    "That's the rhythm — keep it!",
    "The whole Wall's firing!"
   ],
   "mo": [
    "Chain reaction — perfect.",
    "The equation holds!",
    "Again — and more!"
   ],
   "ying": [
    "Ding-ding-dang — all spinning!",
    "Like Master's clock, one turns the next!"
   ],
   "jun": [
    "Course on course, like a wall!",
    "Solid formation!"
   ],
   "li": [
    "The stars line up!",
    "Like a meteor shower!"
   ]
  },
  "crit": {
   "ayla": [
    "Right in the vitals!",
    "It'll remember that one."
   ],
   "mo": [
    "Lovely numbers.",
    "Note it: a perfect hit."
   ],
   "ying": [
    "Bullseye!",
    "Louder than the bell!"
   ],
   "jun": [
    "Right in the seam!",
    "That'll lay it out."
   ],
   "li": [
    "Dead center of the star.",
    "Reckoned true."
   ]
  },
  "hurt": {
   "ayla": [
    "The Wall's bleeding! Close the gap!",
    "Keep them back!",
    "Shields up!"
   ],
   "mo": [
    "Wall damaged. Error's growing.",
    "My lab bench… I mean, the Wall!"
   ],
   "ying": [
    "A lamp on the Wall went out!",
    "Hands off my lamps!"
   ],
   "jun": [
    "Wall's cracked! Mortar, now!",
    "Brick's down! Patch it!"
   ],
   "li": [
    "The Wall… the star chart's shaking.",
    "Keep them off the Wall!"
   ]
  },
  "low": {
   "ayla": [
    "Still holding… still holding!",
    "Even down to one brick — stand!"
   ],
   "mo": [
    "This is bad. Very bad.",
    "If I fall, you get my notebook."
   ],
   "ying": [
    "How many lamps left? No, don't count!",
    "As long as one stays lit!"
   ],
   "jun": [
    "This stretch is failing… I'm still here.",
    "Father's Wall won't fall on my watch."
   ],
   "li": [
    "The stars are fading… hold on.",
    "One star still lit — I can still reckon."
   ]
  },
  "freeze": {
   "ayla": [
    "Can't move my hands! Thaw it!"
   ],
   "mo": [
    "My instruments are frozen!"
   ],
   "ying": [
    "The gears are jammed!"
   ],
   "jun": [
    "The barrel's frozen!"
   ],
   "li": [
    "The astrolabe's frozen stuck!"
   ]
  },
  "surge": {
   "ayla": [
    "Everyone on the Wall!",
    "Good. Clear them in one go!"
   ],
   "mo": [
    "Sample size… surging.",
    "Many. Many, many."
   ],
   "ying": [
    "So many torches… more than the city's lamps.",
    "Light every lamp!"
   ],
   "jun": [
    "Whoa, the whole field's coming.",
    "Hold your positions! Steady!"
   ],
   "li": [
    "So many… more than the stars.",
    "Every star, shine!"
   ]
  },
  "win": {
   "ayla": [
    "No dawn yet, but we held tonight.",
    "Count heads. Bind wounds."
   ],
   "mo": [
    "Lovely data. That's enough for tonight.",
    "Survived. Prep the next experiment."
   ],
   "ying": [
    "Not one lamp went out tonight.",
    "Done. Back early tomorrow to oil them."
   ],
   "jun": [
    "Wall's standing. Two more bricks by morning.",
    "Done. Count bricks, count heads."
   ],
   "li": [
    "Tonight's stars, recorded.",
    "No dawn yet, but the stars remain."
   ]
  },
  "first": {
   "ayla": [
    "One. The rest, line up.",
    "Open for business."
   ],
   "mo": [
    "First sample, acquired.",
    "Reaction's begun."
   ],
   "ying": [
    "Got one!",
    "First lamp's lit!"
   ],
   "jun": [
    "One.",
    "Open for business."
   ],
   "li": [
    "The first one falls.",
    "Sighted."
   ]
  },
  "streak": {
   "ayla": [
    "One after another — don't stop!",
    "That's more like it."
   ],
   "mo": [
    "Efficient. Keep it up.",
    "Poor samples. They break too fast."
   ],
   "ying": [
    "Ding-ding-ding — all down!",
    "Like dominoes!"
   ],
   "jun": [
    "One by one, like tearing down old walls.",
    "This formation works!"
   ],
   "li": [
    "Meteor shower!",
    "One after another, all hits!"
   ]
  },
  "elite": {
   "ayla": [
    "Big one coming. Hold steady.",
    "…Another tough one."
   ],
   "mo": [
    "Large specimen. Leave me one intact.",
    "That size needs a bigger dose."
   ],
   "ying": [
    "S-so big… don't panic, don't panic.",
    "I can't reach that one, help!"
   ],
   "jun": [
    "Big one. Take your positions.",
    "That bulk… needs cannon."
   ],
   "li": [
    "Such a bright fate-star… this one's trouble.",
    "Big one. All light to the Carry!"
   ]
  },
  "killElite": {
   "ayla": [
    "Down. Next.",
    "Not so tough after all."
   ],
   "mo": [
    "Autopsy report later.",
    "Lovely. On the record."
   ],
   "ying": [
    "We… we beat it?",
    "Master, did you see!"
   ],
   "jun": [
    "Down. Harder than razing a wall.",
    "Done. Next."
   ],
   "li": [
    "Its star has dimmed.",
    "Reckoned true. Next star."
   ]
  },
  "empty": {
   "ayla": [
    "Out of arrows! Blades up!",
    "Empty — switch!"
   ],
   "mo": [
    "Ammo spent. Stock more next time.",
    "Out of bottles…"
   ],
   "ying": [
    "Out of oil!",
    "Lamp oil's gone, someone refill me!"
   ],
   "jun": [
    "Out of shells!",
    "Ammo! Someone haul ammo!"
   ],
   "li": [
    "Out of stardust!",
    "I need more light!"
   ]
  },
  "soldierSurge": {
   "ayla": [
    "Captain! Torches all across the north!",
    "Torches on the whole horizon! Captain, give the order!"
   ],
   "mo": [
    "Alchemist! Another big wave!",
    "Got enough bottles? They're coming again!"
   ],
   "ying": [
    "Miss Ying, get back! Another big wave!",
    "So many torches… more than the city's lamps!"
   ],
   "jun": [
    "Master Jun! Torches all across the north!",
    "Another big wave! Master Jun, will the Wall hold?"
   ],
   "li": [
    "Miss Li, another big wave!",
    "So many torches… can you still see the stars?"
   ]
  },
  "soldierHurt": {
   "ayla": [
    "Captain, the east stretch is shedding bricks!",
    "They've rammed a crack in the Wall!"
   ],
   "mo": [
    "Alchemist, the Wall's cracked! Can your brews plaster it?",
    "Wounded here! Stretcher!"
   ],
   "ying": [
    "Miss Ying, a lamp on the Wall got knocked out!",
    "Wounded here! Stretcher!"
   ],
   "jun": [
    "Master Jun, the east stretch is shedding bricks!",
    "They've rammed a crack in the Wall!"
   ],
   "li": [
    "Miss Li, the Wall's cracked!",
    "Wounded here! Stretcher!"
   ]
  }
 },
 "report": {
  "win": {
   "ayla": [
    "Held.",
    "The Wall stands.",
    "Another night survived."
   ],
   "mo": [
    "Experiment succeeded.",
    "Data valid.",
    "Tonight's log: held."
   ],
   "ying": [
    "Lamps still lit!",
    "We held!",
    "Lit through another night."
   ],
   "jun": [
    "The Wall stands.",
    "Another night survived.",
    "Not one brick lost."
   ],
   "li": [
    "Stars as usual.",
    "Lit through another night.",
    "Recorded."
   ]
  },
  "fall": {
   "ayla": "The Wall… fell",
   "mo": "Miscalculation",
   "ying": "The lamps went out",
   "jun": "The Wall fell",
   "li": "The star fell"
  }
 },
 "foe": {
  "knight": {
   "spawn": "The Wall won't hold. I tried — three hundred nights.",
   "intent": {
    "shield": "Iron wall. You taught me that, Ayla.",
    "dash": "Charge! Like the old days!"
   },
   "low": {
    "ayla": "Ayla… your sword… still so true…",
    "mo": "This light… so bright…",
    "ying": "Little one… your lamp… reminds me of…",
    "jun": "Old Jun… the wall you mended… I can't break it…",
    "li": "Little starkeeper… my star… is it still there…"
   },
   "heroLow": {
    "ayla": "Karl, wake up! Remember the day we took the oath?",
    "mo": "The runes on him are Academy script… who rewrote him?",
    "ying": "Uncle Karl? You came to the bell tower every night to play chess with Master!",
    "jun": "Karl! I replaced the strap on that shield! Wake up!",
    "li": "Your fate-star's still there. Just being dragged. I'll pull it back!"
   },
   "die": "Hold… until dawn… for me."
  },
  "eye": {
   "spawn": "Tiny flames. You don't guard a Wall. You guard a morning that will never come.",
   "intent": {
    "summon": "Fly, my eyes.",
    "gaze": "Look at me.",
    "harden": "Your light cannot reach in here."
   },
   "low": {
    "ayla": "Karl's soul is inside me, watcher. Will you burn him too?",
    "mo": "Mo… you could have stood beside me. The Academy could have been yours.",
    "ying": "Lampwright's apprentice. When your master left the city, I was the one who took him in.",
    "jun": "Wallwright. Your plans built me half an army.",
    "li": "Starkeeper. The star you seek is here, with me."
   },
   "heroLow": {
    "ayla": "He'd want me to.",
    "mo": "Dean Greyrobe. So the Abyss's eye is your eye.",
    "ying": "Master…? Then I'll send the light in and bring him back!",
    "jun": "Then let me show you what a real wall looks like.",
    "li": "Then I'll take it back — and the sun with it."
   },
   "die": "No… the light…"
  },
  "a_brute": {
   "spawn": "Meat behind the Wall. I can smell it.",
   "intent": {
    "roar": "Run! All of you, run!",
    "dash": "Out of my way!"
   },
   "die": "…Still… hungry…"
  },
  "a_golem": {
   "spawn": "(Stone grinding on stone)",
   "intent": {
    "harden": "(The cracks in its body close)",
    "quake": "(The ground jolts)"
   },
   "die": "(It shatters into rubble)"
  },
  "a_lich": {
   "spawn": "More lie dead outside the Wall than stand within it.",
   "intent": {
    "skels": "Rise, and walk this road for me.",
    "shield": "Bones can stop a blade, too."
   },
   "die": "I will… rise again…"
  },
  "fa_brute": {
   "spawn": "(The wolf king howls; the snowfield echoes everywhere)",
   "intent": {
    "roar": "(Each howl closer than the last)",
    "dash": "(It crouches low and lunges)"
   },
   "die": "(The howling breaks off)"
  },
  "fa_golem": {
   "spawn": "(A snowman taller than the gate, two icicles jutting from its face)",
   "intent": {
    "harden": "(A fresh layer of ice wraps around it)",
    "quake": "(It stamps; every flake falls from the battlements)"
   },
   "die": "(It melts into slush)"
  },
  "fa_lich": {
   "spawn": "The northern cold is my teacher's gift to you.",
   "intent": {
    "skels": "The frozen can still walk.",
    "shield": "An ice coffin outlasts a shield."
   },
   "die": "Teacher… so cold…"
  },
  "brood": {
   "spawn": "Walls? I have seen many walls. Inside, they are always soft.",
   "intent": {
    "brood": "Hungry, my children?",
    "drain": "Your fires are too loud.",
    "molt": "The old shell for you. The new one for me."
   },
   "low": {
    "ayla": "Knights, shamans, stones… all born of me. Everything you've killed was my child.",
    "mo": "There was an egg in the Academy cold store. Guess who carried it out?",
    "ying": "Lampwright. Your master came to me. The lamp oil on him was delicious.",
    "jun": "Bricklayer. However thick the wall, inside it's soft.",
    "li": "Stargazer. Have you counted how many are missing from the sky? They're all hatching in me."
   },
   "heroLow": {
    "ayla": "Then I'll wipe out the whole nest.",
    "mo": "So that egg's still alive. This time I finish the experiment myself.",
    "ying": "Give me back his lamp!",
    "jun": "Then I'll wall you up, nest and all.",
    "li": "Then I'll put them back in the sky, one by one."
   },
   "die": "(The whole Brood curls into a ball and goes still)"
  },
  "mutebell": {
   "spawn": "(No sound. Dust sifts down from the Wall.)",
   "intent": {
    "toll": "(The bell swings once. Things in the graves hear it.)",
    "hush": "(Every sound is drawn into the bell's mouth.)",
    "knell": "(The echo settles on the monsters and hardens into a shell.)"
   },
   "low": "(A crack splits the bell. A little sound leaks out, faint, like a morning bell rung somewhere far away.)",
   "heroLow": {
    "ayla": "Old Chu said when the bell strikes seven hundred and one, the watchers can go home. Give it one more.",
    "mo": "The crack's frequency matches. It wants to ring — something's muffling it.",
    "ying": "It wants to ring. Master, do you hear? It wants to ring!",
    "jun": "The crack's three inches below the hanging ring. Hit there and it drops.",
    "li": "That toll — the exact rhythm of the northern star's flicker."
   },
   "die": "(The Great Bell falls into the snow and rings once. The whole city hears it.)"
  },
  "mistmother": {
   "spawn": "You are all waiting for someone to come back. I brought them.",
   "intent": {
    "veil": "Don't look so far. Look beside you.",
    "lure": "Go. Someone's waiting for you behind the Wall.",
    "pilfer": "Toll for the road. The way home is long."
   },
   "low": {
    "ayla": "Ayla, open the door. It's cold out here. It's Karl.",
    "mo": "Little Mo, the dye vat's waiting. Come home for supper.",
    "ying": "Ying, did you top up the oil? Then come down, don't stand in the wind.",
    "jun": "Jun, east stretch, third course — the joint's crooked. Come here, I'll show you.",
    "li": "Li, come down. There are no stars in the north. Father looked."
   },
   "heroLow": {
    "ayla": "Karl never said he was cold.",
    "mo": "My mother wouldn't call me home for supper. She'd call me home for a scolding.",
    "ying": "Master never let me come down. He said a lampwright stays by the lamp.",
    "jun": "My father never taught. He only cursed.",
    "li": "When Father left, he said “wait for me,” not “come down.”"
   },
   "die": "(The mist clears. All that's left is an old, sodden cloak.)"
  },
  "siegelord": {
   "spawn": "Open the gate. Or we'll open it ourselves.",
   "intent": {
    "deploy": "First battalion, take the wall.",
    "barrage": "Loose.",
    "ram": "Ram!"
   },
   "low": {
    "ayla": "Watcher, your wall and mine come from the same plans. Whose bricks are harder?",
    "mo": "Alchemist, you can reckon my weak points — can you reckon how many of your people are in me?",
    "ying": "Little lampwright, the lamp on my gatehouse — your master lit it.",
    "jun": "Master Jun, we learned to open the gates you drew. Shall I teach you to close them?",
    "li": "Stargazer, I have walked seven hundred years. Is my city on your star chart?"
   },
   "heroLow": {
    "ayla": "The bricks are the same. The people standing on them aren't.",
    "mo": "I can. All the more reason to take them out of you.",
    "ying": "Then I'll take it down and bring it back to him.",
    "jun": "There's a mistake in those plans. Third crossbeam — I left out a tenon.",
    "li": "It is. Drawn outside the walls. Now I'm erasing it."
   },
   "die": "(The Siege Lord kneels. The flag on the gatehouse catches fire.)"
  },
  "firstoath": {
   "spawn": "Watcher. Seven hundred years, and still someone on the Wall. I am glad.",
   "intent": {
    "shield": "The oath is a shield.",
    "duel": "Draw your finest sword.",
    "muster": "Brothers, fall in."
   },
   "low": "You'd have me lay it down? Then what would they be standing here for?",
   "heroLow": "Old Chu said the oath has a second half. Seven hundred years you've held, and never heard it finished.",
   "die": "…When dawn comes… go home. So that's how it goes."
  },
  "greyrobe": {
   "spawn": "Mo. So you came. I taught you: the best students are always first to err.",
   "intent": {
    "invert": "I know your fire better than you.",
    "skels": "Rise, and stand guard for the Academy.",
    "shield": "Light draws it here. I've been shading you all."
   },
   "low": "You think I wanted the Long Night? Every night I reckon the day it finds us.",
   "heroLow": "It already has, Teacher. Seven hundred years of hiding, and it found us anyway.",
   "die": "…Then light it. Light it and show me."
  },
  "snuffer": {
   "spawn": "Ying, don't light the lamp. Once it's lit, it sees you.",
   "intent": {
    "snuff": "Shh—",
    "wind": "(The spring winds tighter, turn by turn.)",
    "summon": "Go. Pinch out every lamp."
   },
   "low": "Ten years I've stayed in the dark. It follows the light. I've been protecting you.",
   "heroLow": "The lampwright's rule — the lamp must not go out, and neither may you. You taught me that!",
   "die": "(The music box plays its last bar. The part he wound for her.)"
  },
  "blackwall": {
   "spawn": "(Someone inside the wall is counting bricks: one, two, three…)",
   "intent": {
    "rebuild": "(Forty-five, forty-six, forty-seven. From the top.)",
    "barrage": "(Bricks fly from the top of the wall.)",
    "deploy": "(A door opens in the wall.)"
   },
   "low": "Jun. Forty-seven bricks, not one more. One more, and the wall leans.",
   "heroLow": "Father, I laid the forty-eighth. The wall didn't lean. It's held eighteen years.",
   "die": "(The wall splits down the middle. From the crack, someone says softly: well laid.)"
  },
  "fallenstar": {
   "spawn": "(A star falls outside the city. It glows, and the glow is cold.)",
   "intent": {
    "eclipse": "(All the starlight goes dark at once.)",
    "starfall": "(Shards rain from the sky.)",
    "gravity": "(Everything tips toward it.)"
   },
   "low": "Li, I found it. But it's too heavy. I can't carry it back alone.",
   "heroLow": "Father, if you can't carry it alone, I'll help. Granny said a star takes two to watch.",
   "die": "(The star rises, higher and higher, and stops in the empty place in the northern sky.)"
  }
 },
 "talks": [
  {
   "who": "bellman",
   "title": "Beneath the Bell Tower",
   "lines": [
    [
     "bellman",
     "Your watch again? Here, have some hot soup, warm your hands."
    ],
    [
     "bellman",
     {
      "ayla": "Twenty years, and you never talk before going up. Say a word or two today?",
      "mo": "Everyone from the Academy left. Only you came back. What for?",
      "ying": "Little Ying, if your master saw you on the Wall, he'd scold me for not stopping you.",
      "jun": "Jun, you've mended this Wall eighteen years, know it best. Give it to me straight?",
      "li": "Li, the observatory's in ruins and you still climb it daily. What do you see?"
     }
    ]
   ],
   "q": "Old Ji: “How are you playing it tonight?”",
   "ans": [
    {
     "cat": "atk",
     "t": {
      "ayla": "Simple. Cut down whatever shows.",
      "mo": "Blow it up. Everything that'll blow.",
      "ying": "Light every lamp and hit whatever it shows!",
      "jun": "Roll up the cannons. Blast whatever shows.",
      "li": "The stars favor action tonight. So, action."
     },
     "re": "Ha, straight to it. I'll ring a couple extra to cheer you on."
    },
    {
     "cat": "def",
     "t": {
      "ayla": "Hold the Wall first. While we stand, it stands.",
      "mo": "Reinforce the Wall first. The lab bench can't collapse.",
      "ying": "Guard the lamps on the Wall first. Not one goes out.",
      "jun": "Patch the east stretch first. Shallowest footing.",
      "li": "Hold first. On a bad-star night, no risks."
     },
     "re": "Steady. With the Wall up, folks can sleep."
    },
    {
     "cat": "eco",
     "t": {
      "ayla": "Save up a bit. This war's a long one.",
      "mo": "Funding. I need funding.",
      "ying": "Save for lamp oil first… and gears.",
      "jun": "Save some coin. Mortar and bricks don't come free.",
      "li": "Save up. Starkeepers' instruments are costly to fix."
     },
     "re": "Ha, a practical one. I'll ask the caravans for you tomorrow."
    }
   ]
  },
  {
   "who": "soldier",
   "title": "On the Battlements",
   "lines": [
    [
     "soldier",
     {
      "ayla": "Captain… my hands won't stop shaking.",
      "mo": "Alchemist, sir, those bottles of yours… do they really work?",
      "ying": "Miss Ying, aren't you scared at all?",
      "jun": "Master Jun… my hands won't stop shaking.",
      "li": "Miss Li, can the stars tell us if we live through tonight?"
     }
    ],
    [
     "soldier",
     "The man beside me last night didn't show for roll call today."
    ]
   ],
   "q": "The recruit is waiting for you to speak.",
   "ans": [
    {
     "cat": "atk",
     "t": {
      "ayla": "Shaking's right. Shake and pull the trigger anyway.",
      "mo": "Scared? Throw more bottles. Quantity cures fear.",
      "ying": "Sure I'm scared. That's why I strike first.",
      "jun": "Hands shaking? Hug the cannon. It's heavier than you — the shaking stops.",
      "li": "The stars say you'll live. So don't fear. Push forward."
     },
     "re": "…Understood. I'll go clean my crossbow again."
    },
    {
     "cat": "def",
     "t": {
      "ayla": "Stand by me. While I'm here, so are you.",
      "mo": "Stay behind the merlon. Don't peek. The data says it works.",
      "ying": "Guard this lamp. While it's lit, you're fine.",
      "jun": "Stand behind the stretch I laid. It's the strongest.",
      "li": "Stand by me. I can see where they come from."
     },
     "re": "Yes! I'll stand right here, not moving."
    },
    {
     "cat": "tech",
     "t": {
      "ayla": "A trick: watch their feet, not their faces.",
      "mo": "Learn their rhythm. Every wave has a pattern.",
      "ying": "Listen for gears. When a gadget clicks, duck.",
      "jun": "Watch their feet. Marching in step means someone trained them.",
      "li": "Remember where they come from. Every wave follows the stars."
     },
     "re": "Watch the feet… right, got it."
    }
   ]
  },
  {
   "who": "greyrobe",
   "title": "A Voice in the Cracks",
   "lines": [
    [
     "greyrobe",
     "Watcher. It's hard work, keeping watch, isn't it?"
    ],
    [
     "greyrobe",
     {
      "ayla": "Karl kept watch like this too. You know how he ended up.",
      "mo": "Mo, the Academy door is still open for you. Come back.",
      "ying": "Your master is with me. He's doing well. He misses you a little.",
      "jun": "Jun, I still have your plans. Come back and draw me new ones?",
      "li": "Li, the star you seek is in my hand. If you want it, come take it."
     }
    ]
   ],
   "q": "The voice waits for your reply.",
   "ans": [
    {
     "cat": "atk",
     "t": {
      "ayla": "Come out and say that.",
      "mo": "The Academy? First thing I'll do is blow it up.",
      "ying": "Give my master back!",
      "jun": "You built siege towers from my plans. I'll tear them down.",
      "li": "Then I'll come take it. And you with it."
     },
     "re": "…Such temper. Fine — I'll send you more guests tonight."
    },
    {
     "cat": "def",
     "t": {
      "ayla": "…(takes her ear off the Wall)",
      "mo": "No. I'm fine here.",
      "ying": "I'm not listening. I have lamps to light.",
      "jun": "…(slaps a trowel of mortar into the crack)",
      "li": "I'm not listening. The stars tell me the truth."
     },
     "re": "Silent? No matter. Walls always fall."
    },
    {
     "cat": "tech",
     "t": {
      "ayla": "The more you talk, the more I learn what you fear.",
      "mo": "Keep talking. Your incantation has a flaw. I'm taking notes.",
      "ying": "When you talk, there's a draft in the crack. I found where you are.",
      "jun": "Your voice comes from behind the third brick of the east stretch.",
      "li": "Your voice comes from the same direction as that shadow in the northern sky. Noted."
     },
     "re": "…Clever children rarely live long."
    }
   ]
  },
  {
   "who": "bellman",
   "title": "The Last Bell",
   "lines": [
    [
     "bellman",
     "This is the last bell left in the tower. After tonight, either I ring the morning bell, or there's no more ringing."
    ],
    [
     "bellman",
     {
      "ayla": "Ayla, thank you for all these years.",
      "mo": "Dawn or no dawn, you're one of this city's own now.",
      "ying": "Go on, child. Your master's lamp has burned in the bell tower all along.",
      "jun": "Jun, your father laid half this Wall, you laid the other half. Well done.",
      "li": "Li, the starkeepers' rule — count every star before dawn. Done counting?"
     }
    ]
   ],
   "q": "Old Ji: “Anything else to prepare?”",
   "ans": [
    {
     "cat": "atk",
     "t": {
      "ayla": "Haul up every weapon that still works.",
      "mo": "Mix the rest of the reagents into the strongest stuff.",
      "ying": "Lend me every lamp in the city.",
      "jun": "Roll every cannon up onto the Wall.",
      "li": "Lend all the light to my Carry."
     },
     "re": "It's all yours. Nothing held back tonight."
    },
    {
     "cat": "def",
     "t": {
      "ayla": "Send the children to the cellars. The Wall's ours.",
      "mo": "Give the Wall another coat. I have the formula.",
      "ying": "A lamp on every stretch of the Wall.",
      "jun": "Last night. One more layer on the Wall.",
      "li": "Get the children to the cellars. The Wall's ours."
     },
     "re": "Right. I'll take the children down."
    },
    {
     "cat": "eco",
     "t": {
      "ayla": "Spend it all. No use saving it now.",
      "mo": "My scholarship… forget it, bet it all.",
      "ying": "Take all my savings and buy lamp oil.",
      "jun": "Take all my wages and buy powder.",
      "li": "Pawn my instruments. I'll redeem them at dawn."
     },
     "re": "Ha, then I'll break out my burial savings too."
    }
   ]
  }
 ],
 "meets": [
  {
   "who": "soldier",
   "n": "Passing Veteran",
   "say": "My leg's lame, can't climb the Wall. Let me teach you something — call it standing one watch for you."
  },
  {
   "who": "bellman",
   "n": "Old Ji's Ledger",
   "say": "Tricks left by the watchers before you. Pick one."
  },
  {
   "who": "greyrobe",
   "n": "Academy Deserter",
   "say": "Don't tell Greyrobe I was here. This is all I know. Take it."
  }
 ],
 "secretStar": [
  {
   "who": "hero",
   "t": {
    "mo": "As promised — returned at dawn."
   }
  },
  {
   "who": "narr",
   "t": "The fallen star rises from the Wall, higher and higher, and stops in the place in the northern sky that stood empty seven hundred years."
  },
  {
   "who": "narr",
   "t": "The next day, the starkeepers wrote in their record: the northern stars are all accounted for."
  }
 ],
 "secretBell": [
  {
   "who": "narr",
   "t": "No one is in the bell tower. Yet the bell rings on its own."
  },
  {
   "who": "narr",
   "t": "The seven hundred and first stroke."
  },
  {
   "who": "hero",
   "t": {
    "ayla": "Seven hundred years and it never missed a day. This stroke is for everyone who didn't live to see dawn.",
    "mo": "Nobody pulled the rope. I can't work it out… this time I won't try.",
    "ying": "Master said the day the bell rings on its own is the day he comes back.",
    "jun": "My father built this bell's frame. Seven hundred years, not one beam askew.",
    "li": "This stroke falls exactly when the northern star returns."
   }
  },
  {
   "who": "narr",
   "t": "Afterward, everyone in Dawnbell said that morning's bell was louder than any in seven hundred years."
  }
 ],
 "bossNights": {
  "eye": {
   "title": "Eye of the Abyss",
   "beats": [
    [
     1,
     "narr",
     "The northern sky splits open. The eye opens and looks at the city — at you."
    ],
    [
     4,
     "hero",
     {
      "ayla": "Come on. I've waited twenty years for you.",
      "mo": "So you're what hid the sun. Let's see what's inside you.",
      "ying": "You swallowed the sun. Then I'll light it back, lamp by lamp, from here.",
      "jun": "Want to look at this Wall? Then look. It's tougher than you think.",
      "li": "The sun you've hidden — I've kept its place on my star chart."
     }
    ],
    [
     20,
     "bellman",
     "Every lamp in the city is lit! Let it look!"
    ],
    [
     40,
     "soldier",
     "It's bleeding! The eye is bleeding!"
    ]
   ]
  },
  "brood": {
   "title": "Abyssal Brood-Nest",
   "beats": [
    [
     1,
     "narr",
     "A moving mountain crawls from the northern rift. With every step, bugs drop from its body."
    ],
    [
     4,
     "hero",
     {
      "ayla": "So everything these years crawled out of here.",
      "mo": "A nest. The Abyss isn't an eye. It's a nest.",
      "ying": "So big… but it's afraid of light too, right?",
      "jun": "A walking mountain. I've built mountains — every one has a footing.",
      "li": "A nest… there's always been a dark patch on the star chart. So that's it."
     }
    ],
    [
     20,
     "bellman",
     "Bugs on the Wall! Torches, boiling water, anything!"
    ],
    [
     40,
     "soldier",
     "Its shell's cracked! It's soft inside!"
    ]
   ]
  },
  "mutebell": {
   "title": "The Mute Bell",
   "beats": [
    [
     1,
     "narr",
     "A bell tolls from the north. No sound — only dust sifting from the Wall, layer by layer."
    ],
    [
     4,
     "hero",
     {
      "ayla": "I've seen this bell. In Old Chu's stories, it hung on the tower's top floor.",
      "mo": "The vibration reaches us, but the ear can't hear it. It's striking something else.",
      "ying": "Master said Dawnbell once had seven bells. The tower holds only six.",
      "jun": "There's a worn ring on the top-floor beam of the tower. I always thought a lamp hung there.",
      "li": "Each time it tolls, a star on the chart shivers."
     }
    ],
    [
     12,
     "bellman",
     "That's the Great Bell… my grandfather's grandfather spoke of its voice. Hear it once, he said, and you never forget."
    ],
    [
     30,
     "soldier",
     "The fallen are rising again — rising with the bell!"
    ]
   ]
  },
  "mistmother": {
   "title": "Mist Mother",
   "beats": [
    [
     1,
     "narr",
     "Mist rolls in from the north, taller than the Wall. Inside it, someone calls out names."
    ],
    [
     5,
     "soldier",
     "That's my mother's voice… she's calling my childhood name from the mist."
    ],
    [
     9,
     "hero",
     {
      "ayla": "Don't answer. Answer, and it knows who you are.",
      "mo": "Voices can be faked. Body heat can't. It's cold.",
      "ying": "I heard Master cough. …He never coughs at night.",
      "jun": "Someone in the mist counts bricks, stops at forty-seven, starts over. That's how my father counted.",
      "li": "The mist hides every star. It doesn't want us to know where we are."
     }
    ],
    [
     26,
     "bellman",
     "Plug your ears! Nobody walks into the mist!"
    ]
   ]
  },
  "siegelord": {
   "title": "Siege Lord",
   "beats": [
    [
     1,
     "narr",
     "A city walks toward this city. It has its own walls, its own gate, and a dead man's flag on its gatehouse."
    ],
    [
     5,
     "hero",
     {
      "ayla": "It's copying us. Even the merlon spacing matches.",
      "mo": "The load math is right; the material's wrong. Its frame is bone.",
      "ying": "Those gears turn backward, like a clock running in reverse.",
      "jun": "That's the first plan I ever drew, at seventeen. I know even that misdrawn beam.",
      "li": "Every step it takes, the horizon draws an inch closer."
     }
    ],
    [
     14,
     "soldier",
     "It's hurling stones at the Wall! Get down!"
    ],
    [
     32,
     "bellman",
     "Its gate's open… it's full of soldiers!"
    ]
   ]
  }
 },
 "winBy": {
  "eye": "The eye closes. From the rift in the north seeps a thread of pale grey light.",
  "brood": "The Brood curls up and goes still. From the rift in the north seeps a thread of pale grey light.",
  "mutebell": "The Great Bell falls in the snow outside the city and rings once. The morning bell. A sliver of the northern sky grows light.",
  "mistmother": "The mist clears. For the first time, those on the Wall can see far away. On the horizon, a thread of grey.",
  "siegelord": "That city falls before this city's gate. Beneath its shadow, light breaks through for the first time."
 },
 "nightsFull": {
  "10": {
   "title": "Night 10 · The Morning That Didn't Come",
   "beats": [
    [
     1,
     "narr",
     "By the clock, it should be morning. The northern sky is still black — calmly black, as if nothing ever happened."
    ],
    [
     8,
     "bellman",
     "I rang the morning bell all the same. When I was done, everyone was still on the Wall. Nobody came down."
    ],
    [
     24,
     "soldier",
     "They're back. Fewer than before, but in tight ranks, like they've drilled."
    ]
   ]
  },
  "11": {
   "title": "Night 11 · The Northern Road",
   "beats": [
    [
     1,
     "narr",
     "Half the snow has melted. A road shows outside the city, running to the northern rift. Freshly trodden."
    ],
    [
     9,
     "soldier",
     "Someone came back from the north? These prints lead toward the city."
    ],
    [
     26,
     "bellman",
     "The catapults are rolling up again. Hold them — I'll wake the east stretch."
    ]
   ]
  },
  "12": {
   "title": "Night 12",
   "beats": []
  },
  "13": {
   "title": "Night 13 · A Sprout at the Wall's Foot",
   "beats": [
    [
     1,
     "narr",
     "A little green has grown in the cracks at the foot of the Wall. No one knows what feeds it."
    ],
    [
     10,
     "soldier",
     "Don't step on it! …I mean, a fight's a fight, but walk around it."
    ],
    [
     28,
     "bellman",
     "Sixty years Old Ji's lived and never seen anything grow from the ground. Seen it today — I could die tomorrow content."
    ]
   ]
  },
  "14": {
   "title": "Night 14 · Longer Than the Longest Night",
   "beats": [
    [
     1,
     "narr",
     "Tonight, everything in the north comes. And everyone in the city is on the Wall."
    ],
    [
     10,
     "bellman",
     "A bell rope snapped. I tied it back with my belt. Tonight the bell won't miss a single stroke."
    ],
    [
     22,
     "soldier",
     "The Wall stands! The Wall stands!"
    ],
    [
     36,
     "narr",
     "A touch of color at the sky's edge. Hard to say what color — but it isn't black."
    ]
   ]
  },
  "15": {
   "title": "Night 15 · Before Dawn",
   "beats": [
    [
     1,
     "narr",
     "The northern rift yawns open. Only one thing walks out."
    ],
    [
     20,
     "bellman",
     "Ring it. Whoever comes today, the bell must ring."
    ]
   ]
  }
 },
 "full": {
  "noDawnBy": {
   "eye": "The eye closes. Every face turns north, waiting for that thread of light.",
   "brood": "The Brood curls up and goes still. Every face turns north, waiting for that thread of light.",
   "mutebell": "The Great Bell falls into the snow and rings once. Every face turns north, waiting for that thread of light.",
   "mistmother": "The mist clears. Every face turns north, waiting for that thread of light.",
   "siegelord": "That city falls before the gate. Every face turns north, waiting for that thread of light."
  },
  "noDawn": [
   {
    "who": "narr",
    "t": "The light does not come."
   },
   {
    "who": "bellman",
    "t": "…I gripped the bell rope all night waiting. Hands gone stiff. No matter. Another night, then."
   },
   {
    "who": "hero",
    "t": "It wasn't the last one. Something else in the north is waiting for us."
   }
  ],
  "quiet": [
   {
    "who": "narr",
    "t": "On the fifteenth night, nothing comes out of the northern rift."
   },
   {
    "who": "narr",
    "t": "Dawn comes slowly. First grey, then a faint wash of yellow, as if through old paper."
   },
   {
    "who": "hero",
    "t": "It's dawn. But the rift in the north is still open. Someday, someone will go and close it."
   },
   {
    "who": "bellman",
    "t": "Ringing the morning bell—"
   }
  ],
  "trueWin": [
   {
    "who": "narr",
    "t": "Where it fell, the rift slowly closes, like a wound scabbing over."
   },
   {
    "who": "narr",
    "t": "Then the sun comes out. Not a thread of light — the whole sun."
   },
   {
    "who": "hero",
    "t": "It's dawn. This time, for real."
   },
   {
    "who": "bellman",
    "t": "Ringing the morning bell—!"
   }
  ],
  "gems": {
   "red": {
    "title": "The Bell Tower Brazier",
    "who": "bellman",
    "lines": [
     [
      "bellman",
      "The tower's brazier hasn't gone out in seven hundred years. This morning, adding coal, I felt this under the ash."
     ],
     [
      "narr",
      "A red stone in Old Ji's palm, like a heart still beating."
     ],
     [
      "bellman",
      "I'm old; it burns my hand. You're young. Your call."
     ]
    ],
    "q": "Take the stone?",
    "take": {
     "t": "Give it here. Burn or not, I'll hold it.",
     "re": [
      [
       "bellman",
       "Good. Hold it tight — it knows its owner."
      ]
     ]
    },
    "refuse": {
     "t": "Keep it to warm your hands, Old Ji.",
     "re": [
      [
       "bellman",
       "Then I'll trade it for a few purses and buy the Wall a round."
      ],
      [
       "narr",
       "When Old Ji returns, he presses a heavy purse into your hand."
      ]
     ]
    }
   },
   "blue": {
    "title": "The Observatory's Old Lens",
    "who": "narr",
    "lines": [
     [
      "narr",
      "Half the observatory has collapsed. In the rubble lies one unbroken lens, blue as the sky before it went dark."
     ],
     [
      "narr",
      "Turned north, a speck of light inside the lens keeps spinning."
     ]
    ],
    "q": "Take the lens?",
    "take": {
     "t": "Take it. It's pointing the way.",
     "re": [
      [
       "narr",
       "The lens rests against your chest, cool. The speck of light spins faster."
      ]
     ]
    },
    "refuse": {
     "t": "Leave it. It belongs where it can see the sky.",
     "re": [
      [
       "narr",
       "You set the lens back on the rubble. Beside it lies something someone left behind; you pick it up."
      ]
     ]
    }
   },
   "green": {
    "title": "The Sprout at the Wall's Foot",
    "who": "soldier",
    "lines": [
     [
      "soldier",
      "That sprout at the Wall's foot… I guarded it all last night. This morning it bore a green seed, hard as stone."
     ],
     [
      "soldier",
      "The others say it should go to you. Can't say why, but I think so too."
     ]
    ],
    "q": "Take the seed?",
    "take": {
     "t": "Give it to me. At dawn, I'll plant it back.",
     "re": [
      [
       "soldier",
       "It's a promise. At dawn, I'll help you dig."
      ]
     ]
    },
    "refuse": {
     "t": "Keep it. You guarded it all night; it's yours.",
     "re": [
      [
       "soldier",
       "…Then I'll bury it at the foot of the Wall. While the Wall stands, so does it."
      ],
      [
       "narr",
       "That stretch of Wall, in time, grew sturdier than any other."
      ]
     ]
    }
   }
  }
 }
};
