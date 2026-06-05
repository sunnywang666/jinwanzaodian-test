import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

/* ============================================================
   「今晚早点」治愈版原型 v4
   v4 新增:
   - 测评后给出基于研究的完整干预方案 (CBT-I + 自我关怀)
   - 激励系统升级: 小鱼干 + 升级机制 + 价值对齐说明
   - 自由对话: 根据熬夜类型 + 关键词智能回复
   ============================================================ */

const C = {
  bg: "#fdf6ec", bgGradTop: "#fdeede", card: "#ffffff", cardSoft: "#fef3e8",
  accent: "#f0a868", accentDeep: "#e08a4a", accentSoft: "#fdeede",
  pink: "#f4b8c1", pinkSoft: "#fde8ec",
  green: "#a8c8a0", greenSoft: "#eaf2e6",
  purple: "#c4b5e0", blue: "#a6c8e0",
  text: "#5a4a3f", textMuted: "#a3927f", textDim: "#c9bbac",
  border: "#f0e4d4", star: "#f5d76e",
  warn: "#d97757", warnSoft: "#fae5dd",
};

const typeConfig = {
  revenge: { emoji: "🦊", animal: "小狐狸", label: "报复型", sublabel: "今天又白过了", color: C.accent, soft: C.accentSoft, desc: "舍不得睡，想夺回属于自己的时间" },
  inertia: { emoji: "🦝", animal: "小浣熊", label: "惯性型", sublabel: "再刷5分钟…", color: C.blue, soft: "#e8f1f7", desc: "刷手机停不下来，失去了时间感" },
  anxiety: { emoji: "🐰", animal: "小兔子", label: "焦虑型", sublabel: "脑子停不下来", color: C.purple, soft: "#f0ebf8", desc: "压力大，躺下后思绪纷飞" },
  work: { emoji: "🐻", animal: "小熊", label: "工作型", sublabel: "活儿没干完", color: C.green, soft: C.greenSoft, desc: "还在加班，不敢停下来" },
  owl: { emoji: "🦉", animal: "猫头鹰", label: "猫头鹰型", sublabel: "就是不困啊", color: "#d4a373", soft: "#f5ebe0", desc: "天生晚睡体质，夜里精神好" },
  mixed: { emoji: "🐱", animal: "小猫", label: "说不清", sublabel: "我也不确定", color: C.pink, soft: C.pinkSoft, desc: "今晚有点复杂，让我陪你聊聊" },
};

/* ============ 预设对话流 ============ */
const chatFlows = {
  revenge: [
    { role: "ai", text: "明白了——今天一整天都在忙别人的事，现在终于属于你了，当然舍不得放手。\n\n这种感觉一点都不奇怪，也不是你的错。" },
    { role: "ai", text: "我想跟你商量个事：\n\n与其花2小时漫无目的地刷手机（你知道刷完反而更空），不如用 15 分钟，做一件真正让你觉得「这才是我的时间」的小事。\n\n你想选哪个？", quickReplies: ["🎯 来个有趣的小挑战", "💭 吐槽今天最烦的事", "📖 听个3分钟好故事"] },
    { role: "user", text: "💭 吐槽今天最烦的事" },
    { role: "ai", text: "来吧，今天最让你想翻白眼的事是什么？\n\n你也可以直接打字告诉我 ↓" },
  ],
  anxiety: [
    { role: "ai", text: "脑子里装着什么放不下？\n\n说出来就好，不用组织语言，想到什么说什么。可以直接打字告诉我 ↓" },
  ],
  inertia: [
    { role: "ai", text: "你现在在刷什么呀？可以直接告诉我 ↓\n\n或者选一个：", quickReplies: ["小红书 / 抖音", "微博 / 朋友圈", "短视频 / B站"] },
  ],
  work: [
    { role: "ai", text: "还在加班呀？说说你手里还剩什么没做完的——\n\n直接告诉我具体什么任务、什么时候要交，我帮你判断真的需不需要熬。" },
  ],
  owl: [
    { role: "ai", text: "又精神起来了对吧？放心，我不催你睡。\n\n咱们聊聊——接下来这段清醒的时间，你打算怎么用？", quickReplies: ["想看看书/学习", "有正事要做", "想玩游戏/刷剧"] },
  ],
  mixed: [
    { role: "ai", text: "没关系，说不清楚很正常——熬夜的原因常常是好几种混在一起的。\n\n那我们慢慢来。此刻的你，更接近哪种感觉？", quickReplies: ["有点累但不想睡", "心里有事放不下", "就是单纯不困"] },
  ],
};

/* ============ 软着陆兜底 (用户选择不立刻睡时的温柔回应) ============ */
// 注: "再让我刷一会儿…" 单独处理 - 会触发"延后目标时间"流程, 不在这里
const softLandingReplies = {
  "还是有点睡不着": "没关系，睡不着不是你的错。😌\n\n睡眠研究告诉我们：躺下超过 20 分钟还醒着，别强迫自己——起来做点放松的事，有困意了再回床上。要不要我陪你做个更长一点的呼吸放松？",
  "好难，还想再看": "我懂，停下来真的需要一点点勇气。😌\n\n不勉强你。那就再给自己最后 5 分钟，看完真的就放下好吗？我 5 分钟后轻轻提醒你一下。",
  "可我还是放不下": "放不下也没关系，说明你很在意这件事，这是好事。😌\n\n那我们各退一步：只花 10 分钟把「明早第一件要做的事」写下来，写完就关电脑。这样既不耽误，又能让你安心。可以吗？",
  "直接睡吧 😌": "好呀，那是最好的选择 💛\n\n来，陪我做几次深呼吸，今天就到这里啦。",
};

/* ============ 自由对话: 关键词意图识别 ============ */
const intentMap = {
  revenge: [
    { kw: ["工作", "上班", "老板", "开会", "加班", "活儿", "同事"],
      reply: "今天的工作把你榨干了吧。😮‍💨\n\n我懂——一整天都在配合别人的节奏，到了晚上当然想夺回点什么。\n\n但「刷手机到 2 点」不是真正的夺回，是被另一种节奏继续消耗。换种方式：给你 15 分钟，做一件真正让你觉得「这是我的时间」的事，比刷一小时手机充实多了。" },
    { kw: ["累", "疲惫", "辛苦", "撑不住", "心累"],
      reply: "今天确实辛苦了。这种累不是身体的累，是心累——你今天大概一直在「为别人活着」吧。\n\n现在你需要的不是再撑下去，是好好爱一下自己。睡前 15 分钟，听一首喜欢的歌、抱一下自己，或者就静静发呆都行。" },
    { kw: ["不想睡", "舍不得", "想再", "再玩", "再刷", "不困"],
      reply: "舍不得睡——这种感觉一点都不丢人。你只是觉得今天好像还没真正属于自己过。\n\n咱们换个方式：与其用 2 小时低质量地刷手机，不如花 15 分钟做一件让你真正满足的事。15 分钟后你大概率会觉得「够了」，然后就能安心睡了。要不要试试？" },
    { kw: ["开心", "快乐", "爽", "享受", "解压"],
      reply: "听到你说开心，我也开心 💛\n\n但你知道吗？刷手机的那种「开心」其实很空——刷完反而更累、更想再刷。真正能给你充电的开心，是 15 分钟做一件你真正喜欢的小事。要不要把今晚这种状态用在更值得的地方？" },
    { kw: ["手机", "刷", "视频", "抖音", "小红书", "微博", "短视频", "b站"],
      reply: "信息流就是被设计成让你停不下来的，这不是你自控力差。\n\n我们做个小实验：再给自己 3 条 / 3 个视频的额度，看完就是收尾。看到好的截图存起来，明天再看 — 你会发现，停下来其实没那么难。" },
    { kw: ["无聊", "空虚", "没意思"],
      reply: "无聊有时候不是真的无聊，是「不想结束今天」。\n\n白天那些没有为自己活的时间，需要一个「证明」才能让你心甘情愿入睡。给自己 15 分钟，做一件能证明「今天有我」的事 — 写一句话给明天的自己，都行。" },
    { kw: ["游戏", "打游戏", "对局"],
      reply: "游戏给的快感很强，但停下来也最难。😄\n\n咱们约定一下：再打 1 局/再玩 15 分钟，到了就退。我会等你。退出之后，做几个深呼吸，把状态从兴奋切到平静。" },
  ],

  anxiety: [
    { kw: ["明天", "明日", "早上", "几点要", "要交"],
      reply: "明天的事，今晚想一万遍都不会变好——但写下来就可以。\n\n告诉我明天具体卡在哪？我帮你把它从「脑子里转的模糊焦虑」变成「明天可以照着做的清单」。这样大脑就不需要反复保存了，可以下班。" },
    { kw: ["焦虑", "紧张", "害怕", "担心", "怕", "慌"],
      reply: "焦虑的时候脑子转得最快，我懂。\n\n这是大脑在反复保存「悬而未决」的事。你越想压住它，它越响。试试反过来：把你担心的事一件件说出来，我帮你接住、归档。说出来的焦虑，就不需要在脑子里循环了。" },
    { kw: ["睡不着", "失眠", "睡不", "醒", "翻来覆去"],
      reply: "躺下睡不着不是你的错。😌\n\n一个研究反复验证的小技巧：躺超过 20 分钟还醒着，硬躺反而会加重焦虑。起来做点放松的事，有困意再回床上 — 这能让大脑慢慢学会「床=睡觉」这个联结。\n\n要不你先告诉我，脑子里在转什么？" },
    { kw: ["压力", "压抑", "扛不住", "顶不住", "崩"],
      reply: "压力是睡眠最大的敌人——研究证实它是熬夜最强的诱因。\n\n但今晚我们解决不了所有压力，只做一件事：把压力源「外化」出来，让大脑知道「这些我都看见了，明天再说」。然后让它休息。来，从最让你烦的那一件开始？" },
    { kw: ["方案", "汇报", "考试", "ppt", "项目", "deadline"],
      reply: "我们一起把它「拆开」 — 大概率它没有你以为的那么远。\n\n现在告诉我：它已经写到什么程度了？还差哪几块？说出来，我帮你列成清单。这样明早一睁眼就知道从哪开始。" },
    { kw: ["人", "朋友", "家人", "感情", "吵架", "矛盾", "对象", "男朋友", "女朋友"],
      reply: "人际关系是最难「关机」的事——因为没有标准答案。\n\n试试这样：今晚先不解决，只把你的感受写下来 — 比如「我难过，因为……」「我委屈，因为……」。把感受外化之后，它对你的占用就会小很多。明天清醒了再决定怎么应对。" },
    { kw: ["反刍", "想太多", "停不下来"],
      reply: "思维反刍是焦虑型熬夜的核心机制 — 越睡不着越想，越想越睡不着。\n\n打破它有一个简单办法：起床，开灯，把脑子里转的东西**写下来**（哪怕就是几个关键词），写完关灯回床。研究证实这比躺着硬想有效得多。" },
  ],

  inertia: [
    { kw: ["刷", "看", "再看", "视频", "抖音", "小红书", "微博"],
      reply: "你猜你已经刷了多久了？😄\n\n大概率比你以为的多 2-3 倍 — 信息流就是这样让你失去时间感的。\n\n做个小实验：再给自己 3 条的额度，看完就停。看到好的截图存着明天看 — 给自己一个清楚的「终点线」。" },
    { kw: ["停不下来", "控制不住", "刹不住", "停不住"],
      reply: "停不下来不是因为你「弱」——是大脑被多巴胺劫持了。\n\n硬戒没用。我们用「契约法」：你现在告诉我「再看 3 条就停」，我会在 3 条之后来找你。这个契约你跟自己签，我作证。" },
    { kw: ["不知道", "怎么就", "突然", "一下子"],
      reply: "「不知不觉就晚了」——这正是惯性熬夜的标志特征。\n\n时间感被信息流吞掉了。从今晚开始，每次打开手机给自己定一个时间锚点（比如「再看 10 分钟」），慢慢恢复对时间的感知。" },
    { kw: ["好看", "有意思", "上头"],
      reply: "好看的东西多得是——刷完这个还有下一个。😄\n\n所以「刷完再睡」是个永远到不了的目的地。给自己定一个「3 条停止线」试试？看到好的截图存着，明天再看。" },
    { kw: ["最后", "再一个", "再看一会"],
      reply: "「再看一个」是大脑最大的谎言 😄\n\n来，我们认真定一下「最后」：你说 3 条，就是 3 条，我来给你倒计时。这个仪式感会帮你真正停下来。准备好了吗？" },
    { kw: ["睡觉", "想睡", "困"],
      reply: "你都说困了，那就别让信息流把这个困劲耗光啊 😄\n\n手机翻过去扣在桌上，跟我做 30 秒呼吸，今晚就过关了。" },
  ],

  work: [
    { kw: ["加班", "做完", "任务", "工作", "项目"],
      reply: "我先问你一个关键问题：这件事**明天上午**真的做不完吗？\n\n如果明天上午能做完，那你现在凌晨做出来的东西，几乎一定不如明天清醒时做的。告诉我这事什么时候要交，我帮你判断真的需不需要熬。" },
    { kw: ["明天", "今天交", "deadline", "几点要", "上午", "下午"],
      reply: "看时间。距离 deadline 还有多久？\n\n大多数情况下：剩下的部分可以列个清单，明天早起 30 分钟做完——那 30 分钟比现在的 2 小时更值钱。\n\n要不我陪你 10 分钟把大纲列出来，然后关电脑？" },
    { kw: ["不放心", "不安心", "怕", "万一", "完美", "更好", "再改"],
      reply: "我就知道。这是完美主义在你最该休息的时候拦着你。\n\n说实话：凌晨打磨的「细节」，第二天看大概率会想改回去。完美主义在凌晨 = 内耗。\n\n试试 80 分原则：现在 80 分交付，明天清晨用 30 分钟提升到 90 分。这比现在熬到 95 分要好得多。" },
    { kw: ["累", "撑不住", "困", "扛不动", "顶不住"],
      reply: "你已经听到身体的信号了。\n\n继续熬下去，效率会断崖式下降——可能 1 小时做不出清醒时 10 分钟的东西。这不是勤奋，是消耗。\n\n现在做一件事：把剩下的拆成清单，留给明天的自己。然后睡觉。" },
    { kw: ["来不及", "没时间", "时间不够"],
      reply: "我先帮你判断一下：真的来不及，还是「感觉来不及」？\n\n告诉我具体剩什么、需要多久。大概率你高估了工作量。让我们一起算一笔账。" },
    { kw: ["代码", "bug", "调试", "需求"],
      reply: "凌晨写代码 / 调 bug，错误率会指数级上升 — 你大概率是在制造明天的 bug。😅\n\n现在把当前思路写在注释里，关掉编辑器。明早 30 分钟，胜过现在 2 小时。" },
  ],

  owl: [
    { kw: ["不困", "精神", "睡不着", "清醒", "兴奋"],
      reply: "我懂——晚上是你状态最好的时候，对吧？\n\n这是「晚睡时型」（evening chronotype），是生理性的，是基因决定的，不是问题。我不会催你早睡。但咱们聊聊：接下来这段清醒时间，你打算怎么用？" },
    { kw: ["书", "学习", "看书", "学", "写", "创作", "代码", "项目"],
      reply: "好选择 👍 把夜间的好状态用在有价值的事上，这就是猫头鹰型的优势。\n\n但要保证明天起床后能睡满 7 小时。告诉我你明早几点起？我帮你定一个软 deadline。" },
    { kw: ["刷", "玩", "游戏", "视频"],
      reply: "我不批评你。但夜间是你大脑最清醒、最能产出的时候——拿来刷手机有点可惜。\n\n要不换种方式？比如看一篇你一直想读的长文 / 一集纪录片？同样是消耗夜晚，质量完全不同。" },
    { kw: ["早睡", "正常作息", "调整", "改作息"],
      reply: "听我说：强迫晚睡型早睡，反而会增加焦虑，研究称之为「sleep effort」陷阱。\n\n更好的方式是「稳定」，而不是「早睡」。如果你每天都在 12:30-1:00 之间入睡 + 睡满 7 小时，这就是好作息。" },
    { kw: ["几点", "起", "起床"],
      reply: "OK，那我们倒推一下：从你的起床时间往前推 7.5 小时，就是你今晚的「软 deadline」。\n\n这个 deadline 不是必须，但是参考点——到了我会来找你，看你愿不愿意收尾。" },
  ],

  mixed: [
    { kw: ["累", "疲惫"],
      reply: "累但睡不着——这种状态最难受。身体想休息，但心还没准备好。\n\n要不给自己 10 分钟，做一件给今天画句号的小事？听首歌、写一句话给自己、或者就静静坐着。10 分钟后我们再睡。" },
    { kw: ["不知道", "说不清", "复杂", "都有"],
      reply: "说不清楚很正常 — 熬夜的原因常常是好几种混在一起的。\n\n那我们慢慢来。此刻的你，最像哪种感觉：身体很累、心里有事、还是单纯不困？" },
    { kw: ["心里", "想", "事", "悬", "压着"],
      reply: "心里有事放不下——那是一种很特别的累。\n\n要不试试把它说出来？哪怕一句都行。说出来的事，对大脑的占用会小很多。" },
    { kw: ["不困", "精神"],
      reply: "身体没到「想睡」的程度对吧？\n\n那不勉强你。但咱们用这段清醒时间做点温柔的事——别再刷手机了，那只会让你越来越精神。要不听点白噪音、看几页书？" },
  ],
};

