/* Li's story.
 * Three night sets: North Sky (the missing star and her father heading north), Granny (an old star-watcher going blind), Signal (flash a mirror north three times at midnight).
 */
export default {
  arcs: [
    {
      n: "North Sky",
      intro: [{ who: "hero", t: "One star is missing from the north sky. I was seven, on my first watch. I fell asleep a moment." }],
      nights: {
        1: [[9, "hero", "The stars are calm tonight. Calm nights need the most care."], [24, "hero", "The gap in the north sky is still there. I look there first, every night."]],
        2: [[12, "hero", "Powder underground... no star chart shows that."], [26, "hero", "I won't sleep. Not one blink tonight."]],
        3: [[11, "hero", "The stars keep the names of the dead. Hans's has been dim three years."]],
        4: [[3, "hero", "His fate-star belonged in the east. Now it's north, dragged by something."], [22, "hero", "North... everything goes north."]],
        5: [[11, "hero", "Greyrobe spent thirty years at the observatory. Watching stars, he learned to hide the sun."], [26, "hero", "Granny says he borrowed star charts. Never returned one."]],
        6: [[10, "hero", "Their arcs follow the watchers' meteor reckoning exactly."], [26, "hero", "Three steps left. ...One more."]],
        7: [[6, "hero", "The longest night. Only a few stars left. I count them one by one."], [28, "hero", "Seven. Seven left. When I was seven, there were eight."]],
        8: [[10, "hero", "Yes. A big one. Overhead by tomorrow."], [26, "hero", "It's moving this way. ...No. Someone is carrying it."]],
      },
      talks: {
        1: {
          title: "Observatory", who: "popo",
          lines: [
            ["popo", "Li, tell me tonight's sky."],
            ["hero", "Seven north, three east. South, nothing visible."],
            ["popo", "And west?"],
            ["hero", "West... is behind mist."],
            ["popo", "Behind mist, still write it. Write “unseen.” Unseen is a kind of seeing."],
          ],
          q: "Granny's brush rests on the page, waiting.",
          ans: [
            { cat: "atk", t: "Write it. Tomorrow I'll clear the mist and look.", re: "Clear it? Child, you sound just like your father." },
            { cat: "def", t: "Write “unseen.” I'll watch till it shows.", re: "Good. Waiting is what star-watchers do best." },
            { cat: "tech", t: "A light moves in the western mist. Slow, like someone with a lamp.", re: "...Write that too. Hour and mark, clearly." },
          ],
        },
        3: {
          title: "Star Chart", who: "popo",
          lines: [
            ["popo", "Remember your first watch, at seven?"],
            ["hero", "Yes. I fell asleep."],
            ["popo", "You woke up crying. Said a star was lost because you didn't watch."],
            ["popo", "Your father held you and said it wasn't your fault. Next day, he went north."],
          ],
          q: "Granny strokes the blank on the chart. It's worn shiny.",
          ans: [
            { cat: "atk", t: "He went looking. I'll go too.", re: "You? ...Finish tonight's watch first." },
            { cat: "def", t: "I didn't watch it.", re: "Silly child." },
            { cat: "tech", t: "Was that star already very dim before I fell asleep?", re: "...You noticed." },
          ],
        },
        5: {
          title: "Forty Years", who: "popo",
          lines: [
            ["popo", "That star dimmed for forty years."],
            ["popo", "Your grandpa and I logged it, year by year, dimmer each year. The night you were seven, it finally went out."],
            ["popo", "I never told you. Your father said no. Let her think she lost it, he said, and she'll keep watching the sky."],
          ],
          q: "The wind rattles the star chart.",
          ans: [
            { cat: "atk", t: "Then I'll find it all the more. Not because I lost it.", re: "Mm. Because you want to see it." },
            { cat: "def", t: "...I've kept watching the sky. He was right.", re: "He's always right. He just never comes back." },
            { cat: "tech", t: "Forty years dimming... what drained it, bit by bit?", re: "Your father asked that too, before he left." },
          ],
        },
        7: {
          title: "Counting Stars", who: "bellman",
          lines: [
            ["bellman", "Li, watcher's rule: count the stars before dawn. Done?"],
            ["hero", "Seven."],
            ["bellman", "And seven hundred years ago?"],
            ["hero", "Granny's book says one thousand two hundred and four."],
          ],
          q: "Old Ji looks up. He sees nothing.",
          ans: [
            { cat: "atk", t: "Lend every light to my Carry.", re: "Done! The tower lamps too." },
            { cat: "def", t: "Send the kids to the cellar. Leave the Wall to us.", re: "Good. I'll lead them down." },
            { cat: "eco", t: "Pawn my instruments. I'll buy them back at dawn.", re: "Pawn them? I'll have to beg the broker to open up." },
          ],
        },
      },
    },
    {
      n: "Granny",
      intro: [{ who: "popo", t: "Li, read me tonight's sky. You're all the eyes I have left." }],
      nights: {
        1: [[9, "hero", "The stars are calm tonight. Calm nights need the most care."], [22, "hero", "Granny's waiting on the observatory for me to read. I have to live to read to her."]],
        2: [[12, "hero", "Powder underground... no star chart shows that."], [26, "hero", "Granny says what's missing from the chart gets added. One stroke tonight."]],
        3: [[11, "hero", "Hans's star has been dim three years."], [24, "hero", "Granny logged Hans once: the night he was born, a star lit in the north."]],
        4: [[3, "hero", "His fate-star belonged in the east."], [22, "narr", "On the observatory, someone strikes a copper plate three times."], [26, "hero", "(You strike back twice.)"]],
        5: [[11, "hero", "Greyrobe spent thirty years at the observatory."], [24, "hero", "He was Granny's student. She never speaks of him."]],
        6: [[10, "hero", "Their arcs follow the meteor reckoning exactly."], [22, "hero", "Granny taught that method to only two people. One is me."]],
        7: [[6, "hero", "The longest night. Only a few stars left. I count them one by one."], [28, "narr", "The copper plate rings three times."], [30, "hero", "(Twice. ...I'm okay, Granny.)"]],
        8: [[10, "hero", "A big one. Overhead by tomorrow."], [26, "hero", "Granny says it's no star. Stars don't walk."]],
      },
      talks: {
        1: {
          title: "Observatory", who: "popo",
          lines: [
            ["popo", "You're a quarter late today."],
            ["hero", "Trouble on the Wall."],
            ["popo", "The Wall's trouble is the Wall's. The sky's is only ours."],
            ["popo", "...Read. I'm waiting."],
          ],
          q: "Granny dips her copper brush. Her hand is steady.",
          ans: [
            { cat: "atk", t: "Tonight the sky's trouble needs the Wall's hands.", re: "Mm. Then mind both." },
            { cat: "def", t: "I won't be late again.", re: "Don't promise what you can't keep. Your father loved promising." },
            { cat: "tech", t: "North seven, east three, south mist. A new one in the west, very low.", re: "New? ...How low?" },
          ],
        },
        3: {
          title: "Copper Plate", who: "popo",
          lines: [
            ["popo", "I'll teach you a trick."],
            ["popo", "You on the Wall, me on the platform. Three strikes asks: are you well? Two strikes means yes."],
            ["popo", "And if you don't strike at all... I'll know."],
          ],
          q: "She presses a small copper plate into your hand.",
          ans: [
            { cat: "atk", t: "I'll strike twice. Every time.", re: "Keep your word." },
            { cat: "def", t: "Don't go up the platform. It's windy.", re: "Windy up there. You see far." },
            { cat: "tech", t: "What if I strike four?", re: "Four? ...Means you saw what you shouldn't. Run." },
          ],
        },
        5: {
          title: "The Student", who: "popo",
          lines: [
            ["popo", "I taught Greyrobe."],
            ["popo", "Best memory, fastest reckoning. He asked why stars dim. I said I didn't know."],
            ["popo", "He said: then I'll find the answer at the Academy. He left. Never came back."],
          ],
          q: "Granny's finger draws a circle on the table, then wipes it away.",
          ans: [
            { cat: "atk", t: "The answer he found was to cover the sky.", re: "...Was it. I thought he'd find a better one." },
            { cat: "def", t: "You owe him nothing.", re: "A teacher always feels she owes something." },
            { cat: "tech", t: "The chart he borrowed. What year was it?", re: "Seven hundred years ago. When the north sky was full." },
          ],
        },
        7: {
          title: "Seeing for Herself", who: "popo",
          lines: [
            ["popo", "No need to read to me tonight."],
            ["popo", "I'll look myself. My eyes are failing, but tonight I want to see once."],
            ["popo", "Help me up."],
          ],
          q: "Her hand is light, like an old page.",
          ans: [
            { cat: "atk", t: "I'll help you up. Then I'll go light the sky for you.", re: "Good. I'll wait." },
            { cat: "def", t: "I'll carry you up. Sit and watch. I'll block the wind.", re: "Carry me? I carried you when you were small." },
            { cat: "tech", t: "The new one up north. Is it a star?", re: "...No. Stars aren't this warm." },
          ],
        },
      },
    },
    {
      n: "Signal",
      intro: [{ who: "hero", t: "At midnight, flash a mirror north three times. A watcher family rule. No one knows who it's for." }],
      nights: {
        1: [[9, "hero", "The stars are calm tonight."], [24, "hero", "Midnight. North. Three flashes."]],
        2: [[12, "hero", "Powder underground... no star chart shows that."], [24, "hero", "Midnight, three. ...No reply. Never any."]],
        3: [[11, "hero", "Hans's star has been dim three years."], [24, "hero", "A light blinked in the north. My eyes, surely."]],
        4: [[3, "hero", "His fate-star belonged in the east."], [24, "hero", "The north blinked again. Three. ...Someone's answering."]],
        5: [[11, "hero", "Greyrobe spent thirty years at the observatory."], [24, "hero", "The north light flashed four times tonight. What does four mean?"]],
        6: [[10, "hero", "Their arcs follow the meteor reckoning exactly."], [24, "hero", "The north light is closer. It's heading south."]],
        7: [[6, "hero", "The longest night. I count them one by one."], [24, "hero", "Midnight. I flash three, the north flashes three, then one more, faint."]],
        8: [[10, "hero", "Yes. A big one. Overhead by tomorrow."], [26, "hero", "The north light didn't answer tonight."]],
      },
      talks: {
        1: {
          title: "The Mirror", who: "soldier",
          lines: [
            ["soldier", "Miss Li, you flash a mirror north every night. Who are you talking to?"],
            ["hero", "I don't know."],
            ["soldier", "You don't know?"],
            ["hero", "Watcher family rule. Three at midnight, seven hundred years. No one's answered."],
          ],
          q: "The recruit glances north. Only black.",
          ans: [
            { cat: "atk", t: "You flash tonight. Hard, so it sees.", re: "Yes! ...My hand shook. That was four." },
            { cat: "def", t: "Flash even with no answer. Someone might be waiting.", re: "...Then I'll wait with you." },
            { cat: "tech", t: "No answer in seven hundred years, yet the rule holds. Someone believes.", re: "Believes what?" },
          ],
        },
        3: {
          title: "Observatory", who: "popo",
          lines: [
            ["popo", "You say the north answered?"],
            ["hero", "Three. Same as mine."],
            ["popo", "...When your father left, he took a mirror."],
            ["popo", "I always thought it was to light his way."],
          ],
          q: "Granny's hands are shaking.",
          ans: [
            { cat: "atk", t: "Then I go north and follow the light.", re: "No. ...Finish tonight's watch first." },
            { cat: "def", t: "I'll flash again tomorrow. Not one night missed.", re: "Mm. Don't miss one." },
            { cat: "tech", t: "The light's on the ground, not the sky. He's walking.", re: "Walking... then he's alive." },
          ],
        },
        5: {
          title: "Four", who: "popo",
          lines: [
            ["popo", "Four?"],
            ["hero", "The north flashed four tonight."],
            ["popo", "Four strikes on the plate. I taught that. Saw what you shouldn't. Run."],
            ["popo", "I taught that signal to only two people."],
          ],
          q: "The wind on the observatory stops.",
          ans: [
            { cat: "atk", t: "He's telling me to run. I won't.", re: "...You two, each more stubborn than the other." },
            { cat: "def", t: "If he says run, it's dangerous where he is.", re: "So he's shielding you." },
            { cat: "tech", t: "Who's the other one?", re: "Greyrobe." },
          ],
        },
        7: {
          title: "Lamp in the North", who: "bellman",
          lines: [
            ["bellman", "Li, I saw that north light from the tower too."],
            ["bellman", "Sixty years, and first time I've seen a lamp up north."],
            ["bellman", "Who do you think lit it?"],
          ],
          q: "Old Ji's hand rests on the bell rope.",
          ans: [
            { cat: "atk", t: "Lend me every light. I'll light it a big one back.", re: "Done! Every tower lamp is yours tonight." },
            { cat: "def", t: "Ring the bell, Old Ji. Let it hear someone's here.", re: "Good. I'll ring it loud." },
            { cat: "eco", t: "Pawn my instruments for oil. Let the north see us.", re: "Pawn away. Out comes my burial money too." },
          ],
        },
      },
    },
  ],
  talks: {
    9: {
      title: "The Last Night", who: "popo",
      lines: [
        ["popo", "Last night. I'm on the platform tonight, you on the Wall."],
        ["popo", "Got your copper plate?"],
        ["hero", "Yes."],
        ["popo", "Three, then two. Don't forget."],
      ],
      q: "She touches your face, as if fixing a star's place.",
      ans: [
        { cat: "atk", t: "I'll strike twice. Then go light the sky.", re: "Go. I'll watch from the platform." },
        { cat: "def", t: "Don't go up. Wait for me inside.", re: "No sky inside. I'm going up." },
        { cat: "tech", t: "Tonight I'll add a new stroke to your chart.", re: "...Add it. I've waited my whole life for it." },
      ],
    },
  },
  bosses: {
    eye: {
      beats: [[4, "hero", "The sun you hid, I've kept its place on my chart."], [26, "hero", "There's light in its pupil. ...The light of the north star."]],
      win: [
        { who: "narr", t: "The eye closed. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "The north star is back. Tonight the watchers' log can be full." },
        { who: "popo", t: "Read them to me. One by one." },
      ],
    },
    brood: {
      beats: [[4, "hero", "A nest... there's always been a black patch on the chart. It was this."], [24, "hero", "Every egg on it holds a speck of starlight."]],
      win: [
        { who: "narr", t: "The brood curled up and moved no more. From the rift in the north, a thread of grey-white light." },
        { who: "narr", t: "For the first time in seven hundred years, Dawnbell's bell rang at morning." },
        { who: "hero", t: "The eggs broke. Starlight leaks out, drifting skyward." },
        { who: "hero", t: "Granny, log a few more stars tonight." },
      ],
    },
    mutebell: {
      beats: [[4, "hero", "Every strike, a star on the chart trembles."], [24, "hero", "Granny, the copper plate! Strike against it!"]],
      win: [
        { who: "narr", t: "the Great Bell fell on the snow outside the city and rang once. The morning bell. The northern sky lit by a thread." },
        { who: "bellman", t: "It rang... the Great Bell rang." },
        { who: "hero", t: "When the bell rang, a star lit in the north." },
        { who: "popo", t: "Log it. Hour and mark, clearly." },
      ],
    },
    mistmother: {
      beats: [[9, "hero", "The mist hides every star. It doesn't want us to know where we are."], [22, "hero", "Granny, strike the plate. ...Strike it."]],
      win: [
        { who: "narr", t: "The mist lifted. For the first time, the Wall could see far. On the horizon, a thread of grey." },
        { who: "narr", t: "On the observatory, the copper plate rang three times." },
        { who: "hero", t: "(You strike twice.)" },
        { who: "popo", t: "...Good. Good." },
      ],
    },
    siegelord: {
      beats: [[5, "hero", "Each step it takes, the horizon draws an inch closer."], [28, "hero", "The flagpole on its gatehouse points at the gap in the north sky."]],
      win: [
        { who: "narr", t: "That city fell before this city's gate. Beneath its shadow, light showed for the first time." },
        { who: "hero", t: "As it fell, the flagpole still pointed north." },
        { who: "hero", t: "I know. I'll go." },
      ],
    },
  },
  full: {
    noDawn: [
      { who: "narr", t: "The light did not come." },
      { who: "hero", t: "On the chart, the sun's square is still empty." },
      { who: "popo", t: "Let it be empty. Empty squares are for people to fill." },
    ],
    nights: {
      10: [[4, "hero", "The morning bell rang, and it's still dark. The north gap burns tonight."], [24, "hero", "Midnight. I flashed three. The north flashed three back."]],
      11: [[6, "hero", "Footprints on the north road, a drag mark beside them, like something heavy."], [26, "hero", "Dad, what are you carrying?"]],
      12: [[4, "hero", "Another one. It's blocking the north light."], [28, "hero", "Move. My father's behind you."]],
      13: [[8, "hero", "A sprout by the Wall. Its leaves face north."], [24, "narr", "On the observatory, the copper plate rang three times."], [26, "hero", "(Twice.)"]],
      14: [[6, "hero", "Everyone's on the Wall. Granny too, on the platform, the plate on her knees."], [22, "popo", "Li! The edge! The eastern edge of the sky!"], [34, "hero", "That's no star. ...That's where the sun will rise."]],
      15: [[4, "hero", "Dad."], [18, "hero", "It's too heavy to carry alone. I'm here."]],
    },
    talks: {
      11: {
        title: "The Blank in the Chart", who: "popo",
        lines: [
          ["popo", "Before he left, your father wrote a line in the chart's blank. I never showed you."],
          ["narr", "Tiny letters, squeezed in the blank's corner."],
          ["narr", "“It isn't lost. It fell. I'm going to pick it up.”"],
          ["popo", "He never said lost. Stars don't get lost, he said. They only fall."],
        ],
        q: "Granny rolls up the chart and hands it to you.",
        ans: [
          { cat: "atk", t: "What fell gets picked up. I'll go.", re: "Go. ...Take the copper plate." },
          { cat: "def", t: "I'll keep the chart. We'll fill it in when we're back.", re: "Good. I'll wait on the platform for you both." },
          { cat: "tech", t: "It fell into the northern rift... so the north light is the star.", re: "It is. And him." },
        ],
      },
    },
    gems: {
      red: {
        title: "Heart of a Meteor", who: "soldier",
        lines: [
          ["soldier", "Miss Li, a meteor fell from the north. Hit outside the Wall."],
          ["soldier", "We went to fetch it. The shell's shattered. Just a core left, red, still hot."],
          ["hero", "...A fallen star with a red core. Granny says it hasn't cooled yet."],
        ],
        q: "The red core pulses in your hand.",
        take: { t: "Give it here. It's still warm. I'll send it back.", re: [["soldier", "B-back to the sky?"], ["hero", "Mm."]] },
        refuse: { t: "Bury it by the Wall. Let it cool here. That's landing too.", re: [["soldier", "Yes. ...Digging, we turned up some old coppers."], ["narr", "Coins stamped with stars, seven hundred years old."]] },
      },
      blue: {
        title: "Granny's Lens", who: "popo",
        lines: [
          ["popo", "This lens passed down the watchers, generation to generation. Blue glass, ground for seven hundred years."],
          ["popo", "My eyes are gone. It's no use to me."],
          ["popo", "Take it. Look north through it, and you'll see your father."],
        ],
        q: "The lens is cool, blue as the sky before dark.",
        take: { t: "I'll take it. I'll look for you and read it back.", re: [["popo", "Good. Don't miss a word."]] },
        refuse: { t: "Keep it, Granny. At dawn you need to see for yourself.", re: [["popo", "...Silly child. Then take this."], ["narr", "Granny's copper plate. Its rim struck shiny, three dents in it."]] },
      },
      green: {
        title: "Northern Moss", who: "popo",
        lines: [
          ["popo", "The sprout by the Wall made seeds."],
          ["popo", "I felt it. Moss on one side of the seed. Moss only grows north."],
          ["popo", "As a boy your father said moss is the lost man's star."],
        ],
        q: "Granny sets the seed in your palm and presses your fingers closed.",
        take: { t: "I'll take it. It points north. I go north.", re: [["popo", "Mm. Don't get lost."]] },
        refuse: { t: "Keep it, Granny. When we're back, plant it under the observatory.", re: [["popo", "...Then I'll plant it for you."], ["narr", "That stretch of the Wall stood sturdier than the rest ever after."]] },
      },
    },
    hiddenPre: [
      { who: "narr", t: "A star rises from the northern rift. Bright, its light cold." },
      { who: "narr", t: "Beneath it, a man carries it on his back, step by step, south." },
      { who: "lifa", t: "...Li?" },
      { who: "hero", t: "Dad. I'll help you carry it." },
    ],
    quiet: [
      { who: "narr", t: "On the fifteenth night, nothing came out of the northern rift." },
      { who: "narr", t: "Dawn came slowly. First grey, then a faint yellow, as if through old paper." },
      { who: "hero", t: "It's dawn. The gap in the north sky is still empty." },
      { who: "popo", t: "Let it be empty." },
      { who: "hero", t: "At midnight, I'll still flash north three times." },
      { who: "bellman", t: "Morning bell—" },
    ],
    trueWin: [
      { who: "narr", t: "The Fallen Star stopped struggling. It rose slowly, higher and higher." },
      { who: "lifa", t: "Li. I couldn't lift it because it takes two." },
      { who: "hero", t: "Granny said so. Stars are for two to watch." },
      { who: "narr", t: "The star settled in the north sky's empty place. Then the sun came up." },
      { who: "narr", t: "On the observatory, the copper plate rang three times." },
      { who: "hero", t: "(Twice. ...Granny, twice.)" },
    ],
  },
};
