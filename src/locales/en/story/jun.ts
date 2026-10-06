/* Jun's story.
 * Three night sets: the East Wall (his father Old Shi and the collapse eighteen years ago), Blueprints (the catapult he drew at seventeen), Home (his wife Guizhi and son Shitou).
 */
export default {
  arcs: [
    {
      n: "East Wall",
      intro: [{ who: "hero", t: "East stretch, third course: one brick a different color. I laid it." }],
      nights: {
        1: [[9, "hero", "It'll hold. Eighteen years on this Wall. I know every loose brick."], [24, "hero", "East stretch, third course. The odd brick's still there."]],
        2: [[12, "hero", "They're digging under the Wall. The east stretch. Shallowest footing."], [26, "hero", "Dad said the east footing was shallow. Told me to deepen it. I did. He never saw."]],
        3: [[11, "hero", "Hans... when the East Wall fell, he dragged me out from the bricks."], [24, "hans", "Jun, boy, give me your hand!"]],
        4: [[3, "hero", "Karl's sword. I restrung the straps on that shield."], [22, "hero", "Tied with Dad's knot. However tight, it loosens."]],
        5: [[11, "hero", "Greyrobe? His men came for my blueprints back then."], [26, "hero", "The fallen stand back up. Bricks you can restack. Not people."]],
        6: [[10, "hero", "Those are my blueprints! Catapults, siege towers, all drawn years ago!"], [26, "hero", "The East Wall's cracked. ...The East Wall again."]],
        7: [[6, "hero", "The kids are hauling bricks. I taught them to stack. Neater than Dad."], [30, "hero", "If Dad saw, he'd say: crooked. He said that about everything."]],
        8: [[10, "hero", "It arrives tomorrow. Tonight, shore up the footing."], [26, "hero", "Forty-five, forty-six, forty-seven. ...Forty-eight's mine."]],
      },
      talks: {
        1: {
          title: "Under the Bell Tower", who: "bellman",
          lines: [
            ["bellman", "Jun, eighteen years on this Wall, you know it best. Straight answer?"],
            ["hero", "East's no good."],
            ["bellman", "That's it?"],
            ["hero", "West's not great either. North gate, passable."],
          ],
          q: "Old Ji waits for more. You don't give any.",
          ans: [
            { cat: "atk", t: "Where it's weak, put cannons.", re: "Cannons? Yours weigh more than the Wall." },
            { cat: "def", t: "I'll sleep on the east stretch. I'll hear any brick shift.", re: "Sleep on the Wall? Does your wife know?" },
            { cat: "eco", t: "Two carts of lime, and the east holds three more nights.", re: "Ask the lord for the lime money yourself." },
          ],
        },
        3: {
          title: "Mist", who: "hans",
          lines: [
            ["hans", "Jun, boy."],
            ["hans", "Give me your hand. You're pinned. I'll pull you out."],
            ["hero", "...Hans. That was eighteen years ago."],
            ["hans", "Give me your hand."],
          ],
          q: "A hand reaches from the mist. A bite mark on the back. Yours, as a child.",
          ans: [
            { cat: "atk", t: "(You throw a brick into the mist.)", re: "...Good lad. Got strong." },
            { cat: "def", t: "I'm out, Hans. Got out eighteen years ago. Go back.", re: "Out's good. Out's good." },
            { cat: "tech", t: "You pulled me with your left hand that day. Your right was long broken.", re: "(The mist falls silent.)" },
          ],
        },
        5: {
          title: "Brick Kiln", who: "oldshi",
          lines: [
            ["oldshi", "Forty-five, forty-six, forty-seven."],
            ["oldshi", "From the top."],
            ["hero", "Dad."],
            ["oldshi", "Heft a brick. Know its weight. Can't tell, don't lay it."],
          ],
          q: "Firelight flickers in the kiln. Your father's voice. No one inside.",
          ans: [
            { cat: "atk", t: "I can tell. Eighteen years laying.", re: "Eighteen? Forty for me, and I still can't." },
            { cat: "def", t: "Dad, I thickened the East Wall. Shallow footing, like you said.", re: "...How many courses?" },
            { cat: "tech", t: "Why stop counting at forty-seven?", re: "Forty-eight's left for the next one to lay." },
          ],
        },
        7: {
          title: "East Wall", who: "bellman",
          lines: [
            ["bellman", "Jun, your dad laid half this Wall. You laid the other half."],
            ["hero", "His half's straighter than mine."],
            ["bellman", "His half fell once."],
            ["hero", "...Yeah."],
          ],
          q: "Old Ji pats the Wall. It's cold.",
          ans: [
            { cat: "atk", t: "Push every cannon onto the Wall.", re: "Every one. Will the Wall hold?" },
            { cat: "def", t: "One more course. Two nights still ride on it.", re: "Lay it. I'll hand you bricks." },
            { cat: "eco", t: "All my wages go to powder.", re: "Ha. Then out comes my burial money too." },
          ],
        },
      },
    },
    {
      n: "Blueprints",
      intro: [{ who: "hero", t: "I was seventeen when the Academy took my blueprints. They paid a bag of coppers. I bought a good trowel. Still use it." }],
      nights: {
        1: [[9, "hero", "It'll hold. Eighteen years on this Wall."], [22, "hero", "This trowel. Paid for with blueprints."]],
        2: [[12, "hero", "Digging under the Wall. Done right. ...Too right."], [26, "hero", "I drew this dig."]],
        3: [[11, "hero", "Hans... when the East Wall fell, he dragged me out from the bricks."]],
        4: [[3, "hero", "Karl's sword. I restrung that shield."], [22, "hero", "They restring straps now. Who taught them?"]],
        5: [[11, "hero", "Greyrobe? His men came for my blueprints back then."], [26, "hero", "They said it was to defend the city. Which city?"]],
        6: [[10, "hero", "Those are my blueprints! Catapults, siege towers, all drawn years ago!"], [24, "hero", "I got one winch measurement wrong. They built it wrong too."]],
        7: [[6, "hero", "The kids are hauling bricks. Neater than Dad."], [28, "hero", "Their tower's third crossbeam is missing a tenon. Hit there!"]],
        8: [[10, "hero", "It arrives tomorrow. Tonight, shore up the footing."], [26, "hero", "The one behind... I drew one of those too. Thought I'd burned it."]],
      },
      talks: {
        1: {
          title: "Work Shed", who: "soldier",
          lines: [
            ["soldier", "Master Jun, did you draw this? Found it in the old files."],
            ["hero", "...Where?"],
            ["soldier", "A bundle the Academy sent back. Stamped: VOID."],
          ],
          q: "A catapult on yellowed paper. In the corner, your signature at seventeen.",
          ans: [
            { cat: "atk", t: "Void? They're using it fine outside the Wall.", re: "Outside? You mean..." },
            { cat: "def", t: "Burn it.", re: "Yes. ...Master Jun, it's a fine drawing." },
            { cat: "tech", t: "Leave it. I'll see what they've changed.", re: "You'll... counter it from this?" },
          ],
        },
        3: {
          title: "Noodle Stall", who: "guizhi",
          lines: [
            ["guizhi", "Drawing again? All night. Your noodles have gone to paste."],
            ["hero", "Something to take catapults apart."],
            ["guizhi", "Young, you drew catapults. Now, things to wreck them. You're always at war with yourself."],
          ],
          q: "She pushes the bowl to your hand and adds a spoon of chili.",
          ans: [
            { cat: "atk", t: "Then I'll wreck it.", re: "Wreck away. Then come home and sleep." },
            { cat: "def", t: "One bowl, then the Wall. Close up early.", re: "Close? A hundred men up there want noodles." },
            { cat: "eco", t: "Tonight's noodles on my tab. Whatever the Wall eats.", re: "Your tab? Twenty years I've kept it. Never balanced." },
          ],
        },
        5: {
          title: "A Voice in the Wall", who: "greyrobe",
          lines: [
            ["greyrobe", "Jun. I still have your blueprints."],
            ["greyrobe", "Your catapult outranged the Academy's by a third. Counterweights mastered at seventeen."],
            ["greyrobe", "Come back. Draw me a new one."],
          ],
          q: "The voice is slow, like reading from a file.",
          ans: [
            { cat: "atk", t: "You built siege towers from my plans. I'll tear them down.", re: "Can you? You drew them." },
            { cat: "def", t: "(You trowel mortar into the crack.)", re: "...Your father sealed it the same way." },
            { cat: "tech", t: "I drew one counterweight wrong. You copied it wrong.", re: "...We never noticed." },
          ],
        },
        7: {
          title: "Charcoal Drawing", who: "shitou",
          lines: [
            ["shitou", "Dad, I drew a plan too."],
            ["shitou", "A wall. Really, really high. A door in it, a window in the door, a lamp in the window."],
            ["shitou", "Look. What did I get wrong?"],
          ],
          q: "Shitou drew it on a board, with charcoal from the stove.",
          ans: [
            { cat: "atk", t: "Nothing wrong. Just needs some cannons out front.", re: "I'll go add them!" },
            { cat: "def", t: "Draw the footing. As deep as the wall is high.", re: "Oh... that runs off the board." },
            { cat: "tech", t: "Nothing wrong at all. Keep it. Don't let the Academy see.", re: "Why?" },
          ],
        },
      },
    },
    {
      n: "Home",
      intro: [{ who: "guizhi", t: "Noodles are here. Less chili. Last time your stomach hurt all night." }],
      nights: {
        1: [[9, "hero", "It'll hold. Eighteen years on this Wall."], [24, "narr", "Someone shouts from below: noodles up! Send one down to fetch!"]],
        2: [[12, "hero", "They're digging east. The noodle stall's right behind it."], [26, "hero", "Guizhi, move the stall twenty paces west tonight."]],
        3: [[11, "hero", "Hans... he dragged me out from the bricks."], [24, "hero", "Hans was Shitou's godfather. Shitou doesn't know he's gone."]],
        4: [[3, "hero", "Karl's sword. I restrung the straps on that shield."], [24, "shitou", "Dad! I brought the bricks up!"], [26, "hero", "Who let you up here? Down!"]],
        5: [[11, "hero", "Greyrobe? His men came for my blueprints back then."], [26, "guizhi", "Jun! The stoves below are lit. Come warm up!"]],
        6: [[10, "hero", "Those are my blueprints..."], [22, "hero", "Shitou? Is Shitou in the cellar?"], [26, "guizhi", "He is! Tied with a rope!"]],
        7: [[6, "hero", "The kids are hauling bricks. I taught them to stack."], [16, "shitou", "Dad, is my row straight?"], [30, "hero", "Straight. Straighter than Dad's."]],
        8: [[10, "hero", "It arrives tomorrow. Tonight, shore up the footing."], [26, "narr", "Below the Wall, the noodle stall's lamp stays lit."]],
      },
      talks: {
        1: {
          title: "Noodle Stall", who: "guizhi",
          lines: [
            ["guizhi", "On watch again? You did the most last month."],
            ["hero", "I know the east."],
            ["guizhi", "East, east. Only one wall in your heart."],
            ["guizhi", "...There's an egg in your noodles. Don't let anyone see."],
          ],
          q: "She nudges the bowl toward you.",
          ans: [
            { cat: "atk", t: "After this, more cannon fire tonight.", re: "Fire away. Then bring the bowl back." },
            { cat: "def", t: "I hold the east, the stall's safe.", re: "Hmph. As if the stall needs you." },
            { cat: "eco", t: "The egg's on me.", re: "On you? Which month did your wages reach me?" },
          ],
        },
        3: {
          title: "Mud Brick", who: "shitou",
          lines: [
            ["shitou", "Dad, look, I made a brick!"],
            ["shitou", "Mud from the river. Baked by the stove three days."],
            ["shitou", "I want it in the East Wall. Right by yours."],
          ],
          q: "It's lopsided, one corner chipped off.",
          ans: [
            { cat: "atk", t: "Not hard enough. Two more days and it'll brain a monster.", re: "Brain a monster! I'll bake it!" },
            { cat: "def", t: "We'll lay it. I'll save you a spot.", re: "Really? Where?" },
            { cat: "tech", t: "Mix straw and lime in the mud, or rain melts it.", re: "Straw... I'll go pull some!" },
          ],
        },
        5: {
          title: "By the Lamp", who: "guizhi",
          lines: [
            ["guizhi", "Shitou asked where Grandpa Hans went."],
            ["guizhi", "I said on a long trip. He asked when he's back."],
            ["guizhi", "I said: when it's dawn."],
          ],
          q: "She ladles up broth and pours it back. Again and again.",
          ans: [
            { cat: "atk", t: "Then let there be dawn.", re: "Easy to say. ...Eat." },
            { cat: "def", t: "Don't lie to him. He'll learn sooner or later.", re: "When he's older. Nine's too young." },
            { cat: "tech", t: "Hans came back. In the mist.", re: "...Don't tell Shitou that." },
          ],
        },
        7: {
          title: "Staying Open", who: "guizhi",
          lines: [
            ["guizhi", "I'm not closing tonight."],
            ["guizhi", "Hungry on the Wall? Come down, eat, go back up."],
            ["guizhi", "You too."],
          ],
          q: "The broth boils. Steam fogs her face.",
          ans: [
            { cat: "atk", t: "I won't come down tonight. After the fight, I eat at home.", re: "At home. ...Deal." },
            { cat: "def", t: "Shitou's in the cellar?", re: "He is. Wouldn't go without his brick." },
            { cat: "eco", t: "Put the stall's money into powder.", re: "Powder? Then what buys noodles tomorrow? ...Fine." },
          ],
        },
      },
    },
  ],
  talks: {
    9: {
      title: "The Last Night", who: "bellman",
      lines: [
        ["bellman", "Last night. How's the Wall?"],
        ["hero", "East's been patched seven times. Can't patch more."],
        ["bellman", "Then what?"],
        ["hero", "Can't patch, so we stand there. Men are thicker than bricks."],
      ],
      q: "Old Ji looks at you, says nothing.",
      ans: [
        { cat: "atk", t: "Every cannon up tonight. Not one held back.", re: "All of them. If the Wall falls, it's on me." },
        { cat: "def", t: "I take the east. You take the tower.", re: "Good. Whoever breaks first rings the bell." },
        { cat: "eco", t: "Leftover brick money buys wine. We drink at dawn.", re: "Your treat? Then out comes my burial money too." },
      ],
    },
  },
  bosses: {
    eye: {
      beats: [[4, "hero", "You want to see this Wall? Look. It's sturdier than you think."], [26, "hero", "It's eyeing the east. I thickened the east. Let it stare."]],
      win: [
        { who: "narr", t: "The eye closed. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "The Wall's still here. Dad laid this stretch." },
        { who: "hero", t: "It's dawn. I'd better check for cracks." },
      ],
    },
    brood: {
      beats: [[4, "hero", "A walking mountain. I've built mountains. Even the biggest has a footing."], [24, "hero", "Bugs in the mortar joints. Mortar! Seal every crack!"]],
      win: [
        { who: "narr", t: "The brood curled up and moved no more. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "Dawn. Bug husks in the joints. Have to pick them out joint by joint." },
        { who: "hero", t: "Fine. I've got time." },
      ],
    },
    mutebell: {
      beats: [[4, "hero", "On the tower's top beam there's a worn ring. Always thought a lamp hung there."], [24, "hero", "That bell's hanger was forged by Dad's generation. No mistake."]],
      win: [
        { who: "narr", t: "the Great Bell fell on the snow outside the city and rang once. The morning bell. The northern sky lit by a thread." },
        { who: "bellman", t: "It rang... the Great Bell rang." },
        { who: "hero", t: "So that worn ring on the beam was where it hung." },
        { who: "hero", t: "At dawn we hang it back. I'll fix the beam." },
      ],
    },
    mistmother: {
      beats: [[9, "hero", "Someone in the mist counts bricks. Stops at forty-seven, starts over. Like Dad did."], [20, "hero", "Guizhi, watch Shitou. Don't let him into the mist."]],
      win: [
        { who: "narr", t: "The mist lifted. For the first time, the Wall could see far. On the horizon, a thread of grey." },
        { who: "hero", t: "Mist's gone. At the Wall's foot, a charcoal line. Straight as Dad's." },
        { who: "hero", t: "...It's dawn." },
      ],
    },
    siegelord: {
      beats: [[5, "hero", "That's the first plan I drew at seventeen. I know even the wrong beam."], [28, "hero", "Its gate troops stand like ours. Neater than ours."]],
      win: [
        { who: "narr", t: "That city fell before this city's gate. Beneath its shadow, light showed for the first time." },
        { who: "hero", t: "Down. What I drew, I tore down myself." },
        { who: "hero", t: "It's dawn. Home for noodles." },
      ],
    },
  },
  full: {
    noDawn: [
      { who: "narr", t: "The light did not come." },
      { who: "guizhi", t: "I'm keeping the noodles hot. Come down, take a bite, then go back." },
      { who: "hero", t: "Mm. One bite." },
    ],
    nights: {
      10: [[4, "hero", "The morning bell rang, and it's still dark."], [24, "hero", "They're pushing cartloads of bricks. Black bricks."]],
      11: [[6, "hero", "The north road's paved now. Very level."], [26, "hero", "Dad's pattern. Forty-seven to a run, then offset."]],
      12: [[4, "hero", "Another one."], [28, "hero", "East still stands. Patch one, count one."]],
      13: [[8, "shitou", "Dad! A sprout by the Wall! Right by my mud brick!"], [24, "hero", "...Mm. It picked a good spot."]],
      14: [[6, "hero", "Everyone in the city's on the Wall. Guizhi too, cooking noodles up top."], [22, "guizhi", "Jun! East! The east is shedding bricks again!"], [34, "hero", "Color at the sky's edge. Like a kiln fire just gone out."]],
      15: [[4, "hero", "A stretch of wall. ...A walking wall."], [18, "hero", "Dad, is that you?"]],
    },
    talks: {
      11: {
        title: "Kiln", who: "oldshi",
        lines: [
          ["oldshi", "Jun. Up north there's a wall. Seven hundred years building, not done."],
          ["oldshi", "I'm there, counting its bricks."],
          ["oldshi", "Forty-seven. Not one more. One more and the wall leans."],
          ["hero", "Dad, I laid the forty-eighth. The East Wall didn't lean."],
        ],
        q: "No sound from the kiln for a long time.",
        ans: [
          { cat: "atk", t: "That wall. I'll tear it down.", re: "...Can you? I built it." },
          { cat: "def", t: "Come back. The East Wall's done. Take a look.", re: "A look... all right." },
          { cat: "tech", t: "Forty-seven a run, because forty-seven's all you could carry at once.", re: "...How did you know?" },
        ],
      },
    },
    gems: {
      red: {
        title: "Brick from the Kiln", who: "guizhi",
        lines: [
          ["guizhi", "Your dad's old kiln, south of town. I went for firewood today. The door was open."],
          ["guizhi", "The last batch is still in there. One brick's red. Burns to touch."],
          ["guizhi", "I wrapped it in my apron. See if it's any use."],
        ],
        q: "On its back, a fingerprint. Your father's.",
        take: { t: "It's good. I'll lay it in.", re: [["guizhi", "Where?"], ["hero", "In me. I'll carry it."]] },
        refuse: { t: "Put it back. That batch opens at dawn.", re: [["guizhi", "...Then I saved the firewood money. Here."], ["narr", "She tucks a pouch of coppers in your tool bag, beside your charcoal."]] },
      },
      blue: {
        title: "Plumb Bob", who: "soldier",
        lines: [
          ["soldier", "Master Jun, found a plumb bob on the north road."],
          ["soldier", "Blue line, blue stone weight. Hang it anywhere, it leans north."],
          ["hero", "...Dad's. He never plumbed a wall with anyone else's."],
        ],
        q: "It sways in your hand, then points north again.",
        take: { t: "I'll take it. Where it points, I go.", re: [["soldier", "Will you... come back?"], ["hero", "I will. There's work on the Wall."]] },
        refuse: { t: "Hang it on the East Wall. Let it watch for Dad.", re: [["soldier", "Yes. ...There's a cloth bundle under the Wall. Have a look."], ["narr", "Oilcloth around something old, marked with your father's name."]] },
      },
      green: {
        title: "Sprout by the Brick", who: "shitou",
        lines: [
          ["shitou", "Dad, the sprout made seeds."],
          ["shitou", "It grew by my mud brick. The brick half melted and kept it safe."],
          ["shitou", "For you. Take it when you go north."],
        ],
        q: "Shitou's hands are caked in mud.",
        take: { t: "Okay. When I'm back, we plant it by the Wall.", re: [["shitou", "Where my brick used to be!"]] },
        refuse: { t: "Keep it. It grew beside your brick.", re: [["shitou", "...Then I'll water it every day."], ["narr", "That stretch of the Wall stood sturdier than the rest ever after."]] },
      },
    },
    hiddenPre: [
      { who: "narr", t: "A stretch of wall walks out of the northern rift. Black brick, forty-seven to a run, then offset." },
      { who: "narr", t: "Inside, someone counts bricks." },
      { who: "oldshi", t: "One, two, three..." },
      { who: "hero", t: "Dad. The East Wall's done. Come out and look." },
    ],
    quiet: [
      { who: "narr", t: "On the fifteenth night, nothing came out of the northern rift." },
      { who: "narr", t: "Dawn came slowly. First grey, then a faint yellow, as if through old paper." },
      { who: "hero", t: "Dawn. The East Wall's still here." },
      { who: "guizhi", t: "Noodles are ready." },
      { who: "hero", t: "There's still a wall up north to tear down. ...Next time." },
      { who: "bellman", t: "Morning bell—" },
    ],
    trueWin: [
      { who: "narr", t: "The black wall split down the middle. No bricks inside. Only a very old man, gripping one unlaid brick." },
      { who: "oldshi", t: "...The forty-eighth." },
      { who: "hero", t: "I laid it, Dad." },
      { who: "oldshi", t: "Laid it well." },
      { who: "narr", t: "Then the sun came up." },
      { who: "shitou", t: "Dad! The bricks are red in the sun!" },
      { who: "hero", t: "Mm. They always were." },
    ],
  },
};