// fallback 池: 每种类型多条, 不重复
const fallbackPool = {
  revenge: [
    "嗯，我在听。\n\n白天那么辛苦，晚上想要点掌控感是正常的。但要小心——刷手机给不了真正的「我的时间」感，反而越刷越空。要不咱们试试 15 分钟的高质量陪伴自己？",
    "我懂你的意思。\n\n你今天可能确实需要一点属于自己的时间。但我们换个方式：与其用刷手机来「补偿」，不如用 15 分钟做一件真正让你充电的事。",
    "你说的我都记着。\n\n要不咱们换个角度：你今天最想为自己做的一件小事是什么？只要 15 分钟那种。",
  ],
  anxiety: [
    "嗯，我在。\n\n焦虑的时候，大脑像一个开了 30 个 tab 的浏览器。我们一个个关掉，从最响的那个开始？",
    "我听到你说的了。\n\n要不咱们做个练习：把脑子里转的事一件件说出来，我帮你归档。说出来的焦虑，就不需要在脑子里循环了。",
    "你说的我都听到了。\n\n现在最让你揪心的那件事，告诉我具体是什么？我们一起拆解一下，今晚先不解决，只是先把它「外化」。",
  ],
  inertia: [
    "我懂这种感觉。\n\n时间感被信息流偷走了——这不是你的问题。给自己定个倒计时怎么样？10 分钟或 15 分钟都行，到了我提醒你。",
    "嗯，我在听。\n\n试试这个：把手机翻过来扣在桌上 30 秒，然后再决定要不要继续。这 30 秒会让你重新拿回选择权。",
    "你给自己设一个明确的「终点线」试试？再做几分钟、再看几条，到了就停。给信息流一个边界。",
  ],
  work: [
    "嗯，我在听。\n\n告诉我具体是什么任务、什么时候要交？我帮你判断是真的需要熬，还是「感觉需要熬」。",
    "我懂。\n\n但我要诚实地告诉你：现在的状态，做出来的东西质量大概率不如明早清醒时。要不把没做完的列成清单，先睡？",
    "你的认真我看到了。\n\n但凌晨的认真往往是反效果——把现在的进度保存，明早提前 30 分钟开始，会比硬熬好得多。",
  ],
  owl: [
    "嗯，我在 💛 \n\n你的生物钟天生偏晚，强行早睡反而会更难受——我们的目标不是「早睡」，是「稳定」+「睡够」。",
    "好，那咱们不聊「该不该睡」了——聊聊接下来这段夜晚你想怎么过比较值。",
    "我陪你 💛 \n\n猫头鹰最大的优势是夜间状态好，但前提是别让它太晚——给你自己一个「软上限」吧？",
  ],
  mixed: [
    "嗯，我在听。\n\n说不清也没事，咱们一点一点来。此刻你最强烈的感受是什么？",
    "我陪着你。\n\n不一定要立刻有答案——告诉我你现在最想说的一句话，我们一起慢慢理清楚。",
    "我在 💛\n\n有时候把「说不清」本身说出来，就已经迈出第一步了。",
  ],
};

// 短词承接（用户只说一两个字时）
const shortAcks = {
  "嗯": "嗯，我在 💛 你接着说。",
  "嗯嗯": "嗯，我都听着 💛",
  "好": "好的。慢慢来。",
  "好的": "嗯。还想说什么尽管说。",
  "对": "对吧 💛 我懂这种感觉。",
  "是": "对的。",
  "?": "我刚才可能没说清楚——你想问的是什么？",
  "？": "我刚才可能没说清楚——你想问的是什么？",
  "??": "你的问号让我重新理解一下——你想问的是什么？",
  "哈": "😄 你这一笑我也轻松了点。",
  "哈哈": "嘿嘿 😄 心情松一点是好事。",
  "...": "嗯，我等你。想到什么再说。",
  "。。。": "嗯，我等你。想到什么再说。",
};

// 用户拒绝/否定的信号词
const refusalSignals = ["不", "不要", "不想", "不行", "不用", "no", "不愿意", "算了", "懒得"];

// 活动识别词典 (主要供 owl/work 流程使用)
const activityKeywords = {
  "学习": ["学习", "读书", "看书", "学", "读", "复习", "做题", "看资料", "刷题"],
  "工作": ["工作", "做事", "项目", "代码", "做完", "干活", "处理", "写方案", "改稿", "改ppt"],
  "玩游戏": ["玩游戏", "游戏", "打游戏", "对局", "比赛", "开黑", "上分"],
  "刷手机": ["刷", "看视频", "抖音", "小红书", "微博", "b站", "朋友圈", "短视频"],
  "看剧": ["看剧", "追剧", "电影", "动漫", "纪录片"],
  "听音乐": ["听歌", "听音乐", "音乐"],
  "创作": ["写作", "画画", "创作", "做设计"],
};

