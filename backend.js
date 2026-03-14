// ============================================
// 帕鲁答题游戏 - 后端服务
// 安全设计：所有敏感数据（题库、答案、管理员密码）都在后端
// ============================================

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'palu2024admin';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 前端静态文件

// ============================================
// 题库数据（从原HTML提取，现在安全地存储在后端）
// ============================================
let QUESTIONS = [
    {question: "游戏中的'幸运帕鲁'我们一般称之为", options: ["闪光帕鲁", "狂暴帕鲁头目"], correct: 0},
    {question: "不考虑词条的情况下，以下哪只帕鲁通常具有更大的食量", options: ["森猛犸", "紫霞鹿"], correct: 0},
    {question: "《幻兽帕鲁》的PC版开发商是哪家公司？", options: ["KRAFTON", "Pocketpair"], correct: 1},
    {question: "以下哪个是帕鲁世界观设定中的终极目标", options: ["高塔即为关键之钥", "活着才有希望"], correct: 0},
    {question: "幻兽帕鲁PC的核心玩法属于以下哪种品类", options: ["MMO", "SOC"], correct: 1},
    {question: "在帕鲁世界中，温泉的作用是什么", options: ["提升帕鲁好感度", "让疲惫的帕鲁休息，并回复SAN值"], correct: 1},
    {question: "当帕鲁在战斗中死亡时，需要放回终端后多久才能再度使用", options: ["8分钟", "10分钟"], correct: 1},
    {question: "道具中修理套装的作用是", options: ["修补损坏的建筑", "修复损坏的武器或道具"], correct: 1},
    {question: "道具中通缉犯讨伐证明的作用是", options: ["交给自卫队兑换赏金", "永久提升队伍帕鲁的能力值"], correct: 1},
    {question: "帕鲁球的颜色代表其等级，初始最基础的帕鲁球是什么颜色？", options: ["绿色", "蓝色"], correct: 1},
    {question: "帕鲁浓缩机的作用是什么？", options: ["制作帕鲁罐头", "强化帕鲁星级"], correct: 1},
    {question: "如果你想在地图上快速飞行，哪只帕鲁被称为版本中后期的'神'，移动速度最快？", options: ["迅雷鸟", "空涡龙"], correct: 1},
    {question: "'暗属性'的帕鲁在打工界有以下哪个主要优势？", options: ["搬运物品速度翻倍", "夜晚不休息，24小时打工"], correct: 1},
    {question: "幻兽帕鲁于哪年开启了抢先体验", options: ["2023年", "2024年"], correct: 1},
    {question: "帕鲁终端里的'浓缩机'如果想将一只帕鲁升到满星（4星），总共需要消耗多少只同类？", options: ["50只", "116只"], correct: 1},
    {question: "关于'帕鲁浓缩机'，如果你将已经满星（4星）的帕鲁作为祭品喂给另一只，会发生什么？", options: ["被喂食的帕鲁获得的经验值显著高于0星帕鲁", "被喂食的帕鲁会瞬间升到5星"], correct: 0},
    {question: "如果想要通过配种稳定获得具有'传说'词条的帕鲁，双亲中至少需要有一方是？", options: ["原生传说级帕鲁", "拥有'稀有'词条的闪光帕鲁"], correct: 0},
    {question: "'词条'中的'工匠精神'能提升50%的工作速度，它能加成牧场的产出速度吗？", options: ["能，所有工作都会变快", "不能，牧场产出速度受星级影响，不受工作速度加成"], correct: 1},
    {question: "帕鲁在据点工作后，SAN值（理智值）降低，以下哪种方法能有效恢复？", options: ["把他们放进背包", "让其泡温泉", "把它们关进终端"], correct: 1},
    {question: "以下具有双属性的帕鲁是：", options: ["棉悠悠", "疾旋鼬", "火绒狐"], correct: 1},
    {question: "以下哪种工作适应性，是前期神宠'碎岩龟'所具备的？", options: ["采矿", "浇水", "手工"], correct: 0},
    {question: "在野外捕捉帕鲁时，如果帕鲁陷入了'中毒'或'烧伤'状态，对其捕捉成功率有何影响？", options: ["会显著提升捕捉成功率", "没有任何影响，只看剩余血量", "会降低成功率，因为帕鲁变得狂躁"], correct: 0},
    {question: "当你骑乘飞行坐骑（如迅雷鸟）在空中飞行时，体力耗尽会发生什么？", options: ["强制进入降落状态直到着地", "帕鲁会直接消失回到球里", "直接从高空坠落并摔死"], correct: 0},
    {question: "如果你的据点经常被火属性帕鲁袭击，以下哪个决策是正确的？", options: ["使用木材建造地基和墙壁", "放置更多的水属性帕鲁进行防御", "放置更多的冰属性帕鲁进行防御"], correct: 1},
    {question: "以下哪种伤害类型对所有属性的帕鲁都能造成100%的基础伤害，不存在任何'被克制'带来的减伤？", options: ["龙属性", "暗属性", "无属性"], correct: 2},
    {question: "关于'伙伴技能'等级，唯一提升该技能（如坐骑速度、掉落加成）的方法是？", options: ["提升帕鲁等级", "提升与帕鲁的亲密度", "在帕鲁浓缩机中提升该帕鲁的星级"], correct: 2},
    {question: "以下哪只帕鲁不能帮助你跨水域远距离跑图", options: ["滑水蛇", "疾旋鼬", "空涡龙"], correct: 1},
    {question: "如果你在沙漠中感到'极热'，除了穿耐热服，以下哪种帕鲁在队伍中能起到降温作用？", options: ["水灵儿", "吹雪狐", "火绒狐"], correct: 1},
    {question: "游戏中被称为'性价比之王'的被动词条'社畜'，其真实效果是？", options: ["不需要睡觉并持续工作", "同时具有多项工作技能", "工作速度提升，但攻击力因此下降"], correct: 2},
    {question: "当帕鲁处于'极度饥饿'且'心情抑郁'时，它在据点内的行为表现最可能是？", options: ["瞬间消失并回到帕鲁球内", "在进食区无限循环'进食-放弃'动作", "自发寻找敌对帕鲁进行攻击"], correct: 1},
    {question: "在属性克制闭环中，为什么'火属性'帕鲁被公认为版本强势属性？", options: ["火属性帕鲁基础攻击面板高", "火属性技能带有烧伤效果，无视防御", "火属性是唯一一个同时克制两个属性的系别"], correct: 2},
    {question: "在后期制作'传奇帕鲁球'时，除了帕鲁矿碎块和帕鲁油，还需要消耗大量的'水泥'。制作水泥最核心的原材料循环是？", options: ["石头+骨头+帕鲁体液", "金属锭+碳纤维+电路板", "木材+纤维+毒液"], correct: 0},
    {question: "在进行'高阶配种'时，为什么很多玩家会故意保留'白板'帕鲁（无词条）作为亲本？", options: ["白板帕鲁孵化出的蛋更大", "白板帕鲁产生变异的概率更高", "稀释词条池，防止多余的杂质词条遗传给后代"], correct: 2},
    {question: "当你建造了'监控台'并设置帕鲁的工作模式为'残酷压榨'时，最显著的负面反馈是？", options: ["帕鲁会直接从据点名单中逃跑", "SAN值下降速度极快，导致帕鲁频繁骨折或抑郁", "帕鲁会自发攻击领地内的建筑"], correct: 1},
    {question: "为什么玩家在后期会大规模种植'生菜'和'西红柿'而不是最初的面包？", options: ["因为生菜可以直接卖更多金币", "为了制作'沙拉'，从而大幅提升帕鲁的工作效率", "因为高等级帕鲁不吃面包"], correct: 1},
    {question: "在战斗中，如果帕鲁由于死亡回到球内，它回复血量的前提是？", options: ["必须放入'帕鲁终端'的仓库中才能开始复活/回血", "给他喂食烤野莓", "只要在背包里，随时间推移缓慢回复"], correct: 0},
    {question: "'帕鲁球工厂II'在没有帕鲁参与的情况下，能否由发电机独立维持进行生产？", options: ["可以，电力是唯一动力源", "不可以，发电机只供电，仍需'手工'帕鲁进行生产操作", "不可以，流水线需要生火帕鲁提供热能驱动"], correct: 1},
    {question: "如果你想通过'肢解（切割）'帕鲁来获得最高收益，以下关于'掉落逻辑'的描述正确的是？", options: ["肢解获得的材料种类与捕捉/击杀时完全一致，相当于二次掉落", "肢解只会产出'帕鲁肉'，不再产出其他素材", "肢解后的帕鲁会变为灵魂形态，可以再次复活"], correct: 0},
    {question: "帕鲁的信赖度提升有什么好处", options: ["工作适应性提升", "抓取同种帕鲁机率提升", "能力值提升", "经验值获取增加"], correct: 1},
    {question: "火热帕鲁蛋中无法孵化出以下哪个帕鲁", options: ["火绒狐", "炎魔羊", "烽歌龙", "玉藻狐"], correct: 3},
    {question: "第一禁猎区中无法捕捉到以下哪个帕鲁", options: ["森猛犸", "暴电熊", "企丸王", "祗岳鹿"], correct: 2},
    {question: "帕鲁远征所中的目的地如何解锁", options: ["提升玩家等级", "提升帕鲁总战力", "击败高塔头目", "增加帕鲁数量"], correct: 2},
    {question: "以下帕鲁中拥有草属性的是", options: ["碧海龙", "海誓龙", "草莽猪", "米露菲"], correct: 2},
    {question: "跨界帕鲁终端的作用是以下哪种", options: ["多据点宠物互通", "帕鲁带到其他世界", "传送到其他世界", "共享多据点建筑功能"], correct: 1},
    {question: "关于'帕鲁球'，如果你用低级球捕捉高等级怪，系统提示概率为0%，这意味着？", options: ["绝对无法捕捉，球会直接弹开", "虽然显示是0%，但依旧拥有极低的概率进行捕捉", "丢的球会对帕鲁造成伤害", "我需要尝试下背后丢球"], correct: 1},
    {question: "'工作狂'这个词条在实际生产中它的作用是？", options: ["增加工作速度", "增加搬运上限", "减少工作时SAN值的下降速度", "减少饥饿速率"], correct: 2},
    {question: "关于'浓缩机'对'伙伴技能'的提升，以下哪项描述是错误的？", options: ["星级会显著提升帕鲁的基础血量、攻击和防御", "每升一星，伙伴技能的倍率都会增加", "4星帕鲁的采矿/手工等级会额外+1", "升星可以增加帕鲁的技能格位，让它带4个主动技能"], correct: 3},
    {question: "在据点中，'伐木场'和'采石场'的产出上限是？", options: ["无限", "999", "9999", "由帕鲁的搬运等级决定"], correct: 0},
    {question: "在攻击Boss时，如果屏幕上跳出的伤害数字是灰色的，代表？", options: ["Boss正在回血", "暴击了", "伤害被目标的属性抗性严重减免", "触发了弱点攻击"], correct: 2},
    {question: "帕鲁被动词条【贵族】的效果是？", options: ["改善交易价格", "降低SAN值下降速度", "提升属性潜能", "减轻无属性伤害"], correct: 0},
    {question: "以下哪个道具不需要消耗古代科技点？", options: ["帕鲁浓缩机", "腰挂提灯", "配种牧场", "简易开锁工具"], correct: 1},
    {question: "下述哪个区域是在火山区域的？", options: ["干燥沙滩", "灼热峡谷", "战火爪痕", "日暮沙地"], correct: 1},
    {question: "玩家最多可以随身携带多少只帕鲁？", options: ["3", "5", "6", "10"], correct: 1},
    {question: "新叶猿没有哪项工作技能", options: ["浇水", "采集", "手工作业", "采伐"], correct: 0},
    {question: "游戏中帕鲁球的种类", options: ["6", "7", "8", "9"], correct: 1},
    {question: "帕鲁工作适应性等级最高是多少级", options: ["4", "5", "6", "7"], correct: 0}
];

