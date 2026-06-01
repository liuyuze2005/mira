import type { Book, ChapterSection, CharacterCard, SceneCard, BookConcept } from "./types";
import { generateId } from "./store";

const DEMO_BOOK_ID = "demo-red-mansion";

const CHAPTERS: ChapterSection[] = [
  {
    index: 1,
    title: "第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀",
    kind: "body",
    text: `此开卷第一回也。作者自云：因曾历过一番梦幻之后，故将真事隐去，而借"通灵"之说，撰此《石头记》一书也。故曰"甄士隐"云云。但书中所记何事何人？自又云："今风尘碌碌，一事无成，忽念及当日所有之女子，一一细考较去，觉其行止见识，皆出于我之上。何我堂堂须眉，诚不若彼裙钗哉？实愧则有馀，悔又无益之大无可如何之日也！当此，则自欲将已往所赖天恩祖德，锦衣纨袴之时，饫甘餍肥之日，背父兄教育之恩，负师友规训之德，以至今日一技无成、半生潦倒之罪，编述一集，以告天下人：我之罪固不免，然闺阁中本自历历有人，万不可因我之不肖，自护己短，一并使其泯灭也。"

列位看官：你道此书从何而来？说起根由虽近荒唐，细按则深有趣味。待在下将此来历注明，方使阅者了然不惑。

原来女娲氏炼石补天之时，于大荒山无稽崖炼成高经十二丈、方经二十四丈顽石三万六千五百零一块。娲皇氏只用了三万六千五百块，只单单剩了一块未用，便弃在此山青埂峰下。谁知此石自经煅炼之后，灵性已通，因见众石俱得补天，独自己无材不堪入选，遂自怨自叹，日夜悲号惭愧。

一日，正当嗟悼之际，俄见一僧一道远远而来，生得骨格不凡，丰神迥异，说说笑笑来至峰下，坐于石边高谈快论。先是说些云山雾海神仙玄幻之事，后便说到红尘中荣华富贵。此石听了，不觉打动凡心，也想要到人间去享一享这荣华富贵。`,
    startOffset: 0,
    endOffset: 1200,
  },
  {
    index: 2,
    title: "第二回 贾夫人仙逝扬州城 冷子兴演说荣国府",
    kind: "body",
    text: `却说封肃因听见公差传唤，忙出来陪笑启问。那些人只嚷："快请出甄爷来！"封肃忙陪笑道："小人姓封，并不姓甄。只有当日小婿姓甄，今已出家一二年了，不知可是问他？"那些公人道："我们也不知什么'真''假'，因奉太爷之命来问。他既是你女婿，便带了你去亲见太爷面禀，省得乱跑。"说着，不容封肃多言，大家推拥他去了。

封家人个个都惊慌，不知何兆。那天约二更时，只见封肃方回来，欢天喜地。众人忙问端的。他乃说道："原来本府新升的太爷姓贾名化，本贯胡州人氏，曾与女婿旧日相交。方才在咱门前过去，因见娇杏那丫头买线，所以他只当女婿移住于此。我一一将原故回明，那太爷倒伤感叹息了一回，又问外孙女儿，我说看灯丢了。太爷说：'不妨，我自使番役务必探访回来。'说了一回话，临走倒送了我二两银子。"

甄家娘子听了，不免心中伤感。一宿无话。至次日，早有雨村遣人送了两封银子、四匹锦缎，答谢甄家娘子；又寄一封密书与封肃，转托问甄家娘子要那娇杏作二房。封肃喜的屁滚尿流，巴不得去奉承，便在女儿前一力撺掇成了。乘夜只用一乘小轿，便把娇杏送进去了。雨村欢喜，自不必说，乃封百金赠封肃，外谢甄家娘子许多物事，令其好生养赡，以待寻访女儿下落。

却说娇杏这丫鬟，便是那年回顾雨村者。因偶然一顾，便弄出这段事来，亦是自己意料不到之奇缘。谁想他命运两济，不承望自到雨村身边，只一年便生了一子；又半载，雨村嫡妻忽染疾下世，雨村便将他扶侧作正室夫人了。正是：偶因一着错，便为人上人。`,
    startOffset: 1200,
    endOffset: 2400,
  },
  {
    index: 3,
    title: "第三回 贾雨村夤缘复旧职 林黛玉抛父进京都",
    kind: "body",
    text: `且说黛玉自那日弃舟登岸时，便有荣国府打发了轿子并拉行李的车辆久候了。这林黛玉常听得母亲说过，他外祖母家与别家不同。他近日所见的这几个三等仆妇，吃穿用度，已是不凡了，何况今至其家。因此步步留心，时时在意，不肯轻易多说一句话，多行一步路，惟恐被人耻笑了他去。

自上了轿，进入城中，从纱窗向外瞧了一瞧，其街市之繁华，人烟之阜盛，自与别处不同。又行了半日，忽见街北蹲着两个大石狮子，三间兽头大门，门前列坐着十来个华冠丽服之人。正门却不开，只有东西两角门有人出入。正门之上有一匾，匾上大书"敕造宁国府"五个大字。黛玉想道：这必是外祖之长房了。想着，又往西行，不多远，照样也是三间大门，方是荣国府了。却不进正门，只进了西边角门。

那轿夫抬进去，走了一射之地，将转弯时，便歇下退出去了。后面的婆子们已都下了轿，赶上前来。另换了三四个衣帽周全十七八岁的小厮上来，复抬起轿子。众婆子步下围随至一垂花门前落下。众小厮退出，众婆子上来打起轿帘，扶黛玉下轿。

林黛玉扶着婆子的手，进了垂花门，两边是抄手游廊，当中是穿堂，当地放着一个紫檀架子大理石的大插屏。转过插屏，小小的三间厅，厅后就是后面的正房大院。正面五间上房，皆雕梁画栋，两边穿山游廊厢房，挂着各色鹦鹉、画眉等鸟雀。台矶之上，坐着几个穿红着绿的丫头，一见他们来了，便忙都笑迎上来，说："刚才老太太还念呢，可巧就来了。"于是三四人争着打起帘笼，一面听得人回话："林姑娘到了。"`,
    startOffset: 2400,
    endOffset: 3600,
  },
  {
    index: 4,
    title: "第四回 薄命女偏逢薄命郎 葫芦僧乱判葫芦案",
    kind: "body",
    text: `如今且说雨村，因补授了应天府，一下马就有一件人命官司详至案下，乃是两家争买一婢，各不相让，以至殴伤人命。彼时雨村即传原告之人来审。那原告道："被殴死者乃小人之主人。因那日买了一个丫头，不想是拐子拐来卖的。这拐子先已得了我家的银子，我家小爷原说第三日方是好日子，再接入门。这拐子便又悄悄的卖与薛家，被我们知道了，去找拿卖主，夺取丫头。无奈薛家原系金陵一霸，倚财仗势，众豪奴将我小主人竟打死了。凶身主仆已皆逃走，无影无踪，只剩了几个局外之人。小人告了一年的状，竟无人作主。望大老爷拘拿凶犯，剪恶除凶，以救孤寡，死者感戴天恩不尽！"

雨村听了大怒道："岂有这样放屁的事！打死人命就白白的走了，再拿不来的！"因发签差公人立刻将凶犯族中人拿来拷问，令他们实供藏在何处，一面再动海捕文书。正要发签时，只见案边立的一个门子使眼色儿，——不令他发签之意。雨村心下甚为疑怪，只得停了手，即时退堂，至密室，侍从皆退去，只留门子服侍。

这门子忙上来请安，笑问："老爷一向加官进禄，八九年来就忘了我了？"雨村道："却十分面善得紧，只是一时想不起来。"那门子笑道："老爷真是贵人多忘事，把出身之地竟忘了。不记当年葫芦庙里之事？"雨村听了，如雷震一惊，方想起往事。

原来这门子本是葫芦庙内一个小沙弥，因被火之后，无处安身，欲投别庙去修行，又耐不得清凉景况，因想这件生意倒还轻省热闹，遂趁年纪蓄了发，充了门子。雨村那里料得是他，便忙携手笑道："原来是故人。"又让坐了好谈。这门子不敢坐。雨村笑道："贫贱之交不可忘。你我故人也，二则此系私室，既欲长谈，岂有不坐之理？"这门子听说，方告了座，斜签着坐了。`,
    startOffset: 3600,
    endOffset: 4800,
  },
];