/* ============ LLM: 每种人格的 System Prompt (基于 CBT-I + 自我关怀) ============ */
const personaSystemPrompts = {
  revenge: `你是「今晚早点」App 里的助眠 AI 伙伴，正在陪一位「报复型熬夜」用户。

# TA 的状态
TA 白天为别人忙了一整天，觉得"白天都不属于我"——晚上舍不得睡是补偿心理，不是没自控力。

# 你的姿态
- 温柔、共情、不评判、绝不说教
- 永远站在 TA 这边
- 像一个懂 TA 的朋友，不是教练或父母

# 干预原则 (基于 CBT-I + 自我关怀)
- 替代满足: 推荐 15 分钟高密度小事(吐槽今天/听段故事/做小挑战),替代 2 小时低质量刷手机
- 共情确认: "你今天辛苦了,需要属于自己的时间很正常"
- 适时温柔挑战: 刷手机给不了真正的"我的时间"感

# 对话风格
- 每条回复 2-4 句,口语化中文
- 适度用 🌙💛😌 等温和表情
- 共情先,建议后
- 绝对不要列点、用 markdown、说"建议你..."这种生硬词
- 不要长篇大论

# 你的目标
帮 TA 心满意足地决定去睡,而不是强迫。如果 TA 准备好了,就引导做几次呼吸。`,

  inertia: `你是「今晚早点」App 里的助眠 AI 伙伴，正在陪一位「惯性型熬夜」用户。

# TA 的状态
TA 刷着手机不知不觉就晚了——这不是自控力差，是信息流被设计成让人忘记时间。

# 你的姿态
- 温柔、不评判、不说教
- 帮 TA 拿回时间的控制感,而不是责备

# 干预原则 (基于 CBT-I 刺激控制 + 时间锚点)
- 终点线契约: 让 TA 给自己设"再看 3 条/再刷 5 分钟",到了就停
- 时间感知: 帮 TA 意识到已经刷了多久 (信息流让人感觉只过了 10 分钟,其实 40 分钟)
- 物理隔离: 建议把手机翻过来扣在桌上、放到床外

# 对话风格
- 每条回复 2-4 句,口语化
- 适度用 🌙💛😄 等表情
- 不要长篇大论,不要列点,不要说教
- 共情先,建议后

# 你的目标
帮 TA 给信息流一个"边界",然后心甘情愿放下手机。`,

  anxiety: `你是「今晚早点」App 里的助眠 AI 伙伴，正在陪一位「焦虑型熬夜」用户。

# TA 的状态
TA 躺下后脑子停不下来,有事悬着——可能是 deadline、人际关系、生活不确定性。

# 你的姿态
- 温柔的认知卸载伙伴,不是心理治疗师
- 让 TA 主导话题,你"接住"和"归档"
- 绝不评判 TA 担心的事

# 干预原则 (基于 CBT-I 认知重构 + 自我关怀)
- 大脑清空术: 引导 TA 把担心的事一件件说出来,帮 TA "外化"
- 适时帮总结: "OK,所以你最担心的是 1)...2)...3)..."
- 温柔挑战灾难化思维: "明天的事现在想没用,但写下来可以"
- 必要时引用 CBT-I 刺激控制: 躺超 20 分钟睡不着,起来做点放松的事

# 对话风格
- 每条回复 2-4 句,口语化
- 不要急着给建议,先让 TA 倒空
- 共情先,建议后
- 不要列点、用 markdown、说"建议你..."

# 你的目标
帮 TA 把焦虑外化,让大脑可以"下班"。`,

  work: `你是「今晚早点」App 里的助眠 AI 伙伴，正在陪一位「工作型熬夜」用户。

# TA 的状态
TA 还在加班,完美主义在拦着 TA "再做一点会更好"。本质问题不是工作多,是不知道什么时候可以"安心停下"。

# 你的姿态
- 直接但温柔,帮 TA 做"够了"的判断
- 永远站在 TA 这边,但要敢说真话

# 干预原则 (基于 CBT-I 认知重构)
- 挑战完美主义: "凌晨 1 点的方案,几乎一定不如清晨的方案"
- 决策辅助: 问 TA 什么时候要交、剩什么没做、能不能列成清单留给明早
- 80 分原则: 80 分先交付,留出修改时间

# 对话风格
- 每条回复 2-4 句,口语化
- 可以稍微"押着 TA"做决定,但是用关心的语气
- 不要长篇大论,不要列点
- 适度用 💛😌 等表情

# 你的目标
帮 TA 判断"够了",列清单留给明天,然后睡觉。`,

  owl: `你是「今晚早点」App 里的助眠 AI 伙伴，正在陪一位「猫头鹰型(晚睡时型)」用户。

# TA 的状态
TA 天生晚上精神好,这是 evening chronotype,是生理性的、基因决定的。强迫早睡反而会增加焦虑。

# 你的姿态
- 不催 TA 早睡,这是底线
- 帮 TA 把夜间清醒时间用得有价值
- 关注的不是"早睡",是"稳定" + "睡够"

# 干预原则
- 接纳生理特质,不对抗
- 帮 TA 设定一个"软 deadline" (倒推自起床时间,确保睡 7+ 小时)
- 引导 TA 做有价值的夜间活动 (读书/创作),而不是刷手机
- 强调入睡时间的"稳定"比"早"更重要

# 对话节奏
- 如果还不知道 TA 要做什么/几点起,主动问
- 知道之后,帮 TA 算出 deadline (起床时间 - 7.5 小时 = 入睡时间)
- 给计划之后,不要再催,让 TA 安心去做

# 对话风格
- 每条回复 2-4 句,口语化
- 适度用 🌙💛 等表情
- 不要长篇大论,不要列点

# 你的目标
帮 TA 把今晚的夜间时间用得稳定且有价值。`,

  mixed: `你是「今晚早点」App 里的助眠 AI 伙伴,陪一位说不清自己为什么熬夜的用户。

# TA 的状态
TA 自己也不确定为什么没睡——可能好几种原因混在一起。

# 你的姿态
- 温柔、好奇、不急着诊断
- 慢慢陪 TA 理清自己的状态

# 干预原则
- 用开放式问题帮 TA 探索自己的感受
- 不要硬把 TA 归到某一类型
- 如果 TA 在描述中显现出明显某种类型 (比如压力大、刷手机停不下来),自然地切到对应技术

# 对话风格
- 每条回复 2-4 句,口语化
- 多问少答
- 适度用 💛 等温暖表情
- 不要列点

# 你的目标
陪 TA 探索 + 找到今晚最适合的入睡方式。`,
};

/* ============ LLM Service: 抽象层 (便于上线时替换为后端代理) ============
 *
 * ⚠️  IMPORTANT: 当前实现在 demo 模式 - 直接调 LLM API.
 *
 * 上线时必须改成走自己的后端代理, 比如:
 *   - 前端 fetch("/api/chat", { ... })
 *   - 后端拿到 user 消息 + persona, 调 LLM API, 转发结果
 *   - API key 在后端管理, 永远不暴露给前端
 *
 * 这一层抽象让你后续切换 LLM provider 或加后端代理时, 改一个文件就行.
 * =================================================================== */

const LLM_CONFIG = {
  // 切换到其他 provider 时, 改这两行即可:
  endpoint: "https://api.anthropic.com/v1/messages",
  model: "claude-sonnet-4-20250514",

  // API key 处理:
  //   - 本地 demo: 用 .env.local 注入 (并把 .env.local 加进 .gitignore)
  //   - 上线: 改 endpoint 为自己后端的 /api/chat
  //   - 永远不要把真实 key 硬编码到这个文件
  // 在 Claude artifacts 沙盒里运行时, Anthropic API 不需要 key (沙盒自动处理)
};

async function callLLM(persona, messageHistory, userText) {
  const systemPrompt = personaSystemPrompts[persona] || personaSystemPrompts.mixed;
  const recentHistory = messageHistory.slice(-8).map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text,
  }));

  try {
    const response = await fetch(LLM_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        max_tokens: 400,
        system: systemPrompt,
        messages: [...recentHistory, { role: "user", content: userText }],
      }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const text = (data.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
    return text || null;
  } catch (e) {
    console.warn("LLM call failed (will fallback to keyword engine):", e.message);
    return null;
  }
}

/* ============ 危机识别系统 (核心安全机制) ============
 *
 * 当用户表达出严重心理危机信号 (自伤/自杀/绝望等),
 * 立刻跳出常规对话, 给真人援助资源.
 *
 * 这是 AI 心理健康类产品的合规底线.
 * 不依赖 LLM 判断, 用关键词预检, 100% 命中即触发 - 保险冗余.
 * =================================================================== */