// 管理员会话令牌存储
const adminSessions = new Map();

// ============================================
// 工具函数
// ============================================

// 计算 SHA-256 哈希
async function sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// 生成随机会话令牌
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// 验证管理员令牌
function verifyAdminToken(token) {
    if (!token) return false;
    const session = adminSessions.get(token);
    if (!session) return false;
    // 检查是否过期（24小时）
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
        adminSessions.delete(token);
        return false;
    }
    return true;
}

// ============================================
// API 路由
// ============================================

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', questionsCount: QUESTIONS.length });
});

// 获取题目（不含答案）
app.get('/api/questions', (req, res) => {
    // 返回题目列表，但移除 correct 字段
    const safeQuestions = QUESTIONS.map((q, index) => ({
        id: index,
        question: q.question,
        options: q.options
    }));
    res.json({ questions: safeQuestions, total: safeQuestions.length });
});

// 验证答案
app.post('/api/answer', (req, res) => {
    const { questionId, answer } = req.body;
    
    if (typeof questionId !== 'number' || typeof answer !== 'number') {
        return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const question = QUESTIONS[questionId];
    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }
    
    const isCorrect = answer === question.correct;
    res.json({ 
        correct: isCorrect,
        correctAnswer: question.correct  // 告诉前端正确答案是什么
    });
});