const CHARACTERS: CharacterCard[] = [
  {
    id: "demo-char-1",
    name: "贾宝玉",
    aliases: ["宝玉", "怡红公子", "绛洞花主"],
    role: "protagonist",
    firstMentionChapter: 1,
    lastUpdateChapter: 1,
    chaptersAppearedIn: [1, 2, 3],
    appearance: {
      face: "面若中秋之月，色如春晓之花",
      hair: "鬓若刀裁，眉如墨画",
      clothing: "头戴束发嵌宝紫金冠，齐眉勒着二龙抢珠金抹额",
      age: "约十三四岁",
      body: "",
      distinctiveFeatures: ["项上系着一块美玉", "面如敷粉，唇若施脂"],
    },
    personality: ["叛逆", "多情", "聪慧", "厌恶仕途经济"],
    sourceQuotes: [
      { text: "面若中秋之月，色如春晓之花，鬓若刀裁，眉如墨画，面如桃瓣，目若秋波。虽怒时而若笑，即瞋视而有情。", chapter: 3, confidence: "explicit" },
    ],
    imagePrompt: "A young nobleman in traditional Chinese Ming dynasty attire, delicate features with a jade pendant around his neck, scholarly yet rebellious expression, ink painting style",
    createdAt: Date.now(),
  },
  {
    id: "demo-char-2",
    name: "林黛玉",
    aliases: ["黛玉", "颦儿", "潇湘妃子"],
    role: "protagonist",
    firstMentionChapter: 2,
    lastUpdateChapter: 3,
    chaptersAppearedIn: [2, 3],
    appearance: {
      face: "两弯似蹙非蹙罥烟眉，一双似喜非喜含情目",
      hair: "乌黑如云",
      clothing: "素雅淡妆，不事华丽",
      age: "约十二岁",
      body: "态生两靥之愁，娇袭一身之病，闲静时如姣花照水，行动处似弱柳扶风",
      distinctiveFeatures: ["眉尖若蹙", "自带病态美"],
    },
    personality: ["敏感", "才华横溢", "孤傲", "多愁善感"],
    sourceQuotes: [
      { text: "两弯似蹙非蹙罥烟眉，一双似喜非喜含情目。态生两靥之愁，娇袭一身之病。", chapter: 3, confidence: "explicit" },
    ],
    imagePrompt: "A delicate young woman in simple elegant traditional Chinese dress, slender figure, melancholic beauty with slightly furrowed brows, poetic aura, watercolor style",
    createdAt: Date.now(),
  },
  {
    id: "demo-char-3",
    name: "薛宝钗",
    aliases: ["宝钗", "蘅芜君"],
    role: "protagonist",
    firstMentionChapter: 4,
    lastUpdateChapter: 4,
    chaptersAppearedIn: [4],
    appearance: {
      face: "脸若银盆，眼如水杏",
      hair: "乌黑浓密",
      clothing: "家常打扮，不点而翠",
      age: "约十三四岁",
      body: "肌骨莹润，举止娴雅",
      distinctiveFeatures: ["项上金锁"],
    },
    personality: ["端庄", "稳重", "博学", "世故"],
    sourceQuotes: [
      { text: "生得肌骨莹润，举止娴雅。", chapter: 4, confidence: "explicit" },
    ],
    imagePrompt: "An elegant young woman with a full moon face and almond eyes, dignified bearing, traditional Chinese dress with a gold lock pendant, classical beauty",
    createdAt: Date.now(),
  },
];