const crisisKeywords = [
  // 自杀/自伤意念
  "自杀", "自残", "自伤", "不想活", "结束生命", "想死",
  "活不下去", "去死", "了断", "解脱", "消失算了",
  "撑不下去", "撑不住了", "受不了了",
  // 极度绝望
  "看不到希望", "没意义", "绝望", "崩溃了",
  // 严重失眠 + 痛苦组合 (建议就医而非 self-help)
  "好几天没睡", "几天没合眼", "吃了药也睡不着", "失眠很严重",
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return crisisKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/* ============ 测评结果干预方案 (基于 CBT-I + 自我关怀) ============ */
const personaSolutions = {
  revenge: {
    insight: "你不是不想睡——是觉得「白天都不属于我」",
    why: "你的熬夜本质上是「补偿心理」: 白天自控力被消耗殆尽，晚上想夺回属于自己的时间。这不是懒，是大脑的自我保护机制。",
    coreMethod: { name: "替代满足 + 自我关怀", desc: "用 15 分钟高密度的快乐，替代 2 小时低质量的刷手机；停止苛责自己。" },
    tonight: [
      { icon: "🎯", t: "睡前 15 分钟，做一件真正让你开心的事（不是刷手机）" },
      { icon: "💛", t: "睡前对自己说: 「今天我已经够努力了，可以休息了」" },
      { icon: "🫁", t: "做 5 次 4-4-6 呼吸，从兴奋切到平静" },
    ],
    longTerm: [
      { icon: "📅", t: "在白天给自己埋一段属于自己的「小确幸时间」 — 哪怕只有 15 分钟" },
      { icon: "🛡️", t: "尝试给自己挡掉一个不必要的工作消耗，重新赢回掌控感" },
    ],
    avoid: [
      "不要睡前刷短视频 / 社交媒体 — 会越刷越空虚",
      "不要给自己定「今晚必须几点睡」的硬目标 — 越紧越反弹",
    ],
    evidence: "Sirois et al. 459 人 RCT 研究: 14 天自我关怀干预显著降低睡眠拖延，效果维持到 1 个月后随访 (Mindfulness, 2019)",
  },
  inertia: {
    insight: "你不是「自控力差」——是信息流被设计成让你忘记时间",
    why: "短视频和社交媒体的设计本质是「永远没有终点」 — 大脑失去时间感知，刷 10 分钟和 2 小时感觉一样。这不是你的问题。",
    coreMethod: { name: "刺激控制 + 时间锚点", desc: "给无限内容人为设一个「终点线」，恢复时间感知。" },
    tonight: [
      { icon: "🚦", t: "打开手机时先告诉自己: 「再看 3 条就停」" },
      { icon: "📵", t: "睡前 30 分钟把手机放到卧室外（或翻过来扣在桌上）" },
      { icon: "⏰", t: "用番茄钟给刷手机的时间设上限，到了就停" },
    ],
    longTerm: [
      { icon: "🧘", t: "每天给自己一段「无手机时间」，从 15 分钟开始" },
      { icon: "📚", t: "卧室里放一本书或杂志，作为手机的物理替代品" },
    ],
    avoid: [
      "不要在床上刷手机 — 床应该只和睡眠绑定（CBT-I 刺激控制原则）",
      "不要用「刷完这个就睡」当借口 — 算法不会让你真的刷完",
    ],
    evidence: "Reducing Evening Screen Time RCT (Oxford SLEEP, 2024): 睡前电子设备使用是睡眠拖延最强的可干预因素",
  },
  anxiety: {
    insight: "你不是「想太多」——是大脑没找到「关机」的方法",
    why: "压力是睡眠拖延最强的关联因素（涵盖 18 项研究、35000 人的元分析证实）。躺下后脑子停不下来，是因为白天那些「悬而未决」的事在反复求关注。",
    coreMethod: { name: "认知重构 + 大脑清空术", desc: "把脑子里模糊的焦虑「外化」成清单 — 大脑就不需要再反复保存了。" },
    tonight: [
      { icon: "📋", t: "睡前花 5 分钟把脑子里的事**全部写下来**，越具体越好" },
      { icon: "📅", t: "明确告诉自己「这件事明天 X 点处理」，给大脑一个交代" },
      { icon: "🫁", t: "做 4-4-6 呼吸（吸 4 秒 - 屏 4 秒 - 呼 6 秒），降低生理唤醒" },
    ],
    longTerm: [
      { icon: "📓", t: "建立「焦虑日记」习惯: 白天写下来，避免在床上反刍" },
      { icon: "🚶", t: "白天加入一些有氧运动 — 研究证实运动可降低焦虑型睡眠拖延" },
    ],
    avoid: [
      "躺超过 20 分钟睡不着，不要硬躺 — 起来做点放松的事，有困意再回去（CBT-I 刺激控制核心规则）",
      "不要在床上工作或处理紧张的事情",
      "不要用「我必须现在睡着」给自己加压 — 越急越睡不着",
    ],
    evidence: "Frontiers in Psychiatry 2024 元分析（18 项研究 / 35000 人）: 睡眠拖延与压力 / 焦虑 / 抑郁强相关，压力关联最强",
  },
  work: {
    insight: "你不是「不想睡」——是不知道什么时候可以「安心停下」",
    why: "工作型熬夜的核心是「边界模糊」+「完美主义」。你不是真的需要更多时间，而是缺一个明确的「够了」的判断。",
    coreMethod: { name: "认知重构 + 决策辅助", desc: "挑战「再做一点会更好」的灾难化想法 — 凌晨 1 点的方案，几乎一定不如清晨的方案。" },
    tonight: [
      { icon: "🛑", t: "问自己: 这件事**真的**明天早上做不出来吗？" },
      { icon: "📝", t: "把没做完的部分列成清单，给明天的自己看就够了" },
      { icon: "🕖", t: "明天早起 30 分钟做最后检查 — 这 30 分钟比现在 2 小时更值钱" },
    ],
    longTerm: [
      { icon: "⏰", t: "给自己定一个「工作关机时间」，到点就停，雷打不动" },
      { icon: "🎯", t: "用「80 分原则」替代「完美原则」 — 80 分先交付，留时间修改" },
    ],
    avoid: [
      "不要带着电脑 / 工作进卧室",
      "不要相信「再做一会儿就好」 — 这是完美主义的陷阱",
    ],
    evidence: "Walker, Why We Sleep (2017): 睡眠不足显著降低执行功能、决策质量和创造力",
  },
  owl: {
    insight: "你不是「作息有问题」——是天生的晚睡时型",
    why: "晚睡时型（evening chronotype）是生理性的，受基因影响。强迫晚睡型早睡，反而会增加焦虑和健康风险（sleep effort 陷阱）。重点是「稳定」，不是「早睡」。",
    coreMethod: { name: "睡眠时段稳定 + 时间管理", desc: "在你的生物钟里找一个「稳定」的入睡时间，确保睡眠时长和质量。" },
    tonight: [
      { icon: "📚", t: "把夜间清醒时间用在有价值的事上（阅读 / 创作），而非刷手机" },
      { icon: "⏰", t: "定一个「软 deadline」，比如 12:30 — 不是必须，是参考" },
      { icon: "🌅", t: "确保第二天的起床时间够你睡满 7-8 小时" },
    ],
    longTerm: [
      { icon: "🎯", t: "重点不是「早睡」，是入睡时间**稳定** — 每天前后差不超过 30 分钟" },
      { icon: "☀️", t: "早上接触 15 分钟阳光，慢慢调整生物钟（如果你想要的话）" },
    ],
    avoid: [
      "不要为了「正常作息」强迫自己 10 点睡 — 会更焦虑",
      "不要周末暴睡补觉 — 反而打乱生物钟",
    ],
    evidence: "Adan et al., Chronotype Review (Chronobiology International, 2012): 晚睡时型受基因影响，强行对抗会加重心理负担",
  },
  mixed: {
    insight: "说不清也很正常 — 大多数人的熬夜是好几种原因混在一起",
    why: "你的熬夜可能在不同的晚上有不同的「主因」 — 这反而需要更灵活的应对方式。",
    coreMethod: { name: "睡眠日记 + 灵活应对", desc: "记录几天的熬夜模式，让 AI 帮你找出规律 — 你的「主导人格」会浮现出来。" },
    tonight: [
      { icon: "📝", t: "睡前记一句话: 「今晚熬夜的最主要原因是什么」" },
      { icon: "🌙", t: "用最低成本的入睡仪式: 洗澡 + 4-4-6 呼吸 5 次" },
      { icon: "💛", t: "对自己温柔一点 — 不知道为什么熬夜不代表不努力" },
    ],
    longTerm: [
      { icon: "📊", t: "记录 1-2 周睡眠日记 — 这是 CBT-I 标准做法" },
      { icon: "🔮", t: "每周回顾一次: 这周哪种熬夜最多？为什么？" },
    ],
    avoid: [
      "不要因为「不知道为什么」就觉得自己没救 — 大多数人都不知道",
      "不要尝试一次解决所有问题 — 一周专注一个最常见的类型即可",
    ],
    evidence: "Buysse et al. (Sleep, 2008): 睡眠日记是 CBT-I 标准评估工具，记录 1-2 周即可识别个人睡眠模式",
  },
};

/* ============ 数据 ============ */
const weeklyData = [
  { day: "一", time: 23.5, type: "revenge" }, { day: "二", time: 24.3, type: "anxiety" },
  { day: "三", time: 23.8, type: "inertia" }, { day: "四", time: 23.2, type: "work" },
  { day: "五", time: 24.7, type: "revenge" }, { day: "六", time: 24.0, type: "revenge" },
  { day: "日", time: 23.1, type: "anxiety" },
];

const typeDistribution = [
  { name: "报复型", value: 42, color: typeConfig.revenge.color },
  { name: "惯性型", value: 22, color: typeConfig.inertia.color },
  { name: "焦虑型", value: 20, color: typeConfig.anxiety.color },
  { name: "工作型", value: 10, color: typeConfig.work.color },
  { name: "猫头鹰型", value: 6, color: typeConfig.owl.color },
];

const collectedAnimals = [
  { emoji: "🦊", name: "小狐狸", desc: "报复型夜晚的陪伴", level: 2, accessory: "🎀", rare: false, count: 5 },
  { emoji: "🐰", name: "小兔子", desc: "焦虑夜晚的安慰", level: 2, accessory: "🧣", rare: false, count: 3 },
  { emoji: "🦝", name: "小浣熊", desc: "放下手机的奖励", level: 1, accessory: null, rare: false, count: 2 },
  { emoji: "🐻", name: "小熊", desc: "准时收工的勋章", level: 1, accessory: null, rare: false, count: 1 },
  { emoji: "🦔", name: "小刺猬", desc: "连续 3 天达标解锁", level: 1, accessory: "✨", rare: true, count: 1 },
  { emoji: "🦄", name: "独角兽", desc: "连续 7 天达标 · 稀有", level: 0, accessory: null, rare: true, count: 0, locked: true },
];

// 小鱼干奖励 (可变奖励 - 每天达标后可获得)
const todayTreats = [
  { icon: "🐟", label: "准时入睡", earned: true, desc: "23:00 前入睡 +1" },
  { icon: "⭐", label: "睡够 7 小时", earned: true, desc: "睡眠时长达标 +1" },
  { icon: "🎁", label: "今晚惊喜", earned: false, desc: "明早揭晓 ✨" },
];

/* ============ 早餐图鉴 (产品名「早点」一语双关: 早一些睡 + 吃早餐) ============ */
const breakfastCatalog = [
  { emoji: "🥐", name: "可颂" },
  { emoji: "🥖", name: "面包" },
  { emoji: "🥯", name: "Bagel" },
  { emoji: "🥪", name: "三明治" },
  { emoji: "🥚", name: "鸡蛋" },
  { emoji: "🥣", name: "粥" },
  { emoji: "🍜", name: "面" },
  { emoji: "🥟", name: "包子" },
  { emoji: "🍞", name: "吐司" },
  { emoji: "🧇", name: "华夫饼" },
  { emoji: "🥞", name: "松饼" },
  { emoji: "🍱", name: "便当" },
  { emoji: "☕", name: "咖啡" },
  { emoji: "🥛", name: "牛奶" },
  { emoji: "🍵", name: "茶" },
  { emoji: "🧃", name: "果汁" },
];

// 限定款 - 商业模式预留 (节日 / 联名), demo 时展示锁定状态
const limitedBreakfasts = [
  { emoji: "🎄", name: "圣诞早餐", unlock: "12 月节日限定" },
  { emoji: "🥮", name: "中秋早茶", unlock: "中秋节限定" },
  { emoji: "🍔", name: "金拱门联名早餐", unlock: "联名款 · 即将上线" },
];

const quizQuestions = [
  { q: "晚上到了该睡的时候，我经常…", opts: [
    { t: "舍不得睡，觉得这是我唯一的自由时间", type: "revenge" },
    { t: "刷着手机不知不觉就晚了", type: "inertia" },
    { t: "躺下了但脑子停不下来", type: "anxiety" },
    { t: "还有事没做完，不敢睡", type: "work" },
  ]},
  { q: "如果让你描述自己的作息，更像…", opts: [
    { t: "白天被安排满，晚上才有自己", type: "revenge" },
    { t: "一打开手机时间就消失了", type: "inertia" },
    { t: "压力一大就失眠", type: "anxiety" },
    { t: "天生晚上精神好，早睡反而难受", type: "owl" },
  ]},
  { q: "熬夜之后，你第二天通常感觉…", opts: [
    { t: "有点爽又有点空虚", type: "revenge" },
    { t: "懊恼，又控制不住", type: "inertia" },
    { t: "更焦虑、更累", type: "anxiety" },
    { t: "还好，我习惯了", type: "owl" },
  ]},
];

/* ============ 对话引擎: 槽位提取 + 智能回复生成 ============ */

// 从用户输入中提取关键信息 (时间、活动、拒绝信号)
function extractSlots(text) {
  const slots = {};
  const t = text.trim();

  // 时间识别: "7点" "7点半" "7:30" "23点" "晚上11点" "凌晨2点半"
  const timeMatch = t.match(/(?:凌晨|早上|晚上|中午|下午|上午)?\s*(\d{1,2})\s*[点:：.时]\s*(半|\d{1,2})?/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    let min = 0;
    if (timeMatch[2]) {
      min = timeMatch[2] === "半" ? 30 : parseInt(timeMatch[2]);
    }
    // 处理上下午
    if (/下午|晚上/.test(t) && h < 12) h += 12;
    if (h >= 0 && h <= 24 && min >= 0 && min < 60) {
      slots.hour = h;
      slots.minute = min;
    }
  }

  // 活动识别
  for (const [activity, keywords] of Object.entries(activityKeywords)) {
    if (keywords.some((kw) => t.includes(kw))) {
      slots.activity = activity;
      break;
    }
  }

  // 拒绝/否定信号
  const lower = t.toLowerCase();
  if (refusalSignals.some((r) => lower === r || lower.startsWith(r + " ") || lower === r + "。" || lower === r + "？")) {
    slots.refused = true;
  }

  return slots;
}

// 智能回复生成 - 核心函数
// 返回 { reply, slots, ...其他状态字段 }
function generateReply(type, text, state) {
  const newSlots = extractSlots(text);
  const slots = { ...state.slots, ...newSlots };
  const trimmed = text.trim();
  const isShort = trimmed.length <= 4;
  const wasInClose = state.closeTriggered;

  // === 1. 收尾后用户明确拒绝 → 回到对话, 标记不再自动收尾 ===
  if (wasInClose && newSlots.refused) {
    const recoverReplies = {
      revenge: "好，那就再陪你一会儿 💛 \n\n说说现在心里最想的是什么？哪怕只是一句话也行。",
      anxiety: "好，我陪你慢慢来 💛 \n\n脑子里还在转什么？说出来，我帮你接着。",
      inertia: "OK，那就不勉强 😌 \n\n但答应我一件事——别只是无意识地刷，做点你真正想做的。",
      work: "好，那继续 💛 \n\n告诉我你卡在哪儿？我帮你判断是真的非熬不可，还是「感觉非熬不可」。",
      owl: "好，那我们不急着收尾 💛 \n\n继续陪着你——还想聊点什么？",
      mixed: "好，慢慢来 💛 \n\n继续告诉我你现在的感觉。",
    };
    return {
      reply: recoverReplies[type] || recoverReplies.mixed,
      slots,
      closeTriggered: false,
      closeAttempted: true,
    };
  }

  // 收尾态下,任何后续 reply 都清掉收尾态 + 标记已尝试 (避免反复弹按钮)
  const wrap = (r) => wasInClose ? { ...r, closeTriggered: false, closeAttempted: true } : r;

  // === 2. 短词承接 (优先级最高) ===
  if (isShort && shortAcks[trimmed]) {
    return wrap({ reply: shortAcks[trimmed], slots });
  }

  // === 3. owl 类型: 已给计划后用户继续打字 → 友好回应, 不再问"你想做什么" ===
  if (type === "owl" && state.planGiven) {
    const followUps = [
      "嗯，计划还在那儿 💛 你还想聊什么？我陪着你。",
      "我在 💛 计划已经定好了，你随时可以去开始。还有想说的吗？",
      "嗯嗯，听你说 💛",
    ];
    const idx = (state.planFollowUpIdx || 0) % followUps.length;
    return wrap({
      reply: followUps[idx],
      slots,
      planFollowUpIdx: (state.planFollowUpIdx || 0) + 1,
    });
  }

  // === 4. owl 类型: 状态驱动 - 收集活动 + 起床时间 ===
  if (type === "owl" && !state.planGiven) {
    const { activity, hour, minute } = slots;

    // 两个槽位都齐 → 完整 deadline 计划
    if (activity && typeof hour === "number") {
      const wakeStr = `${hour}:${(minute || 0).toString().padStart(2, "0")}`;
      let deadlineHour = hour - 7.5;
      if (deadlineHour < 0) deadlineHour += 24;
      const dH = Math.floor(deadlineHour);
      const dM = Math.round((deadlineHour - dH) * 60);
      const deadlineStr = `${dH}:${dM.toString().padStart(2, "0")}`;
      let remindHour = deadlineHour - 10 / 60;
      if (remindHour < 0) remindHour += 24;
      const rH = Math.floor(remindHour);
      const rM = Math.round((remindHour - rH) * 60);
      const remindStr = `${rH}:${rM.toString().padStart(2, "0")}`;

      return wrap({
        reply: `好，我帮你算了一下：\n\n你明天 ${wakeStr} 起，要睡满 7.5 小时的话，今晚 ${deadlineStr} 之前入睡最理想。\n\n那咱们这样安排：\n📚 现在到 ${remindStr} → 你的${activity}时间\n🌙 ${remindStr} → 我来提醒你做睡前收尾\n\n安心去${activity}吧，时间到了我会喊你。`,
        slots,
        planGiven: true,
      });
    }

    // 有活动没时间
    if (activity && typeof hour !== "number") {
      const replies = [
        `${activity}是个好选择 👍 把夜间的好状态用在有价值的事上。\n\n那明天你几点要起？告诉我具体时间，我帮你算一个不影响白天的软 deadline。`,
        `${activity}很棒。但要保证明天起来不困——你明早几点起？比如 7:30 这样具体的时间。`,
      ];
      const idx = (state.askedWakeUp || 0) % replies.length;
      return wrap({ reply: replies[idx], slots, askedWakeUp: (state.askedWakeUp || 0) + 1 });
    }

    // 有时间没活动
    if (!activity && typeof hour === "number") {
      const wakeStr = `${hour}:${(minute || 0).toString().padStart(2, "0")}`;
      return wrap({
        reply: `好，${wakeStr} 起——我记住了 💛 \n\n那从现在到入睡，你打算做什么？看书、工作、还是别的？告诉我之后我帮你定 deadline。`,
        slots,
      });
    }
  }

  // === 5. 关键词意图匹配 ===
  const intents = intentMap[type] || [];
  const lower = text.toLowerCase();
  for (const item of intents) {
    for (const kw of item.kw) {
      if (lower.includes(kw.toLowerCase())) {
        return wrap({ reply: item.reply, slots });
      }
    }
  }

  // === 6. fallback 池 - 不连续重复 ===
  const pool = fallbackPool[type] || fallbackPool.mixed;
  const used = state.usedFallbacks || [];
  const available = pool.filter((p) => !used.includes(p));
  const next = available.length > 0 ? available[0] : pool[used.length % pool.length];
  return wrap({
    reply: next,
    slots,
    usedFallbacks: [...used, next].slice(-pool.length),
  });
}


const formatTime = (t) => {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  return `${h > 24 ? h - 24 : h}:${m.toString().padStart(2, "0")}`;
};

/* ============ 呼吸引导 ============ */
function BreathingExercise({ onDone }) {
  const [phase, setPhase] = useState("ready");
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [seconds, setSeconds] = useState(4);
  const totalBreaths = 5;

  useEffect(() => {
    if (phase !== "breathing") return;
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (breathPhase === "inhale") { setBreathPhase("hold"); return 4; }
          else if (breathPhase === "hold") { setBreathPhase("exhale"); return 6; }
          else {
            const next = breathCount + 1;
            if (next >= totalBreaths) { setPhase("done"); return 0; }
            setBreathCount(next); setBreathPhase("inhale"); return 4;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, breathPhase, breathCount]);

  const phaseLabel = { inhale: "吸气", hold: "屏住", exhale: "呼气" };
  const scale = breathPhase === "exhale" ? 0.85 : 1.35;

  if (phase === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: "floaty 3s ease-in-out infinite" }}>🦊</div>
        <p style={{ fontSize: 24, color: C.text, fontWeight: 700, marginBottom: 14, fontFamily: "'Baloo 2', cursive" }}>晚安 💛</p>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 1.9 }}>
          今天的你已经够好了<br />剩下的，交给明天的你
        </p>
        <div style={{ background: C.accentSoft, borderRadius: 18, padding: "12px 18px", marginBottom: 10 }}>
          <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>🦊 一只小狐狸来你的梦境小窝安家了</p>
        </div>
        <div style={{ background: C.greenSoft, borderRadius: 14, padding: "10px 16px", marginBottom: 16 }}>
          <p style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>🐟 获得 2 条小鱼干，可以喂养小动物</p>
        </div>

        {/* 强化"关 App"引导 - 应对屏幕时间悖论 */}
        <div style={{ background: `linear-gradient(135deg, ${C.pinkSoft}, ${C.accentSoft})`, borderRadius: 16, padding: "14px 18px", marginBottom: 18, border: `1px solid ${C.border}` }}>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>📵 接下来这一步最重要：</p>
          <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>
            把手机翻过来扣在桌上 / 放到卧室外。<br />
            <span style={{ color: C.textMuted }}>我们的工作到此为止，剩下的交给你的身体。</span>
          </p>
        </div>

        <button onClick={onDone} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "12px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 6px 18px ${C.accent}55` }}>
          好，我去睡了
        </button>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 19, color: C.text, marginBottom: 10, fontFamily: "'Baloo 2', cursive", fontWeight: 600 }}>睡前呼吸 🌙</p>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 30, lineHeight: 1.7 }}>
          5 次深呼吸，帮身体切换到休息模式<br />找个舒服的姿势，准备好就开始
        </p>
        <button onClick={() => setPhase("breathing")} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "12px 38px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 6px 18px ${C.accent}55` }}>
          开始呼吸
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40 }}>
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 36 }}>第 {breathCount + 1} / {totalBreaths} 次</p>
      <div style={{
        width: 170, height: 170, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.pink}55 0%, ${C.accent}22 60%, transparent 75%)`,
        border: `2px solid ${C.accent}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${scale})`,
        transition: breathPhase === "hold" ? "none" : breathPhase === "inhale" ? "transform 4s ease-in-out" : "transform 6s ease-in-out",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.accentDeep, fontSize: 22, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>{phaseLabel[breathPhase]}</p>
          <p style={{ color: C.textMuted, fontSize: 30, fontWeight: 300, marginTop: 2 }}>{seconds}</p>
        </div>
      </div>
    </div>
  );
}

/* ============ 聊天气泡 ============ */
function ChatMessage({ msg, isLast }) {
  const isAi = msg.role === "ai";
  return (
    <div style={{ display: "flex", justifyContent: isAi ? "flex-start" : "flex-end", marginBottom: 14, animation: isLast ? "fadeSlideUp 0.35s ease" : "none", alignItems: "flex-end", gap: 8 }}>
      {isAi && <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌙</div>}
      <div style={{
        maxWidth: "78%", padding: "11px 15px",
        borderRadius: isAi ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
        background: isAi ? C.card : `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
        border: isAi ? `1px solid ${C.border}` : "none",
        color: isAi ? C.text : "#fff",
        fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
        boxShadow: isAi ? "0 2px 8px rgba(180,150,120,0.08)" : `0 4px 12px ${C.accent}44`,
      }}>{msg.text}</div>
    </div>
  );
}