// 批量获取答案（用于游戏结算时显示正确答案）
app.post('/api/answers', (req, res) => {
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds)) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const answers = questionIds.map(id => ({
        id: id,
        correct: QUESTIONS[id]?.correct
    })).filter(a => a.correct !== undefined);
    
    res.json({ answers });
});

// ============================================
// 管理员 API
// ============================================

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    
    // 验证密码（使用 SHA-256 比较）
    const inputHash = await sha256(password);
    const adminHash = await sha256(ADMIN_PASSWORD);
    
    if (inputHash !== adminHash) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    
    // 生成会话令牌
    const token = generateSessionToken();
    adminSessions.set(token, { createdAt: Date.now() });
    
    res.json({ 
        success: true, 
        token,
        message: 'Login successful'
    });
});

// 验证管理员令牌
app.get('/api/admin/verify', (req, res) => {
    const token = req.headers['admin-token'];
    const isValid = verifyAdminToken(token);
    res.json({ valid: isValid });
});

// 获取完整题库（含答案，仅管理员）
app.get('/api/admin/questions', (req, res) => {
    const token = req.headers['admin-token'];
    
    if (!verifyAdminToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({ 
        questions: QUESTIONS,
        total: QUESTIONS.length 
    });
});

// 更新题库（仅管理员）
app.post('/api/admin/questions', (req, res) => {
    const token = req.headers['admin-token'];
    
    if (!verifyAdminToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { questions } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Invalid questions format' });
    }
    
    // 验证每道题的格式
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || !Array.isArray(q.options) || typeof q.correct !== 'number') {
            return res.status(400).json({ 
                error: `Invalid question format at index ${i}` 
            });
        }
    }
    
    // 更新题库
    QUESTIONS = questions;
    
    // 可选：保存到文件持久化
    try {
        const dataPath = path.join(__dirname, 'data');
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        fs.writeFileSync(
            path.join(dataPath, 'questions.json'), 
            JSON.stringify(QUESTIONS, null, 2)
        );
    } catch (e) {
        console.error('Failed to save questions:', e);
    }
    
    res.json({ 
        success: true, 
        message: 'Questions updated successfully',
        total: QUESTIONS.length 
    });
});

