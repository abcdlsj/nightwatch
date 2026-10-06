/* Mo's story.
 * Three night sets: the Academy (the grey robe and the cold vault), Su Yan (his senior at the Academy), the Dye Works (his mother).
 */
export default {
  arcs: [
    {
      n: 'The Academy',
      intro: [{ who: 'hero', t: 'The Academy on the hill burned its lamps all night again. Sixteen windows. The dark one was my old room.' }],
      nights: {
        1: [[9, 'hero', 'Fewer people is better. Fewer variables.'], [24, 'hero', 'Academy lamps: sixteen. Still sixteen.']],
        2: [[12, 'hero', 'Seven parts saltpetre, one and a half charcoal. The Academy ratio. Textbook, page three.'], [26, 'hero', 'Who tore out page three for them?']],
        3: [[11, 'hero', 'Soul echoes. Only breakable the instant they turn solid. ...Sorry, Hans.']],
        4: [[3, 'hero', 'The runes on him are Academy script. Whoever rewrote him has lovely handwriting.'], [22, 'hero', 'Right-handed, heavy first stroke. I know this hand.']],
        5: [[11, 'hero', 'Greyrobe. So he opened the rift. That\'s why he threw me out.'], [24, 'greyrobe', 'Still using the method I taught you, Mo. Three errors.']],
        6: [[10, 'hero', 'Textbook parabola. Someone\'s teaching them geometry.'], [24, 'hero', 'That geometry book. I learned from that same page as a boy.']],
        7: [[6, 'hero', 'Stock runs out tonight. Tomorrow\'s potions, I brew mid-fight.'], [28, 'hero', 'One Academy window went dark tonight. ...Not mine.']],
        8: [[10, 'hero', 'A driven herd is the messiest. Mess means gaps.'], [26, 'hero', 'The Academy\'s cold vault is open tonight. I can smell the chill.']],
      },
      talks: {
        1: {
          title: 'Under the Bell Tower', who: 'bellman',
          lines: [
            ['bellman', 'Academy folk never come down the hill. Only you run up the Wall. What for?'],
            ['hero', 'Never come down? Their lamps are lit, aren\'t they.'],
            ['bellman', 'Lit, sure. But nobody comes down. You\'re the first off that hill in seven years.'],
            ['bellman', 'Even if you were thrown off.'],
          ],
          q: 'Old Ji pushes the soup toward you.',
          ans: [
            { cat: 'atk', t: 'What\'s outside makes good samples.', re: 'Samples? You call those samples? ...Fine, whatever makes you happy.' },
            { cat: 'def', t: 'Somewhere to keep my bottles. The hill won\'t have them.', re: 'Plenty of room on the Wall. Not the bell tower. One ring and they\'re shards.' },
            { cat: 'eco', t: 'Watch pay. The Academy cut my stipend.', re: 'Ha, then you\'ve come to the right place. Low pay, and late.' },
          ],
        },
        3: {
          title: 'Voice in the Crack', who: 'greyrobe',
          lines: [
            ['greyrobe', 'Mo.'],
            ['greyrobe', 'Your technique has slipped. Last night\'s frost potion was half a part off.'],
            ['greyrobe', 'The Academy door is still open to you. The cold vault needs a steady hand.'],
          ],
          q: 'The voice is close, as if against your ear.',
          ans: [
            { cat: 'atk', t: 'Tell me what\'s in the cold vault first.', re: '...Come back and see for yourself.' },
            { cat: 'def', t: '(Pour half a bottle of quicklime into the crack.)', re: 'Manners as poor as ever.' },
            { cat: 'tech', t: 'Half a part off on purpose. If you can tell, you\'re watching the Wall too.', re: '...Clever students rarely live long.' },
          ],
        },
        5: {
          title: 'Found Up North', who: 'soldier',
          lines: [
            ['soldier', 'Sir Alchemist, I found this up north last night. Can\'t read the writing.'],
            ['hero', 'An Academy seal. Cold vault only. Triple wax.'],
            ['hero', '...Torn from the inside.'],
            ['soldier', 'The inside?'],
          ],
          q: 'The recruit steps back half a pace.',
          ans: [
            { cat: 'atk', t: 'The inside. So don\'t let it find its way back.', re: 'Yes, sir. I\'ll bury more oil casks up north.' },
            { cat: 'def', t: 'Don\'t touch it again. Wash your hands. Limewater, three times.', re: 'Three? ...Right, right.' },
            { cat: 'tech', t: 'Wax is still soft. Torn under two days ago. Two days north is the rift.', re: 'You mean... it walked from the vault to the rift on its own?' },
          ],
        },
        7: {
          title: 'Sixteen Windows', who: 'bellman',
          lines: [
            ['bellman', 'One of the lamps on the hill went out tonight.'],
            ['bellman', 'Decades I\'ve watched from the tower. Those windows never went dark.'],
            ['hero', 'One did. Seven years ago.'],
            ['bellman', 'What?'],
            ['hero', 'Mine. Greyrobe put out the lamp himself.'],
          ],
          q: 'Old Ji turns to look at you.',
          ans: [
            { cat: 'atk', t: 'Mix everything left into the harshest blend there is.', re: 'All yours. Nothing held back tonight.' },
            { cat: 'def', t: 'Give the Wall another coat. I have a formula.', re: 'Coat away. Shame your formula can\'t paper over the sky.' },
            { cat: 'eco', t: 'My stipend money... oh, forget it. Bet it all.', re: 'Ha. Then I\'ll dig out my burial money too.' },
          ],
        },
      },
    },
    {
      n: 'Su Yan',
      intro: [{ who: 'suyan', t: 'The boat\'s under the water gate. I drop this off and go. Don\'t see me out.' }],
      nights: {
        1: [[9, 'hero', 'Fewer people is better. Fewer variables.'], [22, 'hero', 'A light by the water gate. One small boat, one lamp. She\'s back.']],
        2: [[12, 'hero', 'Academy powder ratio. Su Yan, your stuff is leaking.'], [26, 'narr', 'From the water gate, someone tosses a parcel onto the Wall.']],
        3: [[11, 'hero', 'Soul echoes. Su Yan said the Academy has always counted them. ...She never said why.']],
        4: [[3, 'hero', 'The runes on him are Academy script.'], [20, 'hero', 'Heavy first stroke... no, not Su Yan\'s hand. Hers is thinner.']],
        5: [[11, 'hero', 'Greyrobe. ...And Su Yan is his assistant.'], [26, 'hero', 'No light at the water gate tonight.']],
        6: [[10, 'hero', 'Textbook parabola. Someone\'s teaching them geometry.'], [24, 'suyan', 'Mo! The catapult axle is hollow. Pour ice into it!']],
        7: [[6, 'hero', 'Stock runs out tonight. Tomorrow\'s potions, I brew mid-fight.'], [20, 'hero', 'Su Yan\'s on the west stretch, lobbing Academy bottles. Better aim than mine.']],
        8: [[10, 'suyan', 'That thing behind them is in the Academy records. I didn\'t dare read on.'], [26, 'hero', 'Read on. I\'ll read with you.']],
      },
      talks: {
        1: {
          title: 'Water Gate', who: 'suyan',
          lines: [
            ['suyan', 'Two packs saltpetre, one sulphur, half a jin of ice crystal. Logged as "wastage."'],
            ['hero', 'You waste this much every month and the Academy doesn\'t audit?'],
            ['suyan', 'They audit. It stops at me.'],
            ['suyan', '...Go easy on the bottles. I may not make it next month.'],
          ],
          q: 'The boat rocks gently under the water gate.',
          ans: [
            { cat: 'atk', t: 'More saltpetre next month. I\'m making a big one.', re: 'A big one? Your last big one burned half an Academy lab.' },
            { cat: 'def', t: 'If you can\'t come, don\'t.', re: 'Whether I come isn\'t yours to say.' },
            { cat: 'eco', t: 'Call it a loan. I\'ll repay you at dawn.', re: 'At dawn? ...Still talking like that. Fine, I\'ll keep the ledger.' },
          ],
        },
        3: {
          title: 'Water Gate', who: 'suyan',
          lines: [
            ['suyan', 'The day they threw you out, I was the one who testified. You know that.'],
            ['hero', 'I know.'],
            ['suyan', 'You never asked me why.'],
            ['hero', 'You\'ll tell me. You can\'t hold it in.'],
          ],
          q: 'She looks down and wipes her glasses. For a long time.',
          ans: [
            { cat: 'atk', t: 'Not asking. I only want Greyrobe\'s next move.', re: 'He spends longer and longer in the cold vault. Beyond that, I don\'t know.' },
            { cat: 'def', t: 'When you testified, were you helping me?', re: '...If you\'d stayed that day, you\'d be in the cold vault now.' },
            { cat: 'tech', t: 'You swore my formula would explode. It wouldn\'t. You ran the numbers.', re: 'I did. What I said was, it would bring out the sun.' },
          ],
        },
        5: {
          title: 'Water Gate', who: 'suyan',
          lines: [
            ['suyan', 'I shouldn\'t have come today. Greyrobe is auditing the wastage.'],
            ['suyan', 'I just wanted to see. Whether you\'d got thinner.'],
            ['hero', 'Down three jin. Experimental data, margin of half a jin.'],
          ],
          q: 'She almost smiles. Then doesn\'t.',
          ans: [
            { cat: 'atk', t: 'Go back. If he gives you trouble, I\'ll go up the hill.', re: 'You? You can\'t even get past the gate. ...Fine. I\'m going.' },
            { cat: 'def', t: 'Don\'t go back. There\'s room on the Wall.', re: 'I go back because someone has to watch him.' },
            { cat: 'eco', t: 'Put the wastage on me. My name\'s ruined anyway.', re: 'Your name stopped being yours long ago. ...Fine. On you.' },
          ],
        },
        7: {
          title: 'West Stretch', who: 'suyan',
          lines: [
            ['suyan', 'I\'ve come down. I\'m not going back.'],
            ['suyan', 'Greyrobe put me on night duty in the cold vault. I saw what\'s inside.'],
            ['suyan', 'Mo, that formula of yours... remember it? The one that brings out the sun.'],
          ],
          q: 'She presses a scorch-edged roll of paper on you. Your handwriting.',
          ans: [
            { cat: 'atk', t: 'I remember. Tonight we light up what\'s outside with it.', re: 'Good. I\'ll balance it. My maths is finer than yours.' },
            { cat: 'def', t: 'Find somewhere to hide. I\'ll handle the rest.', re: 'Hide? I hid at the Academy seven years. Enough.' },
            { cat: 'tech', t: 'My notes... Greyrobe said he burned them all.', re: 'He burned my copy. The original\'s been sewn into my robe all along.' },
          ],
        },
      },
    },
    {
      n: 'The Dye Works',
      intro: [{ who: 'hero', t: 'The drying poles at the lower-town dye works. Still seven. Mother\'s still there.' }],
      nights: {
        1: [[9, 'hero', 'Fewer people is better. Fewer variables.'], [26, 'hero', 'Indigo cloth on the southern poles. A whole day under lamps, still damp.']],
        2: [[12, 'hero', 'The smell of powder... Mother says it\'s like the indigo vat. I was twelve when she said it.']],
        3: [[11, 'hero', 'Soul echoes. Only breakable the instant they turn solid.'], [22, 'hero', 'Hans used to haul water for the dye works. Mother always gave him an extra bowl.']],
        4: [[3, 'hero', 'Something familiar in his magic. As if rewritten.'], [24, 'narr', 'Below the Wall, someone with a lantern calls: Mo! Supper!'], [27, 'hero', '...Stop calling, Mother. I\'m in a battle.']],
        5: [[11, 'hero', 'Headmaster Greyrobe. Mother met him once, seven years ago. He came to buy cloth.'], [26, 'hero', 'Black cloth. A whole bolt.']],
        6: [[10, 'hero', 'Textbook parabola. Someone\'s teaching them geometry.'], [20, 'shen', 'Mo! All the dye works cloth is in, for bandages on the Wall!']],
        7: [[6, 'hero', 'Stock runs out tonight. Tomorrow\'s potions, I brew mid-fight.'], [22, 'hero', 'Mother is boiling water at the foot of the Wall. Won\'t come up. Won\'t leave.']],
        8: [[10, 'hero', 'A driven herd is the messiest. Mess means gaps.'], [26, 'narr', 'The lantern below the Wall stays lit.']],
      },
      talks: {
        1: {
          title: 'Dye Works Door', who: 'shen',
          lines: [
            ['shen', 'Don\'t just stand there. In.'],
            ['shen', 'That robe of yours has a hole burned in the cuff. Off with it. I\'ll mend it.'],
            ['hero', 'No need. Lab coats are meant to be...'],
            ['shen', 'Off.'],
          ],
          q: 'Her hand is already out.',
          ans: [
            { cat: 'atk', t: 'After you mend it, I\'m back on the Wall. Busy night.', re: 'Then off with it, quick. Mended first, then go.' },
            { cat: 'def', t: '...Fine. Make it sturdy.', re: 'When has my mending ever not been sturdy?' },
            { cat: 'eco', t: 'How much per mend? I\'m earning now.', re: 'Your mother\'s handiwork? Can you afford it? ...Sit. Have some soup.' },
          ],
        },
        3: {
          title: 'Under the Drying Poles', who: 'shen',
          lines: [
            ['shen', 'Three days this batch has hung under the lamps. Still dull.'],
            ['shen', 'Your grandmother used to say cloth once dried in an afternoon, colours so bright they stung.'],
            ['shen', 'A lifetime of dyeing, and I\'ve never seen colours that sting.'],
          ],
          q: 'She spreads a bolt of indigo before you.',
          ans: [
            { cat: 'atk', t: 'Once I clear out what\'s past the Wall, you\'ll see.', re: 'Boaster. ...You boasted like that as a boy.' },
            { cat: 'def', t: 'Dull is pretty too. Prettier than Academy robes.', re: 'Then come home and learn dyeing. ...Never mind, you can\'t sit still.' },
            { cat: 'tech', t: 'I wanted to make a sun once. To dry this.', re: '...You never told me that.' },
          ],
        },
        5: {
          title: 'Black Cloth', who: 'shen',
          lines: [
            ['shen', 'That one in the grey robe came by seven years ago. Bought a whole bolt of black.'],
            ['shen', 'I asked what for. He said: to block the light.'],
            ['shen', 'I knew then something was wrong. Why would a decent man block the light?'],
          ],
          q: 'She feeds a handful of kindling to the stove.',
          ans: [
            { cat: 'atk', t: 'He blocks a bolt, I burn a bolt.', re: 'Burn it. Poor dye job anyway. I\'ve regretted selling it for years.' },
            { cat: 'def', t: 'If Academy folk come again, don\'t sell.', re: 'I won\'t. I\'ll shut the door.' },
            { cat: 'tech', t: 'A whole bolt of black. Spread out, how much would it cover?', re: 'This whole alley. What does he want something that big for?' },
          ],
        },
        7: {
          title: 'Foot of the Wall', who: 'shen',
          lines: [
            ['shen', 'I\'m not coming up. Don\'t fuss over me.'],
            ['shen', 'I\'ll boil water here. People fighting need something hot.'],
            ['shen', '...When you had fevers as a boy, I sat by the stove too. Same thing.'],
          ],
          q: 'The lantern lights her hands. They\'re blue.',
          ans: [
            { cat: 'atk', t: 'Save me a pot when it boils. I\'ll come down after.', re: 'It\'s saved. Always saved.' },
            { cat: 'def', t: 'Mother, go home. The foot of the Wall isn\'t safe.', re: 'You on the Wall, me at its foot. That\'s home.' },
            { cat: 'eco', t: 'Take all my pay. Buy some good charcoal.', re: 'Keep it. Save up for a wife... all right, all right. Go on up.' },
          ],
        },
      },
    },
  ],
  talks: {
    9: {
      title: 'The Last Night', who: 'bellman',
      lines: [
        ['bellman', 'After tonight, we see if dawn comes.'],
        ['bellman', 'Those bottles of yours. How many left?'],
        ['hero', 'Eleven. Enough for one calculation.'],
        ['bellman', 'Calculating what?'],
        ['hero', 'When the sky breaks.'],
      ],
      q: 'Old Ji waits for you to go on.',
      ans: [
        { cat: 'atk', t: 'Throw them all. Keep none. If I\'m wrong, at least it\'s fun.', re: 'That\'s the spirit! I\'ll ring the bell for you.' },
        { cat: 'def', t: 'Keep two. Someone has to clean up at dawn.', re: 'Steady. Sharp tongue, careful heart.' },
        { cat: 'tech', t: 'Done. When it shows itself: second forty-three.', re: 'You can work that out? ...Then I ring at forty-three.' },
      ],
    },
  },
  bosses: {
    eye: {
      beats: [[4, 'hero', 'So you\'re what blocks the sun. Let\'s see what\'s inside you.'], [28, 'hero', 'Pupil\'s contracting. It fears light. It fears light!']],
      win: [
        { who: 'narr', t: 'The eye closes. Through the rift in the north seeps a thread of grey-white light.' },
        { who: 'narr', t: 'For the first time in seven hundred years, Dawnbell\'s bell rings in the morning.' },
        { who: 'hero', t: 'The light\'s composition matches my numbers exactly.' },
        { who: 'hero', t: '...Mother should put the cloth out to dry.' },
      ],
    },
    brood: {
      beats: [[4, 'hero', 'A nest. The Abyss isn\'t an eye. It\'s a nest.'], [24, 'hero', 'The egg in the Academy\'s cold vault... so it grew this big.']],
      win: [
        { who: 'narr', t: 'The Brood curls into a knot and goes still. Through the rift in the north seeps a thread of grey-white light.' },
        { who: 'narr', t: 'For the first time in seven hundred years, Dawnbell\'s bell rings in the morning.' },
        { who: 'hero', t: 'Experiment concluded. Sample destroyed.' },
        { who: 'hero', t: 'Addendum: weld the cold vault door shut. From outside.' },
      ],
    },
    mutebell: {
      beats: [[4, 'hero', 'The vibration reaches me, but the ear hears nothing. It\'s striking something else.'], [24, 'hero', 'Resonance... hit it with bottles! Same pitch!']],
      win: [
        { who: 'narr', t: 'The Great Bell falls into the snow outside the city and tolls once. The morning bell. The northern sky lightens a thread.' },
        { who: 'bellman', t: 'It rang... the Great Bell rang.' },
        { who: 'hero', t: 'Frequency correct.' },
        { who: 'hero', t: 'Mother says cloth dries faster when the bell rings. No idea if it\'s true. Today we can test it.' },
      ],
    },
    mistmother: {
      beats: [[9, 'hero', 'It can fake a voice, not body heat. It\'s cold.'], [20, 'hero', 'Su Yan, plug your ears. It mimics anyone. It can\'t mimic warmth.']],
      win: [
        { who: 'narr', t: 'The fog lifts. For the first time, the Wall sees far. On the horizon, a line of grey-white.' },
        { who: 'hero', t: 'The fog cleared fast. Faster than I calculated.' },
        { who: 'hero', t: '...I want to go home for supper.' },
      ],
    },
    siegelord: {
      beats: [[5, 'hero', 'Load math is right, material\'s wrong. Its frame is bone.'], [28, 'hero', 'Those three crossbeams bear the load. Break one and it collapses itself.']],
      win: [
        { who: 'narr', t: 'That city falls before this city\'s gate. Beneath its shadow, light breaks through for the first time.' },
        { who: 'hero', t: 'Its blueprints are the Academy\'s. I saw them in the library. One name on the borrowing record.' },
        { who: 'hero', t: 'Greyrobe.' },
      ],
    },
  },
  full: {
    noDawn: [
      { who: 'narr', t: 'The light does not come.' },
      { who: 'hero', t: '...Error. It has to be error.' },
      { who: 'suyan', t: 'Not error, Mo. Your maths is right. It\'s just missing a few things.' },
    ],
    nights: {
      10: [[4, 'hero', 'The morning bell rang and the sky stayed black.'], [22, 'hero', 'Not one Academy window lit tonight.']],
      11: [[6, 'hero', 'The northern road is new. Deep ruts. Something heavy.'], [26, 'hero', 'Academy carts. Greyrobe is moving house.']],
      12: [[4, 'hero', 'Another one. As if someone\'s releasing them one at a time.'], [28, 'hero', 'Whoever lets them out is waiting for us to finish the sum.']],
      13: [[8, 'hero', 'A sprout by the Wall. No light. What\'s it growing on?'], [26, 'shen', 'Mo, I put a bowl over the sprout. So nobody treads on it.']],
      14: [[6, 'hero', 'The whole city\'s on the Wall. Mother too.'], [22, 'shen', 'Cloth! Hang out all the dye works cloth, so they can\'t see where the Wall is!'], [34, 'hero', 'Colour on the horizon. ...Mother, what colour is that?']],
      15: [[4, 'hero', 'Teacher.'], [18, 'hero', 'Seven hundred years you\'ve covered it. Today I want to see what.']],
    },
    talks: {
      11: {
        title: 'The Vault Records', who: 'suyan',
        lines: [
          ['suyan', 'I\'ve finished the cold vault records.'],
          ['suyan', 'The first headmaster wrote them. He said the Abyss follows light, so he blotted out the sun.'],
          ['suyan', 'Every headmaster since has worn the grey robe and kept that one line. Seven hundred years.'],
          ['hero', 'And still it came.'],
          ['suyan', 'Yes. Still it came.'],
        ],
        q: 'She shuts the record book and keeps her hand on it.',
        ans: [
          { cat: 'atk', t: 'Seven hundred years of hiding failed. New method. Set it alight.', re: 'Set it alight. I ran it. Your formula holds. Three things missing.' },
          { cat: 'def', t: 'He isn\'t evil. Just afraid.', re: '...Seven years at his side, I never dared think that.' },
          { cat: 'tech', t: 'Which three?', re: 'A little fire, a little direction, a little something that grows.' },
        ],
      },
    },
    gems: {
      red: {
        title: 'Parcel at the Water Gate', who: 'suyan',
        lines: [
          ['suyan', 'The Academy furnace core hasn\'t gone out in seven hundred years. This morning, a piece cracked off.'],
          ['suyan', 'I stole it. Red. Holding it is like holding a heart.'],
          ['suyan', 'With this, your formula\'s only two things short.'],
        ],
        q: 'Her fingertips are burned.',
        take: { t: 'Give it here. This time it won\'t explode.', re: [['suyan', 'You said that last time. ...Take it.']] },
        refuse: { t: 'Take it back. If they find out, it\'s the cold vault for you.', re: [['suyan', '...Then you\'ll at least take this.'], ['narr', 'A pack of saltpetre and a pouch of silver scraps. Logged, still, as "wastage."']] },
      },
      blue: {
        title: 'Bottom of the Vat', who: 'shen',
        lines: [
          ['shen', 'Something crusted at the bottom of the indigo vat. Shiny blue. A lifetime scraping vats, first time I\'ve seen it.'],
          ['shen', 'Take a look. See if it\'s one of those Academy treasures.'],
          ['shen', 'If it\'s worthless, keep it as a keepsake.'],
        ],
        q: 'It\'s as blue as the sky before nightfall.',
        take: { t: 'It\'s worth something. I\'ll put it to use, Mother.', re: [['shen', 'Take it. And come home for supper after.']] },
        refuse: { t: 'You keep it, Mother. At dawn, hold it up to the sun.', re: [['shen', '...Then take this. Your robe\'s mended.'], ['narr', 'The cuff is patched, stitches tight and even. A hidden pocket sewn inside.']] },
      },
      green: {
        title: 'The Greenhouse', who: 'suyan',
        lines: [
          ['suyan', 'There\'s a pot of grass in the Academy greenhouse. Seven hundred years and it hasn\'t died.'],
          ['suyan', 'The first headmaster dug it up under the sun. The record says: keep it, replant it at dawn.'],
          ['suyan', 'It\'s gone to seed. Green.'],
        ],
        q: 'She sets the seed in your palm. Her fingertips are cold.',
        take: { t: 'Give it here. At dawn I\'ll replant it for him.', re: [['suyan', 'Good. ...Call me when you plant it.']] },
        refuse: { t: 'You keep it. Seven years at the Academy. It\'s yours too.', re: [['suyan', '...Then I\'ll plant it at the foot of the Wall. While the Wall stands, so does it.'], ['narr', 'That stretch of wall, in time, grew stronger than the rest.']] },
      },
    },
    hiddenPre: [
      { who: 'narr', t: 'A figure walks out of the northern rift. Grey robe, hood up, a book in its hands.' },
      { who: 'greyrobe', t: 'Mo. Page three. Did you tear it out?' },
      { who: 'hero', t: 'I did. You taught me: what\'s wrong gets torn out.' },
      { who: 'greyrobe', t: 'Then come. Let me see if your sums are right.' },
    ],
    quiet: [
      { who: 'narr', t: 'On Night 15, nothing comes out of the northern rift.' },
      { who: 'narr', t: 'Dawn comes slowly. Grey first, then a faint wash of yellow, as through old paper.' },
      { who: 'hero', t: 'Close. My calculation is still one thing short.' },
      { who: 'suyan', t: 'We\'ll fill it in next time. I\'ll do the sums with you.' },
      { who: 'shen', t: 'Mo! Supper!' },
      { who: 'hero', t: '...Coming.' },
    ],
    trueWin: [
      { who: 'narr', t: 'Greyrobe falls. The hood slips back. Beneath it, a very old, very tired face.' },
      { who: 'greyrobe', t: '...Bright. So this is how bright it is.' },
      { who: 'narr', t: 'Then the sun comes up. The whole sun.' },
      { who: 'hero', t: 'Mother, put the cloth out to dry.' },
      { who: 'shen', t: 'It\'s out. Look. That colour. It stings.' },
    ],
  },
};