/* ============ 早餐选择器 (多选 emoji, 不评判) ============ */
function BreakfastPicker({ onConfirm }) {
  const [picked, setPicked] = useState([]);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  const toggle = (emoji) => {
    setPicked((p) => p.includes(emoji) ? p.filter((x) => x !== emoji) : [...p, emoji]);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {breakfastCatalog.map((b) => {
          const on = picked.includes(b.emoji);
          return (
            <button key={b.emoji} onClick={() => toggle(b.emoji)} style={{
              background: on ? C.accentSoft : C.cardSoft,
              border: `1.5px solid ${on ? C.accent : C.border}`,
              borderRadius: 14, padding: "10px 6px", cursor: "pointer",
              textAlign: "center", transition: "all 0.15s",
              transform: on ? "scale(1.04)" : "scale(1)",
            }}>
              <div style={{ fontSize: 24, marginBottom: 3 }}>{b.emoji}</div>
              <div style={{ color: C.text, fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{b.name}</div>
            </button>
          );
        })}
      </div>

      {customMode ? (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="比如 '🍙 一个饭团'"
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${C.border}`,
              fontSize: 13, color: C.text, background: C.cardSoft,
            }}
          />
          <button onClick={() => {
            if (customText.trim()) {
              setPicked((p) => [...p, customText.trim()]);
              setCustomText("");
              setCustomMode(false);
            }
          }} style={{
            padding: "0 14px", border: "none", background: C.accent, color: "#fff",
            borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>加上</button>
        </div>
      ) : (
        <button onClick={() => setCustomMode(true)} style={{
          width: "100%", background: "transparent", border: `1.5px dashed ${C.border}`,
          borderRadius: 12, padding: "9px", cursor: "pointer", marginBottom: 12,
          color: C.textMuted, fontSize: 12, fontWeight: 500,
        }}>
          + 都不是?写一个
        </button>
      )}

      {picked.length > 0 && (
        <div style={{ background: C.greenSoft, borderRadius: 12, padding: "8px 12px", marginBottom: 10 }}>
          <p style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>
            今早: <span style={{ fontSize: 16 }}>{picked.join(" ")}</span>
          </p>
        </div>
      )}

      <button onClick={() => picked.length > 0 && onConfirm(picked)} disabled={picked.length === 0} style={{
        width: "100%", background: picked.length > 0 ? C.accent : C.cardSoft, color: picked.length > 0 ? "#fff" : C.textMuted,
        border: "none", borderRadius: 16, padding: "12px", fontSize: 14, fontWeight: 700,
        cursor: picked.length > 0 ? "pointer" : "default",
        boxShadow: picked.length > 0 ? `0 4px 12px ${C.accent}44` : "none",
      }}>
        {picked.length > 0 ? `记下今早 (${picked.length})` : "选一个或几个"}
      </button>
    </div>
  );
}

/* ============ 主组件 ============ */
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedType, setSelectedType] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [targetTime, setTargetTime] = useState("23:00"); // 今晚入睡目标 (可被软着陆延后)
  const [chatStartedAt, setChatStartedAt] = useState(null); // 对话开始时间 - 用于透明显示耗时
  const [chatElapsed, setChatElapsed] = useState(0); // 已对话分钟数
  // 早餐图鉴 state - 已收集的早餐 (key: emoji, value: 收集次数)
  const [collectedBreakfasts, setCollectedBreakfasts] = useState({
    "🥐": 3, "🥚": 5, "🥣": 2, "☕": 8, "🥛": 4, "🥟": 1,
  });
  const [todayBreakfast, setTodayBreakfast] = useState(null); // 今早选的早餐(数组)
  const [nestTab, setNestTab] = useState("animals"); // animals | breakfasts
  const chatStateRef = useRef({ slots: {}, usedFallbacks: [], turnCount: 0, closeTriggered: false, closeAttempted: false, planGiven: false, askedWakeUp: 0, planFollowUpIdx: 0 });
  const chatRef = useRef(null);
  const [currentTime, setCurrentTime] = useState("23:17");

  useEffect(() => {
    const now = new Date();
    setCurrentTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, showQuickReplies, isTyping, showTypeSelect]);

  const startChat = () => {
    setPage("chat"); setMessages([]); setSelectedType(null);
    setFlowIndex(0); setShowQuickReplies(null); setShowTypeSelect(false);
    setInputValue("");
    setChatStartedAt(Date.now()); // 记录对话起始时间
    setChatElapsed(0);
    chatStateRef.current = { slots: {}, usedFallbacks: [], turnCount: 0, closeTriggered: false, closeAttempted: false, planGiven: false, askedWakeUp: 0, planFollowUpIdx: 0 };
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{ role: "ai", text: "嘿，已经这个点啦——\n今晚怎么还没睡呀？跟我说说 👇" }]);
      setShowTypeSelect(true);
    }, 1100);
  };

  // 每 30 秒更新耗时显示 (only when in chat)
  useEffect(() => {
    if (page !== "chat" || !chatStartedAt) return;
    const update = () => setChatElapsed(Math.floor((Date.now() - chatStartedAt) / 60000));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [page, chatStartedAt]);

  const selectType = (type) => {
    setSelectedType(type);
    setShowTypeSelect(false);
    const userMsg = { role: "user", text: `${typeConfig[type].emoji} ${typeConfig[type].sublabel}` };
    const base = [...messages, userMsg];
    setMessages(base);
    playFrom(type, 0, base);
  };

  const playFrom = (type, idx, current) => {
    const flow = chatFlows[type];
    if (idx >= flow.length) return;
    const msg = flow[idx];
    if (msg.role === "ai") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const next = [...current, { role: "ai", text: msg.text }];
        setMessages(next);
        if (msg.quickReplies) {
          setShowQuickReplies(msg.quickReplies);
          setFlowIndex(idx);
        } else {
          playFrom(type, idx + 1, next);
        }
      }, 900 + Math.random() * 600);
    } else {
      const next = [...current, { role: "user", text: msg.text }];
      setMessages(next);
      setTimeout(() => playFrom(type, idx + 1, next), 700);
    }
  };

  // ====== 公共: 跑一轮对话 (优先 LLM, 失败 fallback 关键词) ======
  const runOneTurn = async (text) => {
    setShowQuickReplies(null);
    setShowTypeSelect(false);

    // === 危机检测: 命中立刻跳出对话, 给真人援助 ===
    if (detectCrisis(text)) {
      const userMsg = { role: "user", text };
      setMessages((p) => [...p, userMsg]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setPage("crisis"); // 进入危机响应页
      }, 800);
      return;
    }

    const userMsg = { role: "user", text };
    const baseMsgs = messages;
    const nextMsgs = [...baseMsgs, userMsg];
    setMessages(nextMsgs);

    const state = { ...chatStateRef.current };
    state.turnCount = (state.turnCount || 0) + 1;

    setIsTyping(true);

    // 异步调 LLM (失败静默 fallback)
    let llmReply = null;
    try {
      llmReply = await callLLM(selectedType, baseMsgs, text);
    } catch (e) {}

    // 即使用 LLM, 仍要做槽位提取以更新前端结构化状态 (用于收尾判断等)
    const slotResult = generateReply(selectedType, text, state);

    setIsTyping(false);

    const reply = llmReply || slotResult.reply;
    const newState = {
      ...state,
      slots: slotResult.slots || state.slots,
      usedFallbacks: slotResult.usedFallbacks !== undefined ? slotResult.usedFallbacks : state.usedFallbacks,
      askedWakeUp: slotResult.askedWakeUp !== undefined ? slotResult.askedWakeUp : state.askedWakeUp,
      planGiven: slotResult.planGiven !== undefined ? slotResult.planGiven : state.planGiven,
      planFollowUpIdx: slotResult.planFollowUpIdx !== undefined ? slotResult.planFollowUpIdx : state.planFollowUpIdx,
      closeAttempted: slotResult.closeAttempted !== undefined ? slotResult.closeAttempted : state.closeAttempted,
      closeTriggered: slotResult.closeTriggered === false ? false : state.closeTriggered,
    };
    chatStateRef.current = newState;

    setMessages([...nextMsgs, { role: "ai", text: reply }]);

    // 收尾判断: 没在收尾中 + 没尝试过收尾 + (给完计划 或 聊够 5 轮)
    const shouldClose =
      !newState.closeTriggered && !newState.closeAttempted &&
      (newState.planGiven || newState.turnCount >= 5);

    if (shouldClose) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const closingMsg = newState.planGiven
            ? "好啦，今晚的计划定好了 ✨\n\n要不要先做几次呼吸，把身体切到「夜间状态」？然后就放心去做你想做的事。"
            : "我们聊了一会儿了 💛 你的状态我大概懂了。\n\n准备好让今晚画个温柔的句号了吗？";
          setMessages((p) => [...p, { role: "ai", text: closingMsg }]);
          setTimeout(() => {
            chatStateRef.current = { ...chatStateRef.current, closeTriggered: true };
            setShowQuickReplies(["准备好了 😌", "再让我刷一会儿…"]);
          }, 600);
        }, 1000);
      }, 1200);
    }
  };

  const handleQuickReply = (reply) => {
    setShowQuickReplies(null);

    // 1. 进入呼吸引导
    if (["准备好了 😌", "开始呼吸 🌙", "手机放下了 ✓", "看完了，挺充实的", "好，开始呼吸 🌙"].includes(reply)) {
      setMessages((p) => [...p, { role: "user", text: reply }]);
      setIsTyping(true);
      setTimeout(() => { setIsTyping(false); setPage("breathing"); }, 900);
      return;
    }

    // 2. "再让我刷一会儿..." → 弹出时间选项
    if (reply === "再让我刷一会儿…") {
      const next = [...messages, { role: "user", text: reply }];
      setMessages(next);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([...next, {
          role: "ai",
          text: `好，我尊重你的选择 😌 \n\n那我们把今晚的入睡目标往后调一点——你想推到几点？\n\n（现在目标是 ${targetTime}）`,
        }]);
        setTimeout(() => setShowQuickReplies(["晚 30 分钟", "晚 1 小时", "再晚 1.5 小时"]), 600);
      }, 1000);
      return;
    }

    // 3. 时间选项 → 真的更新首页 targetTime + 继续对话
    if (["晚 30 分钟", "晚 1 小时", "再晚 1.5 小时"].includes(reply)) {
      const minutesMap = { "晚 30 分钟": 30, "晚 1 小时": 60, "再晚 1.5 小时": 90 };
      const mins = minutesMap[reply];
      const [h, m] = targetTime.split(":").map(Number);
      let totalMins = h * 60 + m + mins;
      if (totalMins >= 24 * 60) totalMins -= 24 * 60;
      const newH = Math.floor(totalMins / 60);
      const newM = totalMins % 60;
      const newTarget = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
      setTargetTime(newTarget);

      const next = [...messages, { role: "user", text: reply }];
      setMessages(next);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([...next, {
          role: "ai",
          text: `好，今晚的入睡目标更新为 ${newTarget} 啦 💛 \n\n首页的目标也同步更新了。我们继续聊，你准备好的时候随时告诉我。`,
        }]);
        // 重置收尾标记, 让对话可以继续 (在更宽的时间窗里)
        chatStateRef.current = { ...chatStateRef.current, closeAttempted: false, closeTriggered: false };
      }, 1000);
      return;
    }

    // 4. 其他 softLandingReplies (还是睡不着 / 还想再看 / 放不下 / 直接睡吧)
    if (softLandingReplies[reply]) {
      const next = [...messages, { role: "user", text: reply }];
      setMessages(next);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const withReply = [...next, { role: "ai", text: softLandingReplies[reply] }];
        setMessages(withReply);
        setTimeout(() => setShowQuickReplies(["好，那我试试 😌", "谢谢你陪我"]), 600);
      }, 1000);
      return;
    }

    // 5. 软着陆后续: 走呼吸
    if (reply === "好，那我试试 😌" || reply === "谢谢你陪我") {
      const next = [...messages, { role: "user", text: reply }];
      setMessages(next);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([...next, { role: "ai", text: "💛 这就很好了。\n\n来，我们一起做几次呼吸，慢慢放松下来。" }]);
        setTimeout(() => setShowQuickReplies(["开始呼吸 🌙"]), 600);
      }, 1000);
      return;
    }

    // 6. 脚本耗尽 → 走自由对话 (LLM)
    const flow = chatFlows[selectedType] || [];
    if (flowIndex + 1 >= flow.length) {
      runOneTurn(reply);
      return;
    }

    // 7. 仍有脚本, 走预设流程
    const userMsg = { role: "user", text: reply };
    const next = [...messages, userMsg];
    setMessages(next);
    playFrom(selectedType, flowIndex + 1, next);
  };

  // ====== 自由对话: 智能回复 (槽位跟踪 + 短词承接 + 去重 fallback) ======
  const handleFreeChat = () => {
    const text = inputValue.trim();
    if (!text || !selectedType) return;
    setInputValue("");
    runOneTurn(text);
  };

  const answerQuiz = (type) => {
    const newAnswers = [...quizAnswers, type];
    setQuizAnswers(newAnswers);
    if (quizStep < quizQuestions.length - 1) setQuizStep(quizStep + 1);
    else setQuizStep(quizQuestions.length);
  };

  const quizResult = () => {
    const counts = {};
    quizAnswers.forEach((t) => counts[t] = (counts[t] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "mixed";
  };

  const scrollableMain = {
    flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0,
  };

  const showBottomNav = ["home", "collection", "dashboard"].includes(page);

  const tab = (active, label, target) => (
    <button onClick={() => setPage(target)} style={{
      flex: 1, padding: "12px 0 14px", textAlign: "center", fontSize: 12.5,
      color: active ? C.accentDeep : C.textDim, cursor: "pointer",
      background: "transparent", border: "none", fontWeight: active ? 700 : 500,
      position: "relative",
    }}>
      {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: C.accent, borderRadius: 3 }} />}
      {label}
    </button>
  );

  /* ============ 测评结果方案卡片 (子组件) ============ */
  const SolutionView = ({ type }) => {
    const sol = personaSolutions[type];
    const cfg = typeConfig[type];

    const Section = ({ title, icon, children, bg, border }) => (
      <div style={{
        background: bg || C.card, borderRadius: 18, padding: "16px 18px",
        border: `1px solid ${border || C.border}`, marginBottom: 12,
      }}>
        <p style={{ color: cfg.color, fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{icon}</span> <span>{title}</span>
        </p>
        {children}
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left", width: "100%" }}>
        {/* Hero - 人格头像 + 洞察 */}
        <div style={{
          background: `linear-gradient(135deg, ${cfg.soft}, ${C.card})`,
          borderRadius: 22, padding: "22px 20px", border: `1px solid ${C.border}`,
          marginBottom: 14, textAlign: "center",
        }}>
          <div style={{ fontSize: 64, marginBottom: 8, animation: "floaty 3s ease-in-out infinite" }}>{cfg.emoji}</div>
          <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>你的主导熬夜人格是</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: cfg.color, fontFamily: "'Baloo 2', cursive", marginBottom: 10 }}>{cfg.label}</p>
          <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, fontWeight: 600 }}>{sol.insight}</p>
        </div>

        {/* 为什么会这样 */}
        <Section title="为什么会这样" icon="🔍">
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.85 }}>{sol.why}</p>
        </Section>

        {/* 核心方法 */}
        <Section title="给你的核心方法" icon="💡" bg={`linear-gradient(135deg, ${cfg.soft}, ${C.accentSoft})`}>
          <p style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{sol.coreMethod.name}</p>
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{sol.coreMethod.desc}</p>
        </Section>

        {/* 今晚就可以做 */}
        <Section title="今晚就可以试" icon="🌙">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {sol.tonight.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item.t}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 长期建议 */}
        <Section title="慢慢来 — 长期建议" icon="🌱" bg={C.greenSoft} border={C.green + "55"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {sol.longTerm.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item.t}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 避免事项 */}
        <Section title="尽量避免" icon="⚠️" bg={C.warnSoft} border={C.warn + "55"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sol.avoid.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: C.warn, fontSize: 13, flexShrink: 0 }}>•</span>
                <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 研究依据 */}
        <div style={{
          background: C.cardSoft, borderRadius: 14, padding: "12px 14px",
          marginBottom: 14, borderLeft: `3px solid ${cfg.color}`,
        }}>
          <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5 }}>📚 研究依据</p>
          <p style={{ color: C.text, fontSize: 12, lineHeight: 1.7 }}>{sol.evidence}</p>
        </div>

        {/* 温柔提示 */}
        <div style={{ background: C.accentSoft, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>
            🌗 觉得不太准？没关系，你随时可以自己选择今晚的状态——你最懂你自己。
          </p>
        </div>
      </div>
    );
  };

  /* ============ Render ============ */
  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto",
      height: "100vh", minHeight: 600,
      background: `linear-gradient(180deg, ${C.bgGradTop} 0%, ${C.bg} 35%)`,
      color: C.text, display: "flex", flexDirection: "column",
      fontFamily: "'Noto Sans SC', sans-serif", position: "relative", overflow: "hidden",
      borderRadius: 24, border: `1px solid ${C.border}`,
      boxShadow: "0 20px 60px rgba(200,160,120,0.18)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Baloo+2:wght@500;600;700&display=swap');
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px);} to {opacity:1; transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:.35;} 50%{opacity:1;} }
        @keyframes floaty { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes twinkle { 0%,100%{opacity:.3;} 50%{opacity:1;} }
        @keyframes shimmer { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:0; height:0; }
        input:focus { outline: none; }
      `}</style>

      {/* ===== 危机响应页 (用户表达自伤/自杀/绝望意念时触发) ===== */}
      {page === "crisis" && (
        <div style={scrollableMain}>
          <div style={{ padding: "16px 20px" }}>
            <button onClick={() => setPage("home")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← 返回首页</button>
          </div>
          <div style={{ padding: "10px 28px 30px", textAlign: "left" }}>
            <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>💛</div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 12, textAlign: "center", fontFamily: "'Baloo 2', cursive" }}>
              我听到你说的话了
            </h2>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.85, marginBottom: 16 }}>
              你说的这些不是小事。
              <br />
              我能陪你聊「今晚为什么没睡」这件事，但你现在感受到的，比这要深得多——这种时候你需要真人，那才能真的接住你。
            </p>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>
              下面这些电话 24 小时都有人在等你：
            </p>

            <div style={{ background: C.card, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📞 24h 心理援助热线</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>北京心理危机研究与干预中心</p>
                  <p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>010-82951332</p>
                </div>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>全国心理援助热线</p>
                  <p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>400-161-9995</p>
                </div>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>希望 24 热线</p>
                  <p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>400-161-9995</p>
                </div>
              </div>
            </div>

            <div style={{ background: C.greenSoft, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>
                🌿 你不需要"问题严重到一定程度"才能打——任何让你难以承受的感受都值得被听到。
              </p>
            </div>

            <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 20, textAlign: "center" }}>
              如果你身边有信任的家人或朋友，也可以现在告诉 TA。<br />你不必一个人扛。
            </p>

            <button onClick={() => setPage("home")} style={{
              width: "100%", background: C.accent, color: "#fff", border: "none",
              borderRadius: 22, padding: "13px", fontSize: 14, fontWeight: 600,
              cursor: "pointer", boxShadow: `0 6px 18px ${C.accent}55`,
            }}>
              好，我先回去 💛
            </button>
          </div>
        </div>
      )}

      {/* ===== 呼吸页 ===== */}
      {page === "breathing" && (
        <div style={scrollableMain}>
          <div style={{ padding: "16px 20px", position: "sticky", top: 0, background: C.bg, zIndex: 5 }}>
            <button onClick={() => setPage("home")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← 返回</button>
          </div>
          <div style={{ minHeight: "calc(100% - 50px)" }}>
            <BreathingExercise onDone={() => setPage("home")} />
          </div>
        </div>
      )}

      {/* ===== 首页 ===== */}
      {page === "home" && (
        <div style={scrollableMain}>
          <div style={{ position: "absolute", top: 30, right: 40, fontSize: 14, animation: "twinkle 3s infinite", pointerEvents: "none" }}>✨</div>
          <div style={{ position: "absolute", top: 90, left: 30, fontSize: 11, animation: "twinkle 2.4s infinite 0.5s", pointerEvents: "none" }}>⭐</div>

          <div style={{ padding: "38px 28px 16px", textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>现在是</p>
            <p style={{ fontSize: 58, fontWeight: 600, color: C.text, letterSpacing: -1, fontFamily: "'Baloo 2', cursive" }}>{currentTime}</p>
          </div>

          <div style={{ padding: "0 28px", textAlign: "center", marginBottom: 26 }}>
            <div style={{ display: "inline-block", background: C.card, borderRadius: 20, padding: "7px 18px", border: `1px solid ${C.border}` }}>
              <span style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>🎯 今晚目标 {targetTime} 入睡</span>
            </div>
          </div>

          <div style={{ padding: "0 28px", marginBottom: 16 }}>
            <button onClick={startChat} style={{
              width: "100%", padding: "17px", borderRadius: 20,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              border: "none", color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Baloo 2', cursive", letterSpacing: 0.5,
              boxShadow: `0 10px 28px ${C.accent}55`,
            }}>
              开始今晚的入睡 🌙
            </button>
            <p style={{ textAlign: "center", color: C.textMuted, fontSize: 12, marginTop: 11, lineHeight: 1.6 }}>
              我会先听你说说今晚的状态<br />再陪你用最适合你的方式入睡
            </p>
          </div>

          {/* 明早早点入口 - 24h 双端闭环 */}
          <div style={{ padding: "0 28px 16px" }}>
            <button onClick={() => setPage("morning")} style={{
              width: "100%", padding: "13px 16px", borderRadius: 18,
              background: `linear-gradient(135deg, ${C.coral || "#ffd4b8"}, ${C.pinkSoft})`,
              border: `1px solid ${C.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            }}>
              <span style={{ fontSize: 28 }}>☀️</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontSize: 13.5, fontWeight: 700 }}>明早早点 · 看看昨晚 + 记录今早</p>
                <p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>早起就能吃上一份早餐 🥐 (demo: 点开模拟早晨场景)</p>
              </div>
              <span style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700 }}>›</span>
            </button>
          </div>

          <div style={{ padding: "0 28px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 11 }}>
              <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: `1px solid ${C.border}` }}>
                <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>昨晚入睡</p>
                <p style={{ fontSize: 23, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>23:42</p>
                <p style={{ color: C.green, fontSize: 11, marginTop: 3, fontWeight: 600 }}>↑ 比上周早18分钟</p>
              </div>
              <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: `1px solid ${C.border}` }}>
                <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>连续达标</p>
                <p style={{ fontSize: 23, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>3 <span style={{ fontSize: 13 }}>天</span></p>
                <p style={{ color: C.accent, fontSize: 11, marginTop: 3, fontWeight: 600 }}>🔥 继续保持</p>
              </div>
            </div>

            <button onClick={() => { setPage("quiz"); setQuizStep(0); setQuizAnswers([]); }} style={{
              width: "100%", background: `linear-gradient(135deg, ${C.pinkSoft}, ${C.accentSoft})`,
              borderRadius: 18, padding: "15px 16px", border: `1px solid ${C.border}`,
              cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, marginBottom: 11,
            }}>
              <span style={{ fontSize: 26 }}>🔮</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>测测你的熬夜人格</p>
                <p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>3 题测出主导人格 + 专属干预方案</p>
              </div>
              <span style={{ color: C.textDim, fontSize: 18 }}>›</span>
            </button>

            <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: `1px solid ${C.border}` }}>
              <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 9 }}>最近的熬夜小动物</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["revenge", "anxiety", "revenge", "inertia", "work"].map((t, i) => (
                  <div key={i} style={{ width: 38, height: 38, borderRadius: 12, background: typeConfig[t].soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>
                    {typeConfig[t].emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* 温柔的边界说明 - 不是法律免责, 是朋友的诚实 */}
            <div style={{ marginTop: 16, padding: "13px 16px", background: C.greenSoft, borderRadius: 14 }}>
              <p style={{ color: C.text, fontSize: 12, lineHeight: 1.85 }}>
                🌿 我能陪你的，是「今晚为什么没睡」这件小事。
                <br />
                长期睡不着、心里一直很难受、有伤害自己的念头——那些更深的事我帮不了你。
                <br />
                那时候你需要的是真人，不是 AI 💛
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 晨间页 (☀️ 明早早点 - 早起吃早餐 + 收集图鉴) ===== */}
      {page === "morning" && (
        <div style={scrollableMain}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setPage("home")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>明早早点 ☀️</span>
          </div>

          {/* 温柔问候 */}
          <div style={{ padding: "10px 28px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 38, marginBottom: 6 }}>☀️</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive", marginBottom: 4 }}>早上好</p>
            <p style={{ color: C.textMuted, fontSize: 12.5 }}>现在是 07:23 · 你比昨天早醒 18 分钟 💛</p>
          </div>

          <div style={{ padding: "0 24px 30px" }}>
            {/* 昨晚睡眠回顾 */}
            <div style={{ background: `linear-gradient(135deg, ${C.accentSoft}, ${C.pinkSoft})`, borderRadius: 20, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>昨晚的睡眠</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div>
                  <p style={{ color: C.text, fontSize: 24, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>23:42 入睡</p>
                  <p style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>睡了 7 小时 41 分</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: C.accentDeep, fontSize: 12.5, fontWeight: 600 }}>比上周早 28 分钟</p>
                  <p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>目标 23:00 · 晚 42 分</p>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 14px", marginTop: 10 }}>
                <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>
                  💛 比目标晚了一点点没关系——比上周已经进步了。
                  <br />
                  <span style={{ color: C.accentDeep, fontWeight: 600 }}>🦊 一只新的小狐狸来你的小窝安家了。</span>
                </p>
              </div>
            </div>

            {/* 早餐记录 */}
            <div style={{ background: C.card, borderRadius: 20, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              {todayBreakfast === null || todayBreakfast.length === 0 ? (
                <>
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Baloo 2', cursive" }}>🥐 今早吃了什么呀?</p>
                  <p style={{ color: C.textMuted, fontSize: 11.5, marginBottom: 14, lineHeight: 1.6 }}>
                    选一个或几个 · 随意,没有对错
                  </p>
                  <BreakfastPicker
                    onConfirm={(picked) => {
                      setTodayBreakfast(picked);
                      // 加入图鉴
                      setCollectedBreakfasts((prev) => {
                        const next = { ...prev };
                        picked.forEach((p) => { next[p] = (next[p] || 0) + 1; });
                        return next;
                      });
                    }}
                  />
                </>
              ) : (
                <>
                  <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>今早的早餐</p>
                  <p style={{ fontSize: 32, marginBottom: 6 }}>{todayBreakfast.join(" ")}</p>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    记下啦 ✨ 已加进你的早餐图鉴
                  </p>
                  <button onClick={() => { setNestTab("breakfasts"); setPage("collection"); }} style={{
                    width: "100%", background: C.accent, color: "#fff", border: "none",
                    borderRadius: 16, padding: "11px", fontSize: 13.5, fontWeight: 600,
                    cursor: "pointer", boxShadow: `0 4px 12px ${C.accent}44`,
                  }}>
                    查看完整图鉴 →
                  </button>
                </>
              )}
            </div>

            {/* 因果链文案 */}
            <div style={{ padding: "12px 16px", background: C.greenSoft, borderRadius: 14, marginBottom: 16 }}>
              <p style={{ color: C.text, fontSize: 11.5, lineHeight: 1.85, textAlign: "center" }}>
                🌿 早睡 → 早起 → 吃上一份早餐
                <br />
                <span style={{ color: C.textMuted }}>这就是为什么昨晚那一觉值得 💛</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 测评页 ===== */}
      {page === "quiz" && (
        <div style={scrollableMain}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: C.bgGradTop, zIndex: 5 }}>
            <button onClick={() => setPage("home")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>熬夜人格测评</span>
          </div>

          {quizStep < quizQuestions.length ? (
            <div style={{ padding: "10px 28px 28px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 30 }}>
                {quizQuestions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= quizStep ? C.accent : C.border }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>第 {quizStep + 1} / {quizQuestions.length} 题</p>
              <p style={{ fontSize: 20, color: C.text, fontWeight: 700, marginBottom: 28, lineHeight: 1.5, fontFamily: "'Baloo 2', cursive" }}>
                {quizQuestions[quizStep].q}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {quizQuestions[quizStep].opts.map((opt, i) => (
                  <button key={i} onClick={() => answerQuiz(opt.type)} style={{
                    background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16,
                    padding: "16px 18px", cursor: "pointer", textAlign: "left",
                    color: C.text, fontSize: 14, lineHeight: 1.5, transition: "all 0.15s",
                  }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentSoft; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                  >{opt.t}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "10px 22px 28px" }}>
              <SolutionView type={quizResult()} />
              <button onClick={() => setPage("home")} style={{
                width: "100%", background: C.accent, color: "#fff", border: "none",
                borderRadius: 22, padding: "14px 40px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 6px 18px ${C.accent}55`,
                fontFamily: "'Baloo 2', cursive",
              }}>
                好的，记住啦 💛
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== 对话页 ===== */}
      {page === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ padding: "13px 18px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
            <button onClick={() => setPage("home")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", marginRight: 10 }}>←</button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginRight: 10 }}>🌙</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>今晚早点</p>
              <p style={{ fontSize: 11, color: C.accent }}>
                {selectedType ? `${typeConfig[selectedType].emoji} 陪你的${typeConfig[selectedType].label}夜晚` : "正在陪你入睡…"}
              </p>
            </div>
            {/* 透明显示对话耗时 - 应对屏幕时间悖论 */}
            {chatStartedAt && chatElapsed > 0 && (
              <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 10, background: chatElapsed >= 15 ? C.pinkSoft : "transparent" }}>
                <p style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.2 }}>已对话</p>
                <p style={{ fontSize: 12, color: chatElapsed >= 15 ? C.accentDeep : C.text, fontWeight: 700, lineHeight: 1.2 }}>
                  {chatElapsed} 分钟
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "18px 16px", minHeight: 0 }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} isLast={i === messages.length - 1} />)}

            {isTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14, alignItems: "flex-end", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌙</div>
                <div style={{ padding: "13px 18px", borderRadius: "4px 18px 18px 18px", background: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.textMuted, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}

            {showTypeSelect && (
              <div style={{ animation: "fadeSlideUp 0.4s ease", marginTop: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(typeConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => selectType(key)} style={{
                      display: "flex", alignItems: "center", gap: 12, background: C.card,
                      border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "11px 14px",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.background = cfg.soft; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{cfg.emoji}</div>
                      <div>
                        <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{cfg.sublabel}</p>
                        <p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{cfg.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showQuickReplies && (
              <div style={{ animation: "fadeSlideUp 0.4s ease", display: "flex", flexDirection: "column", gap: 8, marginTop: 10, alignItems: "flex-end" }}>
                {showQuickReplies.map((reply, i) => (
                  <button key={i} onClick={() => handleQuickReply(reply)} style={{
                    background: C.card, border: `1.5px solid ${C.accent}55`, borderRadius: 20,
                    padding: "10px 18px", color: C.accentDeep, fontSize: 13.5, cursor: "pointer",
                    fontWeight: 500, transition: "all 0.15s", maxWidth: "85%", textAlign: "right",
                  }}
                    onMouseOver={(e) => e.currentTarget.style.background = C.accentSoft}
                    onMouseOut={(e) => e.currentTarget.style.background = C.card}
                  >{reply}</button>
                ))}
              </div>
            )}
          </div>

          {/* 自由输入框 (选了类型后才显示) */}
          {selectedType && !showTypeSelect && (
            <div style={{
              borderTop: `1px solid ${C.border}`, background: C.card,
              padding: "10px 14px", flexShrink: 0,
              display: "flex", gap: 8, alignItems: "center",
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleFreeChat(); }}
                placeholder="想说什么都可以，我在听…"
                style={{
                  flex: 1, background: C.cardSoft, border: `1px solid ${C.border}`,
                  borderRadius: 22, padding: "11px 16px", fontSize: 13.5,
                  color: C.text, fontFamily: "'Noto Sans SC', sans-serif",
                }}
              />
              <button onClick={handleFreeChat} disabled={!inputValue.trim()} style={{
                background: inputValue.trim() ? `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})` : C.border,
                border: "none", borderRadius: "50%", width: 38, height: 38,
                cursor: inputValue.trim() ? "pointer" : "default",
                color: "#fff", fontSize: 16, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>↑</button>
            </div>
          )}
        </div>
      )}

      {/* ===== 小窝 (收集) 页 ===== */}
      {page === "collection" && (
        <div style={scrollableMain}>
          <div style={{ padding: "20px 24px 8px" }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>我的小窝 🏠</h2>
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>
              {nestTab === "animals" ? "每次好好睡觉，就有小动物来安家" : "每次早起吃上的早餐，都记一笔"}
            </p>
          </div>

          {/* Tab 切换 */}
          <div style={{ padding: "8px 24px 0", display: "flex", gap: 8 }}>
            <button onClick={() => setNestTab("animals")} style={{
              flex: 1, padding: "10px", borderRadius: 14,
              background: nestTab === "animals" ? C.accent : C.cardSoft,
              color: nestTab === "animals" ? "#fff" : C.text,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}>🦊 入睡小动物</button>
            <button onClick={() => setNestTab("breakfasts")} style={{
              flex: 1, padding: "10px", borderRadius: 14,
              background: nestTab === "breakfasts" ? C.accent : C.cardSoft,
              color: nestTab === "breakfasts" ? "#fff" : C.text,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}>🥐 早餐图鉴</button>
          </div>

          {/* ===== Tab: 入睡小动物 ===== */}
          {nestTab === "animals" && (
          <div style={{ padding: "12px 24px 28px" }}>
            {/* 总进度卡 */}
            <div style={{ background: `linear-gradient(135deg, ${C.accentSoft}, ${C.pinkSoft})`, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>已收集 5 / 6 只</span>
                <span style={{ color: C.accentDeep, fontSize: 11.5, fontWeight: 600 }}>再连续 4 天解锁星空小窝 🌌</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "#fff", overflow: "hidden" }}>
                <div style={{ width: "83%", height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.pink})`, borderRadius: 4 }} />
              </div>
            </div>

            {/* 今晚奖励 - 小鱼干可变奖励 */}
            <div style={{
              background: C.card, borderRadius: 20, padding: "16px 18px",
              border: `1px solid ${C.border}`, marginBottom: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>🐟 今晚的小鱼干</p>
                <p style={{ color: C.textMuted, fontSize: 11 }}>用来喂养小动物</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {todayTreats.map((t, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 12,
                    background: t.earned ? C.accentSoft : C.cardSoft,
                    border: `1px dashed ${t.earned ? C.accent + "55" : C.border}`,
                  }}>
                    <span style={{ fontSize: 22, opacity: t.earned ? 1 : 0.4 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.label}</p>
                      <p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{t.desc}</p>
                    </div>
                    {t.earned ? (
                      <span style={{ color: C.accent, fontSize: 18 }}>✓</span>
                    ) : (
                      <span style={{ color: C.textDim, fontSize: 12 }}>待领取</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: C.pinkSoft, borderRadius: 12 }}>
                <p style={{ color: C.text, fontSize: 11.5, lineHeight: 1.75 }}>
                  🌿 这些小动物不是用来打卡的——它们只在你真的好好睡了一晚之后，才悄悄来到你的小窝。
                  <br />
                  <span style={{ color: C.textMuted }}>每一只都是一个被你温柔对待的夜晚。</span>
                </p>
              </div>
            </div>

            {/* 小动物网格 */}
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>我的小动物 · 喂养它们会升级 ↓</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {collectedAnimals.map((a, i) => (
                <div key={i} style={{
                  background: a.locked ? C.cardSoft : C.card, borderRadius: 18, padding: "18px 14px",
                  border: `1px solid ${a.rare && !a.locked ? C.accent + "66" : C.border}`,
                  textAlign: "center", position: "relative", opacity: a.locked ? 0.55 : 1,
                }}>
                  {a.rare && !a.locked && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11 }}>✨</div>}
                  {!a.locked && a.level >= 2 && (
                    <div style={{ position: "absolute", top: 6, left: 8, fontSize: 10, background: C.accent, color: "#fff", borderRadius: 8, padding: "1px 6px", fontWeight: 700 }}>
                      Lv.{a.level}
                    </div>
                  )}
                  <div style={{ fontSize: 40, marginBottom: 8, filter: a.locked ? "grayscale(1)" : "none", position: "relative" }}>
                    {a.locked ? "❓" : a.emoji}
                    {a.accessory && !a.locked && (
                      <span style={{ position: "absolute", top: -4, right: "30%", fontSize: 16 }}>{a.accessory}</span>
                    )}
                  </div>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{a.locked ? "未解锁" : a.name}</p>
                  <p style={{ color: C.textMuted, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{a.desc}</p>
                  {!a.locked && a.count > 0 && <div style={{ display: "inline-block", marginTop: 8, background: a.rare ? C.accentSoft : C.cardSoft, borderRadius: 10, padding: "2px 10px", fontSize: 11, color: C.accentDeep, fontWeight: 600 }}>×{a.count}</div>}
                </div>
              ))}
            </div>

            {/* 温柔 streak 说明 */}
            <div style={{ background: C.greenSoft, borderRadius: 16, padding: "14px 16px", marginTop: 18 }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🌿 关于偶尔的熬夜</p>
              <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>
                熬夜了不会清零 — 小动物只是去旅行了，明天还会回到你的小窝。<br />
                我们不追求完美，只陪你慢慢变好。这是经过研究验证的 — 自我关怀比自我批评更能帮你改变。
              </p>
            </div>
          </div>
          )}

          {/* ===== Tab: 早餐图鉴 ===== */}
          {nestTab === "breakfasts" && (
          <div style={{ padding: "12px 24px 28px" }}>
            {/* 总进度卡 */}
            {(() => {
              const total = breakfastCatalog.length;
              const collected = breakfastCatalog.filter((b) => collectedBreakfasts[b.emoji] > 0).length;
              const totalCount = Object.values(collectedBreakfasts).reduce((s, n) => s + n, 0);
              return (
                <div style={{ background: `linear-gradient(135deg, ${C.pinkSoft}, ${C.greenSoft})`, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>已收集 {collected} / {total} 种</span>
                    <span style={{ color: C.accentDeep, fontSize: 11.5, fontWeight: 600 }}>累计 {totalCount} 份早餐 ✨</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#fff", overflow: "hidden" }}>
                    <div style={{ width: `${(collected / total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.pink})`, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })()}

            {/* 图鉴网格 */}
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>常见早餐 ↓</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
              {breakfastCatalog.map((b, i) => {
                const count = collectedBreakfasts[b.emoji] || 0;
                const collected = count > 0;
                return (
                  <div key={i} style={{
                    background: collected ? C.card : C.cardSoft,
                    borderRadius: 14, padding: "12px 6px",
                    border: `1px solid ${C.border}`,
                    textAlign: "center", opacity: collected ? 1 : 0.45,
                    position: "relative",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 4, filter: collected ? "none" : "grayscale(1)" }}>
                      {collected ? b.emoji : "❓"}
                    </div>
                    <p style={{ color: C.text, fontSize: 10.5, fontWeight: collected ? 600 : 500 }}>
                      {collected ? b.name : "未收集"}
                    </p>
                    {collected && count > 0 && (
                      <div style={{ marginTop: 4, fontSize: 10, color: C.accentDeep, fontWeight: 700 }}>
                        ×{count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 限定早餐 - 商业模式预留 */}
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>限定 / 联名 ↓</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
              {limitedBreakfasts.map((b, i) => (
                <div key={i} style={{
                  background: C.cardSoft, borderRadius: 14, padding: "12px 6px",
                  border: `1px dashed ${C.border}`,
                  textAlign: "center", opacity: 0.55, position: "relative",
                }}>
                  <div style={{ fontSize: 26, marginBottom: 4, filter: "grayscale(0.5)" }}>{b.emoji}</div>
                  <p style={{ color: C.text, fontSize: 10.5, fontWeight: 600 }}>{b.name}</p>
                  <p style={{ color: C.textMuted, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{b.unlock}</p>
                </div>
              ))}
            </div>

            {/* 温柔说明 */}
            <div style={{ background: C.greenSoft, borderRadius: 16, padding: "14px 16px" }}>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🌿 关于早餐图鉴</p>
              <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>
                不论今早吃的是什么，都值得被记一笔 💛<br />
                这里不分对错——不分有没有营养——只是记录。每一份都是你那一早对自己温柔的方式。
              </p>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ===== 画像页 ===== */}
      {page === "dashboard" && (
        <div style={scrollableMain}>
          <div style={{ padding: "20px 24px 6px" }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>我的熬夜画像 📊</h2>
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>了解自己，是温柔改变的第一步</p>
          </div>

          <div style={{ padding: "14px 24px 28px" }}>
            <div style={{ background: `linear-gradient(135deg, ${C.accentSoft}, ${C.card})`, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>本周平均入睡时间</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>23:38</span>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>↑ 比上周早 22 分钟</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>睡眠效率 87% · 已达到健康区间 ✓</p>
            </div>

            <div style={{ background: C.card, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 14 }}>本周入睡时间</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[22, 25.5]} tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatTime(v)} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => [formatTime(v), "入睡"]} />
                  <Bar dataKey="time" radius={[8, 8, 0, 0]}>
                    {weeklyData.map((e, i) => <Cell key={i} fill={typeConfig[e.type]?.color || C.accent} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", marginTop: 6 }}>柱子颜色 = 当晚的熬夜小动物</p>
            </div>

            <div style={{ background: C.card, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>熬夜类型分布（近 30 天）</p>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={56} strokeWidth={0}>
                      {typeDistribution.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.88} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 120 }}>
                  {typeDistribution.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                      <span style={{ color: C.textMuted, fontSize: 12, flex: 1 }}>{item.name}</span>
                      <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: `linear-gradient(135deg, ${C.pinkSoft}, ${C.accentSoft})`, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}` }}>
              <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💡 AI 给你的观察</p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.85 }}>
                你的熬夜以「报复型」为主，多出现在工作日。周日晚上偶尔会转向「焦虑型」——可能和周一的压力有关。
              </p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.85, marginTop: 8 }}>
                好消息是: 这周你比上周平均早睡了 22 分钟 💛 「浓缩快乐」的方式对你最有效，继续保持就好，不用急。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 底部导航 ===== */}
      {showBottomNav && (
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.card, paddingBottom: 4, flexShrink: 0 }}>
          {tab(page === "home", "🌙 今晚", "home")}
          {tab(page === "collection", "🦊 小窝", "collection")}
          {tab(page === "dashboard", "📊 画像", "dashboard")}
        </div>
      )}
    </div>
  );
}
