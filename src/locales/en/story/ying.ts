/* Ying's story.
 * Three night sets: Master (Master Qin, three years out of town), A-He (the boy who sells lamp oil), Lantern Fair (Douzi, the kid learning to paste paper lanterns).
 */
export default {
  arcs: [
    {
      n: "Master",
      intro: [{ who: "hero", t: "The day Master left, he said: oil's topped up, back before dark. I've topped it up for three years." }],
      nights: {
        1: [[9, "hero", "First night? Don't be scared. I've lit every lamp."], [24, "hero", "The lamp east of the bell tower is the last one Master hung. It's dimmer. I can't bear to change the wick."]],
        2: [[12, "hero", "Something grinds underground, like rusty gears. Master hated rusty gears."]],
        3: [[11, "hero", "Grandpa Hans... he used to carry my ladder every day."], [24, "hero", "Master said when someone goes, the lamp shines for them. Hans's lamp gets an extra spoon of oil tonight."]],
        4: [[3, "hero", "That shield... Uncle Karl always polished it to a shine."], [22, "hero", "Uncle Karl came to the tower every night to play chess with Master. He always lost."]],
        5: [[11, "hero", "Greyrobe? The day Master left, he went to the Academy to find him."], [26, "hero", "Master, did you find him?"]],
        6: [[10, "hero", "Their catapult gears mesh the way Master's do."], [24, "hero", "Only Master gives gears odd teeth. He said even gears, turned long enough, give up."]],
        7: [[6, "hero", "The kids are hauling bricks. I'll light every stretch of the Wall."], [30, "hero", "Master's pocket watch ran three minutes fast tonight. It never runs fast."]],
        8: [[10, "hero", "Then I'll trim the lamps brighter, so the one behind sees someone's here."], [26, "hero", "Gears turn in the dark. Slowly, like someone winding a spring."]],
      },
      talks: {
        1: {
          title: "Under the Bell Tower", who: "bellman",
          lines: [
            ["bellman", "Little Ying, lighting lamps again?"],
            ["bellman", "If your master saw you on the Wall, he'd scold me for not stopping you."],
            ["hero", "He wouldn't scold you. He'd scold me for trimming the wick crooked."],
            ["bellman", "...True enough. That mouth of his."],
          ],
          q: "Old Ji steadies the ladder for you.",
          ans: [
            { cat: "atk", t: "Once the lamps are lit, I'll help on the Wall.", re: "Go on. I'll carry the ladder." },
            { cat: "def", t: "Not one lamp on the Wall goes out. If one does, I'll light another.", re: "All right. I'll watch this one on the tower for you." },
            { cat: "eco", t: "Old Ji, lamp oil went up again. Can the tower spare some funds?", re: "Tower funds? I haven't been paid for last year yet." },
          ],
        },
        3: {
          title: "Workshop", who: "soldier",
          lines: [
            ["soldier", "Miss Ying, aren't you scared at all?"],
            ["hero", "Of course I am."],
            ["hero", "I was scared of the dark as a kid, so Master taught me to fix lamps. He said busy hands don't have time to be scared."],
            ["soldier", "So now you..."],
          ],
          q: "The recruit eyes the half-taken-apart lamp in your hands.",
          ans: [
            { cat: "atk", t: "I'm scared. That's why I strike first.", re: "...I'll try that too." },
            { cat: "def", t: "Guard this lamp. While it's lit, you're fine.", re: "Yes! I'll guard it." },
            { cat: "tech", t: "Here, hold this wick. Busy hands, no fear.", re: "...It's gone. How strange." },
          ],
        },
        5: {
          title: "A Voice in the Wall", who: "greyrobe",
          lines: [
            ["greyrobe", "The lampmaker's apprentice."],
            ["greyrobe", "Your master is with me, mending something for me. Three years, and still not done."],
            ["greyrobe", "He asked me to pass on: don't fill the oil too high, it spills."],
          ],
          q: "Master said those words every single morning.",
          ans: [
            { cat: "atk", t: "Give him back.", re: "He doesn't want to come back. Believe it or not." },
            { cat: "def", t: "(You take your ear from the crack and keep trimming wicks.)", re: "...As stubborn as he is." },
            { cat: "tech", t: "What is he mending?", re: "A lamp. Light it, and the whole Abyss comes to it." },
          ],
        },
        7: {
          title: "The Tower Key", who: "bellman",
          lines: [
            ["bellman", "Go on. Your master's lamp has burned on the tower all along."],
            ["hero", "I'm the one adding oil."],
            ["bellman", "I know. But to me, it's always been his lamp."],
            ["bellman", "The day he left, he told me: if Ying ever takes the Wall, don't stop her."],
          ],
          q: "Old Ji hands you the bell tower key.",
          ans: [
            { cat: "atk", t: "Lend me every lamp in the city.", re: "All yours. Tonight this city is one lamp." },
            { cat: "def", t: "A lamp on every stretch of the Wall.", re: "Good. I'll rouse folk and light them one by one." },
            { cat: "eco", t: "All my savings go to lamp oil.", re: "Ha. Then out comes my burial money too." },
          ],
        },
      },
    },
    {
      n: "A-He",
      intro: [{ who: "ahe", t: "The oil, the b-barrels are under the stairs. It's clean this time, n-no water in it." }],
      nights: {
        1: [[9, "hero", "First night? Don't be scared. I've lit every lamp."], [22, "ahe", "Ying! Two lamps out on the e-east stretch, I'll fill them!"]],
        2: [[12, "hero", "Something grinds underground, like rusty gears."], [24, "ahe", "I-I'm not going down, it's dark. ...Fine. I'm going."]],
        3: [[11, "hero", "Grandpa Hans used to carry my ladder every day."], [24, "ahe", "Ying, don't look. I'll look for you, and tell you after."]],
        4: [[3, "hero", "That shield... Uncle Karl always polished it to a shine."], [18, "ahe", "Brought up two barrels! Where do I pour?"]],
        5: [[11, "hero", "Greyrobe? The day Master left, he went to the Academy to find him."], [24, "ahe", "The Academy... buys oil from us every month. Loads of it."]],
        6: [[10, "hero", "Their catapults... they're built from our blueprints!"], [22, "ahe", "A b-barrel got smashed! It's fine, there's more!"]],
        7: [[6, "hero", "The kids are hauling bricks. I'll light every stretch of the Wall."], [20, "ahe", "Ying, my dad gave away all the shop's oil. He says p-put it on your tab."]],
        8: [[10, "hero", "Then I'll trim the lamps brighter."], [24, "ahe", "If dawn comes tomorrow, I-I've got something to tell you."], [28, "hero", "Tell me now. ...No. Tomorrow."]],
      },
      talks: {
        1: {
          title: "Oil Shop Back Door", who: "ahe",
          lines: [
            ["ahe", "Th-this barrel's half price for you."],
            ["hero", "Does your dad know?"],
            ["ahe", "He knows I sold it. Not for how much."],
            ["ahe", "Lamp oil's for lamps anyway. You light the lamps, so it's, it's for you."],
          ],
          q: "A-He counts coppers with his head down. Three times.",
          ans: [
            { cat: "atk", t: "Two more barrels. We're setting fires tonight.", re: "F-fires? ...Okay, I'll haul them." },
            { cat: "def", t: "Don't let your dad catch you. I won't save you from a beating.", re: "H-he can't hit hard. His hands are all oily. Slippery." },
            { cat: "eco", t: "No half price. Full price. Your family has to eat too.", re: "Th-then I'll pour you an extra half spoon. Don't look." },
          ],
        },
        3: {
          title: "Under the Stairs", who: "ahe",
          lines: [
            ["ahe", "Ying, I-I'm actually really scared of the dark."],
            ["ahe", "Dad sold oil all his life but never let us burn a lamp. When I woke at night as a kid, I couldn't see a thing."],
            ["ahe", "Then your master hung a lamp by our door. D-didn't charge a coin."],
          ],
          q: "He looks up, his face bright in the lamplight.",
          ans: [
            { cat: "atk", t: "Then tonight, stand where the lamps are thickest.", re: "Okay. ...C-can I stand next to you?" },
            { cat: "def", t: "That lamp's still by your door. I change the wick every month.", re: "...That was you? I-I thought it just never went out." },
            { cat: "tech", t: "Those who fear the dark know where lamps belong. Which stretch is darkest?", re: "W-west. The corner. I've wanted to say so for ages." },
          ],
        },
        5: {
          title: "Oil Shop", who: "ahe",
          lines: [
            ["ahe", "The Academy buys oil every month. Loads of it, the very best."],
            ["ahe", "Dad asked what it's for. They said: lamps."],
            ["ahe", "But Ying, those Academy windows haven't lit up once in seven years. N-not once."],
          ],
          q: "A-He tallies on his fingers.",
          ans: [
            { cat: "atk", t: "Next time they buy, cut the oil with chili water.", re: "Ch-chili water? ...Good idea." },
            { cat: "def", t: "Don't ask. You can't cross the Academy.", re: "I-I'm only telling you." },
            { cat: "tech", t: "That much oil, and no lamps lit. They're burning something else.", re: "B-burning what?" },
          ],
        },
        7: {
          title: "Before the Longest Night", who: "ahe",
          lines: [
            ["ahe", "Dad gave away all the shop's oil."],
            ["ahe", "He says it's p-payment for your master's lamp."],
            ["ahe", "Ying, after tonight... I-I've got something to tell you."],
          ],
          q: "He grips a new wick so tight it crumples.",
          ans: [
            { cat: "atk", t: "After tonight. Get the oil up first.", re: "Right! G-getting it up!" },
            { cat: "def", t: "Stand by me tonight. Talking can wait till tomorrow.", re: "Mm. Tomorrow." },
            { cat: "eco", t: "Thank your dad for me. I'll keep the tab; we settle at dawn.", re: "N-no need... fine. Keep it." },
          ],
        },
      },
    },
    {
      n: "Lantern Fair",
      intro: [{ who: "douzi", t: "Sister Ying! My paper lantern's done! Look, look, how high can it fly?" }],
      nights: {
        1: [[9, "hero", "First night? Don't be scared. I've lit every lamp."], [24, "narr", "Under the bell tower, kids hold up paper lanterns and count: one, two, three..."]],
        2: [[12, "hero", "Something grinds underground, like rusty gears."], [26, "hero", "Douzi's gang hung all their paper lanterns on the east stretch tonight. They're pretty."]],
        3: [[11, "hero", "Grandpa Hans used to carry my ladder every day."], [22, "hero", "Douzi asked if we should make one for Grandpa Hans too. I said yes."]],
        4: [[3, "hero", "That shield... Uncle Karl always polished it to a shine."], [26, "douzi", "Sister Ying, that knight's shield has a scorch mark from my lantern!"]],
        5: [[11, "hero", "Greyrobe? The day Master left, he went to the Academy to find him."], [24, "hero", "Are the kids all in the cellar? ...Where's Douzi?"]],
        6: [[10, "hero", "Their catapults... they're built from our blueprints!"], [20, "douzi", "I didn't go down! I'm helping Grandpa Ji ring the bell!"]],
        7: [[6, "hero", "The kids are hauling bricks. I'll light every stretch of the Wall."], [16, "soldier", "Miss Ying, your students are here too!"], [28, "douzi", "Sister Ying, at dawn we hold the Lantern Fair! You promised!"]],
        8: [[10, "hero", "Then I'll trim the lamps brighter, so the one behind sees someone's here."], [26, "hero", "If dawn comes tomorrow, the fair goes under the bell tower."]],
      },
      talks: {
        1: {
          title: "Lantern Class", who: "douzi",
          lines: [
            ["douzi", "Sister Ying, why doesn't the paper catch fire?"],
            ["hero", "The flame's in the middle, the paper's outside, and warm air sits between."],
            ["douzi", "Then why is there no lamp in the sky?"],
            ["hero", "...There used to be a very big one."],
          ],
          q: "Douzi gapes through his missing front tooth, waiting.",
          ans: [
            { cat: "atk", t: "The things outside the Wall ate it. We'll take it back.", re: "Take it back! I'll help!" },
            { cat: "def", t: "It's asleep. Hush, don't wake it.", re: "(Douzi claps a hand over his mouth.)" },
            { cat: "tech", t: "So we make our own. Make enough, and it'll be day.", re: "Then I'll make ten today!" },
          ],
        },
        3: {
          title: "Lantern Class", who: "douzi",
          lines: [
            ["douzi", "Sister Ying, I want to make a lantern that flies into the sky."],
            ["douzi", "Up to the highest place, to stand watch for the big one a while."],
            ["hero", "A sky lantern. Master taught me. I've never got one to work."],
          ],
          q: "Douzi hands you a crumpled page with a big, lopsided lamp drawn on it.",
          ans: [
            { cat: "atk", t: "Once it works, we fly it north and light them up to hit.", re: "Yeah! Light them up!" },
            { cat: "def", t: "Small ones first. If small ones stay lit, big ones fly.", re: "...Fine. Small ones." },
            { cat: "tech", t: "Mulberry paper, bamboo strips. Not one strip too many.", re: "I'll find bamboo! Grandpa Ji has a broom!" },
          ],
        },
        5: {
          title: "Cellar Door", who: "douzi",
          lines: [
            ["douzi", "I'm not going down. There's no lamp in the cellar."],
            ["douzi", "You said it. Where the lamps are, that's where people are."],
            ["hero", "...I did say that."],
          ],
          q: "Douzi hugs his paper lantern at the cellar door.",
          ans: [
            { cat: "atk", t: "Then help Old Ji ring the bell. The tower's brightest.", re: "Yes! I'll ring the bell!" },
            { cat: "def", t: "I'll hang one down there. Go down and guard it for me.", re: "...Then I'll guard it. If it goes out, I'll light it." },
            { cat: "eco", t: "Go down, and I'll give you two coppers for candy.", re: "Three. ...Okay, two." },
          ],
        },
        7: {
          title: "The Promise", who: "douzi",
          lines: [
            ["douzi", "Sister Ying, let's hold the Lantern Fair at dawn!"],
            ["douzi", "One lantern for every kid in the city, all over the bell tower."],
            ["douzi", "When your master comes back, he'll see it right away."],
          ],
          q: "You crouch and help him straighten his lantern's frame.",
          ans: [
            { cat: "atk", t: "We'll hold it. Tonight I chase off what's outside.", re: "Pinky swear!" },
            { cat: "def", t: "We'll hold it. You hang the first lantern.", re: "The first one! Really?" },
            { cat: "eco", t: "We'll hold it. I'll buy the paper and candles.", re: "I-I have one copper too! Here!" },
          ],
        },
      },
    },
  ],
  talks: {
    9: {
      title: "The Last Night", who: "bellman",
      lines: [
        ["bellman", "Last night. I'll watch your master's lamp for you tonight."],
        ["hero", "Old Ji, do you think he can hear the bell?"],
        ["bellman", "He can. Before he left he said: when the bell rings, he'll know the hour."],
        ["bellman", "He said he'd have to time his return, or you'd stay up waiting again."],
      ],
      q: "The tower wind sets the lamp swaying.",
      ans: [
        { cat: "atk", t: "Then ring it louder tonight.", re: "Loud! With everything I've got." },
        { cat: "def", t: "You guard the bell. I'll guard the lamps.", re: "Deal." },
        { cat: "eco", t: "Spend what's left of the oil money.", re: "Spend it! Keep nothing." },
      ],
    },
  },
  bosses: {
    eye: {
      beats: [[4, "hero", "You swallowed the sun. Then from here I'll light it back, lamp by lamp."], [26, "hero", "It's blinking. It fears light. Every lamp in the city, light them!"]],
      win: [
        { who: "narr", t: "The eye closed. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "Every lamp in the city still burns. Master, can you see? It's dawn." },
        { who: "hero", t: "...The lamps can go out now. I can't bear to put them out." },
      ],
    },
    brood: {
      beats: [[4, "hero", "So big... but it fears light too, right?"], [24, "hero", "The bugs crawl where the lamps are few. Then light them everywhere!"]],
      win: [
        { who: "narr", t: "The brood curled up and moved no more. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "It's dawn. I counted. Not one lamp on the Wall went out." },
        { who: "hero", t: "Not one, Master." },
      ],
    },
    mutebell: {
      beats: [[4, "hero", "Master said Dawnbell once had seven bells. Only six hang in the tower."], [24, "hero", "The music box! Yes, that's the tune!"]],
      win: [
        { who: "narr", t: "the Great Bell fell on the snow outside the city and rang once. The morning bell. The northern sky lit by a thread." },
        { who: "bellman", t: "It rang... the Great Bell rang." },
        { who: "hero", t: "Its note matches the last bar of Master's music box exactly." },
        { who: "hero", t: "Master, are you listening too?" },
      ],
    },
    mistmother: {
      beats: [[9, "hero", "I heard Master cough. ...He never coughs at night."], [22, "hero", "A-He, don't walk into the mist! That's not your dad!"]],
      win: [
        { who: "narr", t: "The mist lifted. For the first time, the Wall could see far. On the horizon, a thread of grey." },
        { who: "hero", t: "The mist left a pair of reading glasses. I wrapped the arms with copper wire." },
        { who: "hero", t: "I'll keep them. Give them back when he comes home." },
      ],
    },
    siegelord: {
      beats: [[5, "hero", "Those gears turn backward, like a clock running in reverse."], [28, "hero", "The lamp on its gatehouse is Master's work! Take it down, don't break it!"]],
      win: [
        { who: "narr", t: "That city fell before this city's gate. Beneath its shadow, light showed for the first time." },
        { who: "hero", t: "I took the lamp down. The shade is carved with one word: Qin." },
        { who: "hero", t: "Master, where are you?" },
      ],
    },
  },
  full: {
    noDawn: [
      { who: "narr", t: "The light did not come." },
      { who: "hero", t: "...The lamps are still lit. They're still lit." },
      { who: "bellman", t: "Child, your master's lamp went out on its own this morning." },
      { who: "hero", t: "I'll light it. I'll light it again." },
    ],
    nights: {
      10: [[4, "hero", "The morning bell rang, and it's still dark. I relit Master's lamp three times."], [24, "hero", "Lamps are dying in the north. One by one, coming this way."]],
      11: [[6, "hero", "Footprints on the north road. One deep, one shallow. Someone dragging a leg."], [26, "hero", "Master's left leg aches whenever it rains."]],
      12: [[4, "hero", "Another one. They all tick with gears."], [28, "hero", "I'll hold the lamp higher, so they see I'm not afraid."]],
      13: [[8, "douzi", "Sister Ying! A sprout by the Wall! I made it a little lampshade!"], [24, "hero", "Douzi, your shade is better than the ones Master taught me."]],
      14: [[6, "hero", "Every lamp in the city is lit. Not one held back."], [22, "ahe", "Oil! Last two barrels! Ying, catch!"], [34, "hero", "There's color at the sky's edge... not lamp-color."]],
      15: [[4, "hero", "Master."], [18, "hero", "Wherever you walk, the lamps die. Then I'll follow and light them back, one by one."]],
    },
    talks: {
      11: {
        title: "Master's Letter", who: "bellman",
        lines: [
          ["bellman", "Your master left this at the tower the day he went. He said: give it to her when dawn should come and doesn't."],
          ["narr", "The letter holds only a few lines."],
          ["narr", "“Ying: the Academy says the Abyss follows the light. I'm going to ask if it's true.”"],
          ["narr", "“If it is, I'll lead it away. Don't follow. Keep lighting lamps. The lamps can't go out; we can't stop.”"],
        ],
        q: "There's an oil smudge on the page, from topping up a lamp.",
        ans: [
          { cat: "atk", t: "He's led it away three years. Now I go bring him home.", re: "Go. I'll watch the tower lamp." },
          { cat: "def", t: "Keep lighting lamps. He told me to keep lighting.", re: "Mm. ...You light. I'm here." },
          { cat: "tech", t: "It follows light... so wherever he is, there's not one lamp.", re: "So he hears the bell, but sees no lamps." },
        ],
      },
    },
    gems: {
      red: {
        title: "The Unfinished Lamp", who: "bellman",
        lines: [
          ["bellman", "Under the workshop cabinet: a red glass lampshade. Your master never finished it."],
          ["bellman", "I went to tidy up today and touched it. It's hot. No fire inside, and it's hot."],
          ["bellman", "He said this lamp was to be lit the day dawn came."],
        ],
        q: "The red glass beats in your hand like a heart.",
        take: { t: "Give it here. I'll finish it for him.", re: [["bellman", "Good. His lamp is yours to finish."]] },
        refuse: { t: "Put it back. He'll finish it when he's home.", re: [["bellman", "...Then take this. There's a purse in the cabinet. He saved it for your new tools."], ["narr", "The purse is stitched with a crooked lamp. You sewed it at eight."]] },
      },
      blue: {
        title: "Blue Fire", who: "ahe",
        lines: [
          ["ahe", "Ying, I-I found this under the oil vat."],
          ["ahe", "Dregs of the oil the Academy bought, burned down, set into this blue lump."],
          ["ahe", "It, it glows. Lit without lighting."],
        ],
        q: "A-He cups it in his palm, afraid to close his hand.",
        take: { t: "Give it here. A light that needs no lighting is just what I need.", re: [["ahe", "H-here. ...Careful, it's cold."]] },
        refuse: { t: "Keep it. You fear the dark. It can shine for you.", re: [["ahe", "...Then I'll keep it. While it shines, I'm not scared."], ["narr", "A-He saved the shop's last barrel of good oil for you."]] },
      },
      green: {
        title: "Sprout in a Lampshade", who: "douzi",
        lines: [
          ["douzi", "Sister Ying, the sprout by the Wall made seeds!"],
          ["douzi", "I never took its lampshade off. It grew up inside it."],
          ["douzi", "For you. At the fair, let's plant it under the bell tower."],
        ],
        q: "Douzi puts the seed in your palm, fingers sticky with paste.",
        take: { t: "Okay. We'll plant it together at the fair.", re: [["douzi", "Pinky swear!"]] },
        refuse: { t: "Keep it. It grew up in your lampshade.", re: [["douzi", "Th-then I'll watch it for you."], ["narr", "That stretch of the Wall stood sturdier than the rest ever after."]] },
      },
    },
    hiddenPre: [
      { who: "narr", t: "A man walks out of the northern rift. Gaunt, a winding key in his back, his face a lamp gone dark." },
      { who: "narr", t: "Where he passes, the lamps on the Wall go out one by one." },
      { who: "hero", t: "...Master." },
      { who: "hero", t: "You taught me. The lamps can't go out." },
    ],
    quiet: [
      { who: "narr", t: "On the fifteenth night, nothing came out of the northern rift." },
      { who: "narr", t: "Dawn came slowly. First grey, then a faint yellow, as if through old paper." },
      { who: "hero", t: "It's dawn. I couldn't bear to put out Master's lamp." },
      { who: "douzi", t: "Sister Ying, are we still having the fair?" },
      { who: "hero", t: "We are. And again when he's back." },
      { who: "bellman", t: "Morning bell—" },
    ],
    trueWin: [
      { who: "narr", t: "The Lampsnuffer knelt. Its spring unwound turn by turn, like one long breath." },
      { who: "qin", t: "...Ying. Is the oil topped up?" },
      { who: "hero", t: "Topped up, Master. For three years." },
      { who: "narr", t: "The music box played its last bar. Then the sun came up." },
      { who: "douzi", t: "The fair! Sister Ying, the fair!" },
      { who: "hero", t: "We'll hold it. Today." },
    ],
  },
};
