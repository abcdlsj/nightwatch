/* Ayla's story.
 * Three night sets: the Gate (Karl), Xiaoman, Old Chu. One set per run, cycling in order.
 * Battle lines are [seconds, speaker, line]; night talks are { title, who, lines, q, ans }; story pages are { who, t }.
 */
export default {
  arcs: [
    {
      n: 'The Gate',
      intro: [{ who: 'hero', t: 'The north gate key hangs at my belt. Three years, and it has never turned once.' }],
      nights: {
        1: [[3, 'hero', 'Wind pours through the cracks of the north gate. Shut three years now.'], [26, 'hero', 'The bolt is rattling. ...Just the wind.']],
        2: [[12, 'hero', 'Karl said: where the rats dig, the wall is soft. He read walls better than men.']],
        3: [[11, 'hero', 'Hans. The night Karl went out, you were on the Wall. Did he look back?'], [28, 'hero', 'Don\'t look at their faces. They aren\'t them anymore.']],
        4: [[3, 'hero', 'Karl. You promised me you\'d hold till dawn.'], [20, 'hero', 'Three hundred nights you stood outside that gate, and I stood inside. One plank of wood between us.']],
        5: [[11, 'hero', 'Greyrobe. Three years ago it was the Academy that said the north well was still safe.'], [24, 'hero', 'He called me "Old Ayla." Right to the end.']],
        6: [[10, 'hero', 'Save the heaviest weapon for the heaviest brute. Karl\'s words.'], [22, 'hero', 'East wall cracks, patch the east wall. The north gate... leave it.']],
        7: [[6, 'hero', 'Survive tonight, and only two nights remain.'], [30, 'hero', 'I still have the key. I still have it.']],
        8: [[10, 'hero', 'Something is driving them from behind. Karl would say: good, saves us hunting them one by one.'], [27, 'hero', 'Tomorrow, whatever comes, the gate stays shut.']],
      },
      talks: {
        1: {
          title: 'Under the Bell Tower', who: 'bellman',
          lines: [
            ['bellman', 'Have some soup. Too much ginger today, mind the bite.'],
            ['bellman', 'Still wearing that key. Three years that gate hasn\'t opened, and you polish it every day.'],
            ['hero', '...If it rusts, it won\'t open.'],
            ['bellman', 'And if it never opens, what\'s the difference?'],
          ],
          q: 'Old Ji waits for you to finish.',
          ans: [
            { cat: 'atk', t: 'No need to open it. What\'s outside will climb up on its own.', re: 'Then I\'ll boil two more pots of oil while they climb.' },
            { cat: 'def', t: 'It stays. If that gate ever opens, I\'ll be beside it.', re: '...All right. I\'ll be watching from the tower.' },
            { cat: 'eco', t: 'Maybe have the smith cut a spare. ...No. Forget it.', re: 'I\'ll pay for the spare. Whenever you\'re ready.' },
          ],
        },
        3: {
          title: 'Embrasure Three', who: 'soldier',
          lines: [
            ['soldier', 'Captain, I found this in a crack at embrasure three. A wooden bird, wings carved and all.'],
            ['hero', '...Whittled from an arrow shaft.'],
            ['soldier', 'You know it?'],
            ['hero', 'Karl\'s. His hands couldn\'t sit still on watch. Every ruined shaft became a bird. God knows how many are hidden in this wall.'],
          ],
          q: 'The recruit holds out the wooden bird.',
          ans: [
            { cat: 'atk', t: 'Keep it. When your hands shake, squeeze it and pull the trigger.', re: 'Yes, Captain! ...Its beak is crooked.' },
            { cat: 'def', t: 'Put it back. It\'s sat there for years. The Wall knows it.', re: 'Then I\'ll seal the crack tight so the wind can\'t take it.' },
            { cat: 'tech', t: 'See which way the head points. His birds always faced the stretch he worried about most.', re: 'It faces... the north gate.' },
          ],
        },
        5: {
          title: 'Barracks Corner', who: 'chu',
          lines: [
            ['chu', 'Sit. You smell of rust. It\'s done, then?'],
            ['hero', 'It\'s done.'],
            ['chu', 'Before he fell, what did he call you?'],
            ['hero', '"Old Ayla."'],
            ['chu', '...Only thing he ever called you. Twenty years, nothing else came easy to him.'],
          ],
          q: 'Old Chu fumbles you half a bowl of cold water.',
          ans: [
            { cat: 'atk', t: 'His sword was as fast as ever. I barely caught it.', re: 'Fast? That was haste. Rushed since boyhood. Twenty years, I never cured it.' },
            { cat: 'def', t: 'Nobody on the Wall saw. I had them all turn around.', re: 'Good. The recruits shouldn\'t see him like that.' },
            { cat: 'tech', t: 'His guard had new leather cord. Someone out there rewrapped it.', re: '...Then someone is still out there. Tell no one. Tell me first.' },
          ],
        },
        7: {
          title: 'Three Hundred Nights', who: 'bellman',
          lines: [
            ['bellman', 'Three hundred nights. I was up in the tower every night. When it went quiet, I could hear steel outside the north gate.'],
            ['bellman', 'Night three hundred and one, nothing. I rang the bell extra loud that night so you wouldn\'t notice.'],
            ['bellman', 'All three hundred nights, you stood behind that gate. I saw.'],
          ],
          q: 'Old Ji doesn\'t look at you. He looks north.',
          ans: [
            { cat: 'atk', t: 'Bring up every weapon we have tomorrow. He held three hundred nights. Tonight I hold.', re: 'All yours. Nothing held back tonight.' },
            { cat: 'def', t: 'Get the children into the cellar. The Wall is ours.', re: 'Right. If Xiaoman won\'t go down, I\'ll carry her.' },
            { cat: 'eco', t: 'Spend all the coin. Who are we saving it for?', re: 'Ha. Then I\'ll dig out my burial money too.' },
          ],
        },
      },
    },
    {
      n: 'Xiaoman',
      intro: [{ who: 'xiaoman', t: 'Captain, I\'ve hauled the water up. Can I stand behind you tonight? I won\'t make a sound.' }],
      nights: {
        1: [[5, 'xiaoman', 'Captain, the water jar\'s under embrasure three!'], [9, 'hero', 'Down. You hear me? Down.'], [25, 'xiaoman', 'I\'m on the stairs, not up top. ...Just one foot.']],
        2: [[12, 'hero', 'Xiaoman, dump that jar at the foot of the east wall. Now.'], [16, 'xiaoman', 'Done! It\'s steaming!']],
        3: [[11, 'hero', 'Xiaoman only learned to write Hans\'s name last month. Lots of strokes.'], [24, 'xiaoman', 'Captain, should I cross him out of my book? He... he got up again.']],
        4: [[3, 'hero', 'Karl. You promised me you\'d hold till dawn.'], [16, 'xiaoman', 'That knight... Captain, did he just say your name?'], [28, 'hero', 'Cover your ears.']],
        5: [[11, 'hero', 'Greyrobe? The Academy\'s head? He raised these dead.'], [26, 'xiaoman', 'I counted the robes. Four. The one on the right limps.']],
        6: [[10, 'hero', 'Save the heaviest weapon for the heaviest brute.'], [20, 'xiaoman', 'A stone hit the barracks! Grandpa Chu\'s still inside!'], [23, 'hero', 'I\'ll go. You stay here. Don\'t move a step.']],
        7: [[6, 'hero', 'The children are hauling bricks. ...Where\'s Xiaoman? Anyone seen Xiaoman?'], [16, 'xiaoman', 'Here! Brick coming up, Captain, catch!'], [30, 'hero', 'Hand me that one, then go down.']],
        8: [[12, 'xiaoman', 'Captain, the book\'s full. The last page, I left a space for you.'], [16, 'hero', 'Leave it blank. You hear me? Always blank.']],
      },
      talks: {
        1: {
          title: 'Barracks Door', who: 'xiaoman',
          lines: [
            ['xiaoman', 'Look, Captain, this is my book.'],
            ['xiaoman', 'Everyone lost on the Wall, I write them down. Grandpa Chu taught me letters. Hans starts with H, like a ladder.'],
            ['xiaoman', 'I\'ve decided. When I can write a hundred words, I\'ll take the oath.'],
            ['hero', '...Who told you a hundred words gets you the oath?'],
            ['xiaoman', 'Nobody. It\'s my own rule.'],
          ],
          q: 'Xiaoman hugs the book to her chest.',
          ans: [
            { cat: 'atk', t: 'The oath starts with a bow, not a pen. Neat letters don\'t help on the Wall.', re: 'Then teach me the bow! Tomorrow!' },
            { cat: 'def', t: 'No. Enough people on the Wall. Enough people in that book.', re: '...Then I\'ll write another hundred. Until you say yes.' },
            { cat: 'eco', t: 'That book\'s nearly full. I\'ll get you a thicker one tomorrow.', re: 'Hardcover! ...Don\'t change the subject.' },
          ],
        },
        3: {
          title: 'By the Well', who: 'xiaoman',
          lines: [
            ['xiaoman', 'My mum and dad went into the fog too. That year.'],
            ['xiaoman', 'I keep thinking they\'ll walk back out someday, like Grandpa Hans did.'],
            ['hero', '...'],
            ['xiaoman', 'It wouldn\'t be them, right? I know. I just want one look.'],
          ],
          q: 'She sets down the bucket and looks at you.',
          ans: [
            { cat: 'atk', t: 'Even if you see them, don\'t stop. Those who stop go with them.', re: 'I know. ...I know.' },
            { cat: 'def', t: 'If anyone calls you from the fog, run to me. Got it?', re: 'Got it. Run to you.' },
            { cat: 'tech', t: 'Fog things mimic voices but can\'t get pet names. What did your parents call you?', re: '...Manman. Don\'t you call me that either.' },
          ],
        },
        5: {
          title: 'Barracks Corner', who: 'chu',
          lines: [
            ['chu', 'Xiaoman came by today. Asked me the oath\'s last word.'],
            ['hero', 'You told her?'],
            ['chu', 'I said "light." She said no, she\'s heard it said, the last word is "dawn."'],
            ['chu', 'I didn\'t argue. Say an oath enough times, and everyone says it their own way.'],
          ],
          q: 'Old Chu\'s hand finds yours on the table.',
          ans: [
            { cat: 'atk', t: 'If she says it wrong, let her keep saying it wrong. Wrong doesn\'t count.', re: 'Ha. You fooled yourself the same way as a girl.' },
            { cat: 'def', t: 'If she goes to swear, stop her for me.', re: 'I\'m blind. I can\'t stop someone running. Only someone who wants to stop.' },
            { cat: 'tech', t: 'How did the oath go, originally?', re: 'Originally? ...Ask me at dawn.' },
          ],
        },
        7: {
          title: 'Before the Longest Night', who: 'xiaoman',
          lines: [
            ['xiaoman', 'Tonight\'s the longest night. Everyone says so.'],
            ['xiaoman', 'I\'ve written enough words. A hundred and three.'],
            ['xiaoman', 'Captain, let me swear tonight. Not to go on the Wall. I just want... the Wall to know me.'],
          ],
          q: 'She stands ramrod straight, like every recruit she\'s ever seen.',
          ans: [
            { cat: 'atk', t: 'Stand on my left tonight. I swing, you pass arrows. Swear tomorrow.', re: 'Yes! ...Captain, did you just say yes?' },
            { cat: 'def', t: 'The Wall knew you long ago. You hauled up every jar of water.', re: '...That doesn\'t count. It doesn\'t!' },
            { cat: 'eco', t: 'Give me your savings. I\'ll trade for two sacks of arrows. That\'s your oath.', re: 'That\'s all? ...Here. Take all of it.' },
          ],
        },
      },
    },
    {
      n: 'Old Chu',
      intro: [{ who: 'chu', t: 'Ayla, what\'s the sky like tonight? Tell me. I haven\'t seen it in years.' }],
      nights: {
        1: [[5, 'hero', 'Old Chu asked about the sky. I said same as yesterday. Truth is, not one star.'], [24, 'hero', 'Hold till dawn. First thing Old Chu taught me. The rest, he said, later.']],
        2: [[12, 'hero', 'Old Chu says listening beats looking. That sound underground... they\'re digging at the east.']],
        3: [[11, 'hero', 'Hans was in Old Chu\'s last batch of recruits. If he could see, I\'d keep him from tonight.']],
        4: [[3, 'hero', 'Karl. You promised me you\'d hold till dawn.'], [22, 'hero', 'Old Chu, the two you trained are fighting each other on the Wall tonight.']],
        5: [[11, 'hero', 'Greyrobe? Old Chu said the Academy came up the Wall once. Seven hundred years ago.'], [25, 'hero', 'The fallen get up again. Old Chu says the first watcher got up like that too.']],
        6: [[10, 'hero', 'Save the heaviest weapon for the heaviest brute.'], [22, 'hero', 'Half the barracks fell. Old Chu didn\'t move from his bed. Says rocks can\'t find a blind man.']],
        7: [[6, 'hero', 'Survive tonight, and only two nights remain.'], [28, 'hero', 'Old Chu is singing in the barracks. That ancient watch song. Only the first half.']],
        8: [[10, 'hero', 'The thing driving them here, Old Chu once told me its name. I thought it was a story.'], [26, 'hero', 'Old Chu, if you want to see the sky tomorrow, I\'ll carry you up.']],
      },
      talks: {
        1: {
          title: 'Barracks Corner', who: 'chu',
          lines: [
            ['chu', 'Your turn on the Wall again. Sit, let me feel that sword.'],
            ['chu', '...Edge has rolled a little. You\'ve been cutting hard things.'],
            ['chu', 'Since I went blind, it\'s all touch. I can feel a loose brick in a wall, a hurt in a person.'],
          ],
          q: 'He hands the sword back and waits for you to speak.',
          ans: [
            { cat: 'atk', t: 'Hard things, then a sharper edge.', re: 'Whetstone\'s under the bed. Not my good one.' },
            { cat: 'def', t: 'Nothing hurts. Nowhere.', re: 'Then you\'re used to it.' },
            { cat: 'tech', t: 'Feel this nick. Where\'d it come from?', re: 'An upward cut from below. Things outside the gate love that one. Watch your left.' },
          ],
        },
        3: {
          title: 'Old Tales', who: 'chu',
          lines: [
            ['chu', 'Did I ever tell you about the first watcher?'],
            ['hero', 'You did. Stood on the Wall his whole life, died on his feet.'],
            ['chu', 'That\'s the version for recruits.'],
            ['chu', 'When I was young, my captain told it differently. He said the first watcher never fell, even in death. Not died standing. Just never fell.'],
          ],
          q: 'He stops there, thumbing a half-whittled piece of wood.',
          ans: [
            { cat: 'atk', t: 'Didn\'t fall? Then cut him again.', re: 'Heh. You and Karl, same breed.' },
            { cat: 'def', t: 'Don\'t tell Xiaoman that one.', re: 'Too late. She made me tell it three times yesterday.' },
            { cat: 'tech', t: 'Never fell. What does that mean?', re: 'It means if you ever see a very old watcher outside the Wall, don\'t speak to him.' },
          ],
        },
        5: {
          title: 'On the Wall', who: 'soldier',
          lines: [
            ['soldier', 'Captain, can I ask something? How did Grandpa Chu lose his eyes?'],
            ['hero', 'Thirty years back, he was captain. That night the things outside gave off light. One look ruined your eyes.'],
            ['hero', 'He had everyone turn their backs, and watched them alone. All night.'],
            ['soldier', 'And he... what did he see?'],
          ],
          q: 'The recruit waits.',
          ans: [
            { cat: 'atk', t: 'He said he saw what they fear. That\'s why the city held that night.', re: 'What do they fear?' },
            { cat: 'def', t: 'He never says. Don\'t ask him either.', re: 'Yes, Captain. I won\'t.' },
            { cat: 'tech', t: 'He said he saw dawn. We all took it for raving.', re: '...Does he still say it?' },
          ],
        },
        7: {
          title: 'The Whetstone', who: 'chu',
          lines: [
            ['chu', 'Take this whetstone. My good one.'],
            ['chu', 'My captain gave it to me, now I give it to you. Seventy years of grinding wore a groove in the middle.'],
            ['hero', 'Didn\'t you say you\'d give it to me at dawn?'],
            ['chu', 'At dawn you won\'t need it.'],
          ],
          q: 'The stone still holds the warmth of his palm.',
          ans: [
            { cat: 'atk', t: 'Then I\'ll grind it thin tonight.', re: 'Good. Thin, it still won\'t break. That\'s its one virtue.' },
            { cat: 'def', t: 'I\'ll keep it for you. Back at dawn.', re: 'What for? I can\'t see an edge anyway.' },
            { cat: 'tech', t: 'You never taught me the second half of the oath.', re: '...At dawn. You\'ll have to live that long.' },
          ],
        },
      },
    },
  ],
  /* night talks not tied to a set */
  talks: {
    9: {
      title: 'The Last Night', who: 'bellman',
      lines: [
        ['bellman', 'After tonight, the morning bell is due. Seven hundred years\' rule: ring on the hour, dawn or no dawn.'],
        ['bellman', 'I keep wondering, if it ever truly gets light, will my hands shake? Will I miss the hour?'],
        ['hero', 'You won\'t.'],
        ['bellman', 'How do you know?'],
        ['hero', 'I\'ve watched you ring. Three hundred nights, never one wrong.'],
      ],
      q: 'Old Ji pauses, then smiles.',
      ans: [
        { cat: 'atk', t: 'We cut them all down tonight. Ring your heart out at dawn.', re: 'Deal! I\'ll polish the striker and wait.' },
        { cat: 'def', t: 'Stay in the bell tower tonight. Don\'t come down.', re: 'I won\'t. While the bell stands, so do I.' },
        { cat: 'eco', t: 'Spend what\'s left on wine. At dawn, we all drink.', re: 'Your treat? Then I\'ll throw in my burial money too.' },
      ],
    },
  },
  /* night 9: one scene per boss */
  bosses: {
    eye: {
      beats: [[4, 'hero', 'Come on. I\'ve waited twenty years on this wall for you.'], [30, 'hero', 'Karl, if you\'re in there, push from the inside.']],
      win: [
        { who: 'narr', t: 'The eye closes. Through the rift in the north seeps a thread of grey-white light.' },
        { who: 'narr', t: 'For the first time in seven hundred years, Dawnbell\'s bell rings in the morning.' },
        { who: 'hero', t: 'Karl, it\'s dawn.' },
        { who: 'hero', t: 'I still have the north gate key. Today, it turns once.' },
      ],
    },
    brood: {
      beats: [[4, 'hero', 'So this is where it all crawled out from, all these years.'], [26, 'hero', 'Xiaoman, don\'t look down. Look ahead.']],
      win: [
        { who: 'narr', t: 'The Brood curls into a knot and goes still. Through the rift in the north seeps a thread of grey-white light.' },
        { who: 'narr', t: 'For the first time in seven hundred years, Dawnbell\'s bell rings in the morning.' },
        { who: 'hero', t: 'Dawn. The husks at the foot of the Wall will take three days to sweep.' },
        { who: 'hero', t: 'So sweep. Slowly.' },
      ],
    },
    mutebell: {
      beats: [[4, 'hero', 'I know this bell. From Old Chu\'s stories. It hung at the top of the tower.'], [24, 'hero', 'Old Ji, ring your bell. Let it hear.']],
      win: [
        { who: 'narr', t: 'The Great Bell falls into the snow outside the city and tolls once. The morning bell. The northern sky lightens a thread.' },
        { who: 'bellman', t: 'It rang... the Great Bell rang. My grandfather\'s grandfather spoke of this very sound.' },
        { who: 'hero', t: 'It\'s dawn, Old Ji. Go ring your morning bell. Two bells together this time.' },
      ],
    },
    mistmother: {
      beats: [[9, 'hero', 'Don\'t answer. Answer, and it knows who you are.'], [20, 'hero', 'Xiaoman, cover your ears. Whoever calls you, don\'t turn around.']],
      win: [
        { who: 'narr', t: 'The fog lifts. For the first time, the Wall sees far. On the horizon, a line of grey-white.' },
        { who: 'hero', t: 'The cloak left in the fog is Karl\'s. I know the patch on the cuff. I sewed it.' },
        { who: 'hero', t: 'It\'s dawn. I\'ll hang it on the north gate.' },
      ],
    },
    siegelord: {
      beats: [[5, 'hero', 'It\'s copying us. Even the spacing of the embrasures.'], [30, 'hero', 'Gate\'s open? Then keep it open. Hit the gateway!']],
      win: [
        { who: 'narr', t: 'That city falls before this city\'s gate. Beneath its shadow, light breaks through for the first time.' },
        { who: 'hero', t: 'An old banner hangs from its gatehouse. A Nightwatch banner, lost who knows what year.' },
        { who: 'hero', t: 'Bring it back. Wash it. It\'s dawn. A banner belongs where it belongs.' },
      ],
    },
  },
  /* the full game line */
  full: {
    noDawn: [
      { who: 'narr', t: 'The light does not come.' },
      { who: 'chu', t: 'Is it dawn yet?' },
      { who: 'hero', t: 'Not yet.' },
      { who: 'chu', t: 'Then someone hasn\'t come home.' },
    ],
    nights: {
      10: [[4, 'hero', 'The morning bell rang and the sky stayed black. Old Chu says someone hasn\'t come home.'], [24, 'hero', 'They march too evenly. As if someone behind is calling cadence.']],
      11: [[6, 'hero', 'That northern path is freshly trodden. Big prints, even stride. Someone in armor.'], [28, 'hero', 'That\'s how watchers walk. Unchanged in seven hundred years.']],
      12: [[4, 'hero', 'Another one. How many more are in that northern rift?'], [30, 'hero', 'One at a time. The Wall never has too many. Neither should they.']],
      13: [[8, 'xiaoman', 'Captain! The sprout by the Wall grew another leaf!'], [12, 'hero', 'After tonight, go water it.']],
      14: [[6, 'hero', 'Everyone\'s on the Wall. Old Chu too. Says he can hear which bricks are rattling.'], [22, 'chu', 'Left! Third embrasure on the left!'], [34, 'hero', 'Old Chu, that colour on the horizon... can you smell it? Like burnt ash.']],
      15: [[4, 'hero', 'It\'s you. I\'ve heard you in Old Chu\'s stories a hundred times.'], [20, 'hero', 'Those behind you, I know a few. Hans, Karl... and so many I can\'t name.']],
    },
    talks: {
      11: {
        title: 'The Second Half', who: 'chu',
        lines: [
          ['chu', 'Not dawn yet, and here you are.'],
          ['chu', 'Sit. I promised the second half at dawn. No dawn, so I\'ll teach it anyway.'],
          ['chu', '"Hold till dawn." That\'s the first half. Everyone knows it.'],
          ['chu', 'The second half is: "At dawn, go home."'],
          ['chu', 'The first watcher said only the first half, and went up the Wall. He never finished it.'],
        ],
        q: 'The barracks is still. Only the sound of Old Chu whittling.',
        ans: [
          { cat: 'atk', t: 'Then I\'ll finish it for him.', re: 'Mm. Say it loud. He\'s been hard of hearing seven hundred years.' },
          { cat: 'def', t: 'So that\'s why he never fell.', re: 'So that\'s why he never went home.' },
          { cat: 'tech', t: 'What you saw thirty years ago. Was it him?', re: '...It was. Back to me, standing guard outside the Wall. Straighter than anyone.' },
        ],
      },
    },
    gems: {
      red: {
        title: 'The Helm by the Wall', who: 'soldier',
        lines: [
          ['soldier', 'Captain, at the foot of the north gate, where the knight fell, there\'s a helm.'],
          ['soldier', 'There\'s a red stone in it, hot. Held it in tongs for ages. It just won\'t cool.'],
          ['hero', '...Karl\'s hands were always cold. Winter watches, he\'d shove them in my pockets.'],
        ],
        q: 'The recruit hands you the tongs.',
        take: { t: 'Give it here. His turn to be warm.', re: [['soldier', 'Captain, your hand—'], ['hero', 'It\'s not hot. Not at all.']] },
        refuse: { t: 'Bury it, helm and all, outside the north gate. Where he held three hundred nights.', re: [['soldier', 'Yes. ...Dug up a few old coins making the hole. His, maybe. Keep them.'], ['narr', 'The coins are covered in blade nicks.']] },
      },
      blue: {
        title: 'Old Chu\'s Eye', who: 'chu',
        lines: [
          ['chu', 'This eye of mine is false. You know that.'],
          ['chu', 'Thirty years ago when I went blind, my captain fitted it. A blue stone. Said it was pried off the first watcher\'s sword hilt.'],
          ['chu', 'I always thought he was humouring me. But lately it burns in the socket. Turn my head north, it burns worse.'],
        ],
        q: 'He pries the stone out and sets it in your palm.',
        take: { t: 'I\'ll take it. It knows the way. I\'ll follow.', re: [['chu', 'Good. ...Empty socket\'s nice and cool, at least.']] },
        refuse: { t: 'Put it back, Old Chu. Come dawn, you\'ll need it for one look.', re: [['chu', 'Fool. ...Then take this. Kept under my bed twenty years.'], ['narr', 'An old pair of bracers, the leather worn to a shine.']] },
      },
      green: {
        title: 'The Sprout by the Wall', who: 'xiaoman',
        lines: [
          ['xiaoman', 'Captain! The sprout by the Wall made a seed! Green, and hard as stone.'],
          ['xiaoman', 'I guarded it thirteen days. I wrote its name on my book\'s last page too.'],
          ['xiaoman', 'Here. You\'re going north, right? I can tell.'],
        ],
        q: 'She presses the seed into your hand, her palm all sweat.',
        take: { t: 'I\'ll keep it. When I\'m back, we\'ll plant it together.', re: [['xiaoman', 'Promise! ...If you don\'t come back, I\'m tearing out your page.']] },
        refuse: { t: 'You keep it. Thirteen days you guarded it. It knows you.', re: [['xiaoman', '...Then I\'ll guard it for you. You guard the Wall, I guard this.'], ['narr', 'That stretch of wall, in time, grew stronger than the rest.']] },
      },
    },
    hiddenPre: [
      { who: 'narr', t: 'The northern rift opens. Out walks a very old watcher, armor the colour of bone.' },
      { who: 'narr', t: 'Behind him, a column in perfect ranks. Hans is among them. Karl too.' },
      { who: 'hero', t: 'Old Chu said not to speak to him.' },
      { who: 'hero', t: 'But someone has to tell him dawn is near.' },
    ],
    quiet: [
      { who: 'narr', t: 'On Night 15, nothing comes out of the northern rift.' },
      { who: 'narr', t: 'Dawn comes slowly. Grey first, then a faint wash of yellow, as through old paper.' },
      { who: 'hero', t: 'Old Chu, it\'s dawn.' },
      { who: 'chu', t: 'I smell it. Like burnt ash.' },
      { who: 'hero', t: 'The rift is still open. Someone still stands inside, waiting for another to finish his words.' },
      { who: 'hero', t: 'Next time. Next time I\'ll come ready, and find him.' },
      { who: 'bellman', t: 'Morning bell—!' },
    ],
    trueWin: [
      { who: 'narr', t: 'Where the First Sworn falls, the column behind him sits down one by one, as after a long road.' },
      { who: 'narr', t: 'Karl is the last to sit. He raises a hand to you, the way he did at the change of watch.' },
      { who: 'narr', t: 'Then the sun comes up.' },
      { who: 'hero', t: 'Hold till dawn.' },
      { who: 'hero', t: 'At dawn, go home.' },
      { who: 'xiaoman', t: 'Captain! The last page of my book, the space I left you—' },
      { who: 'hero', t: 'Leave it blank. I\'m going home.' },
    ],
  },
};