const SCENES: SceneCard[] = [
  {
    id: "demo-scene-1",
    name: "荣国府垂花门",
    type: "spatial-layout",
    description: "黛玉初入荣国府时所见的垂花门与正房大院。两边抄手游廊，当中穿堂，紫檀架子大理石大插屏，转过插屏为三间厅，厅后正房大院雕梁画栋。",
    chapter: 3,
    sourceQuotes: [
      { text: "进了垂花门，两边是抄手游廊，当中是穿堂，当地放着一个紫檀架子大理石的大插屏。转过插屏，小小的三间厅，厅后就是后面的正房大院。正面五间上房，皆雕梁画栋。", chapter: 3, confidence: "explicit" },
    ],
    imagePrompt: "Traditional Chinese mansion courtyard, carved beams and painted rafters, a large marble screen on a rosewood stand, covered corridors on both sides, classical garden architecture",
    createdAt: Date.now(),
  },
];

const CONCEPT: BookConcept = {
  genre: "章回体世情小说 / 古典文学",
  era: "清代（故事托为明代）",
  narrativeStyle: "第三人称全知视角，多线叙事",
  coreCharacters: [
    { name: "贾宝玉", role: "男主角", brief: "荣国府衔玉而生的公子，厌恶仕途经济" },
    { name: "林黛玉", role: "女主角", brief: "贾母外孙女，才华横溢，多愁善感" },
    { name: "薛宝钗", role: "女主角", brief: "薛家之女，端庄稳重，博学多识" },
  ],
  setting: "金陵（南京）贾府——一个正在走向衰落的封建贵族大家庭",
  themes: ["爱情与命运", "家族兴衰", "女性群像", "仕途与出世", "真假虚幻"],
};

const DEMO_RAW_TEXT = CHAPTERS.map(c => c.text).join("\n\n");

export function createDemoBook(): Book {
  return {
    id: DEMO_BOOK_ID,
    title: "红楼梦",
    author: "曹雪芹",
    chapters: CHAPTERS,
    currentChapter: 1,
    concept: CONCEPT,
    characters: CHARACTERS,
    scenes: SCENES,
    moments: [],
    knowledgeSource: "text-extraction",
    rawText: DEMO_RAW_TEXT,
    createdAt: Date.now(),
  };
}

export { DEMO_BOOK_ID };