// 添加单道题目（仅管理员）
app.post('/api/admin/question', (req, res) => {
    const token = req.headers['admin-token'];
    
    if (!verifyAdminToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { question, options, correct } = req.body;
    
    if (!question || !Array.isArray(options) || typeof correct !== 'number') {
        return res.status(400).json({ error: 'Invalid question format' });
    }
    
    if (correct < 0 || correct >= options.length) {
        return res.status(400).json({ error: 'Invalid correct answer index' });
    }
    
    QUESTIONS.push({ question, options, correct });
    
    res.json({ 
        success: true, 
        message: 'Question added successfully',
        id: QUESTIONS.length - 1,
        total: QUESTIONS.length 
    });
});

// 删除题目（仅管理员）
app.delete('/api/admin/question/:id', (req, res) => {
    const token = req.headers['admin-token'];
    
    if (!verifyAdminToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id < 0 || id >= QUESTIONS.length) {
        return res.status(404).json({ error: 'Question not found' });
    }
    
    QUESTIONS.splice(id, 1);
    
    res.json({ 
        success: true, 
        message: 'Question deleted successfully',
        total: QUESTIONS.length 
    });
});

// 管理员登出
app.post('/api/admin/logout', (req, res) => {
    const token = req.headers['admin-token'];
    if (token) {
        adminSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out' });
});

// ============================================
// 启动服务器
// ============================================

// 尝试从文件加载题库（如果存在）
const dataPath = path.join(__dirname, 'data', 'questions.json');
if (fs.existsSync(dataPath)) {
    try {
        const savedQuestions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
            QUESTIONS = savedQuestions;
            console.log(`Loaded ${QUESTIONS.length} questions from file`);
        }
    } catch (e) {
        console.error('Failed to load questions from file:', e);
    }
}

app.listen(PORT, () => {
    console.log('=================================');
    console.log('🎮 帕鲁答题游戏 - 后端服务');
    console.log('=================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`📝 Total questions: ${QUESTIONS.length}`);
    console.log(`🔒 Admin password from: ${process.env.ADMIN_PASSWORD ? 'ENV' : 'default'}`);
    console.log('=================================');
});
