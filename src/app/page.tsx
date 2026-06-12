"use client";

import { useEffect, useState, type ReactNode } from "react";
import { aliWords } from "../data/aliWords";
import { weeklySpec } from "../data/weeklySpec";
import { exportWeeklyDocx } from "../lib/exportWeeklyDocx";

const STORAGE_KEY = "ali-flavor-weekly-draft-v1";

const agents = [
  {
    id: "weekly",
    name: "周报 Agent",
    description: "按真实周报模板生成任务状态栏、本周总结、下周计划和问题挑战",
    placeholder: weeklySpec.sampleInput,
  },
  {
    id: "okr",
    name: "OKR Agent",
    description: "把模糊目标改写成 Objective、KR、风险点和优化建议",
    placeholder: "例如：我想提升阿里味助手的使用体验，让朋友更容易完成周报生成。",
  },
  {
    id: "review",
    name: "复盘 Agent",
    description: "把项目过程整理成背景、目标、行动、结果和下次优化",
    placeholder: "例如：我做了一个阿里味助手 MVP，过程中遇到 GitHub、部署和页面优化问题，最后成功上线。",
  },
  {
    id: "translate",
    name: "黑话翻译器",
    description: "普通话和阿里味表达互相转换",
    placeholder: "例如：我们下周讨论一下方案。",
  },
];

type AliWord = (typeof aliWords)[number] & {
  word: string;
  category?: string;
  meaning?: string;
  workerTranslation?: string;
  example?: string;
};

type WeeklyTask = {
  id: number;
  startDate: string;
  creator: string;
  executor: string;
  requester: string;
  summary: string;
  deadline: string;
  status: string;
};

type WeeklyFormState = {
  reportDate: string;
  name: string;
  department: string;
  outputLinkName: string;
  outputLinkUrl: string;
  completed: string;
  nextPlans: string;
  problems: string;
  supportNeeds: string;
};

type CheckItem = {
  type: "success" | "warning" | "error";
  message: string;
};

function createEmptyTask(id: number): WeeklyTask {
  return {
    id,
    startDate: "",
    creator: "",
    executor: "",
    requester: "",
    summary: "",
    deadline: "",
    status: "已完成",
  };
}

const emptyWeeklyForm: WeeklyFormState = {
  reportDate: "",
  name: "",
  department: "",
  outputLinkName: "",
  outputLinkUrl: "",
  completed: "",
  nextPlans: "",
  problems: "",
  supportNeeds: "",
};

const sampleWeeklyForm: WeeklyFormState = {
  reportDate: "0909",
  name: "小明",
  department: "设计部",
  outputLinkName: "0909-AITIC-线下实训营 banner 图-3 张",
  outputLinkUrl: "https://example.com/0909-aitic-banner",
  completed: `堆友工具与 Nano Banana 结合视频教程 3 条
堆友“AI 扩图”功能推荐的小红书图文笔记 2 篇
UCG 模特视频 5 条
AITIC 线下实训营 banner 图 3 张`,
  nextPlans: `5 个“手持万物”视频等待 PIC 审核，预计 3 天提交完成
下周还有 3 条 AITIC 堆友专题课程 banner 图等待制作，预计需要 5 天`,
  problems: "对 AI 工具操作不熟悉，导致任务进度延迟",
  supportNeeds: "需要 PIC 给出 0909-UCG-ins-换脸男 文档权限",
};

const sampleWeeklyTasks: WeeklyTask[] = [
  {
    id: 1,
    startDate: "2025-09-03",
    creator: "马雨欣",
    executor: "小明",
    requester: "堆友",
    summary: "堆友“AI 扩图”功能推荐的小红书图文笔记 2 篇",
    deadline: "2025-09-07",
    status: "已完成",
  },
  {
    id: 2,
    startDate: "2025-09-05",
    creator: "马雨欣",
    executor: "小明",
    requester: "AITIC",
    summary: "团服设计",
    deadline: "2025-09-11",
    status: "进行中",
  },
  {
    id: 3,
    startDate: "2025-09-05",
    creator: "马雨欣",
    executor: "小明",
    requester: "堆友",
    summary: "堆友工具与 Nano Banana 结合视频教程 3 条",
    deadline: "2025-09-07",
    status: "已完成",
  },
  {
    id: 4,
    startDate: "2025-09-06",
    creator: "马雨欣",
    executor: "小明",
    requester: "PIC",
    summary: "UCG 模特视频 5 条（15s）",
    deadline: "2025-09-08",
    status: "已完成",
  },
  {
    id: 5,
    startDate: "2025-09-06",
    creator: "马雨欣",
    executor: "小明",
    requester: "AITIC",
    summary: "AITIC 线下实训营 banner 图 3 张",
    deadline: "2025-09-09",
    status: "已完成",
  },
  {
    id: 6,
    startDate: "2025-09-07",
    creator: "马雨欣",
    executor: "小明",
    requester: "AITIC",
    summary: "堆友专题课程第十期 banner 图 3 张",
    deadline: "2025-09-13",
    status: "未开始",
  },
];

function isValidUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

function getWorkerTranslation(item: AliWord) {
  return (
    item.workerTranslation ||
    item.example?.replace(/^打工人翻译[:：]\s*/, "") ||
    "暂无打工人翻译"
  );
}

function getAliWordMeaning(item: AliWord) {
  return item.meaning || "暂无解释";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs text-slate-400">{children}</label>;
}

function InputBox({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-orange-400"
      />
    </div>
  );
}

function TextAreaBox({
  label,
  value,
  placeholder,
  height,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  height: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${height} w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-orange-400`}
      />
    </div>
  );
}

function CheckBadge({ type }: { type: CheckItem["type"] }) {
  if (type === "success") {
    return <span className="text-emerald-300">✅</span>;
  }

  if (type === "warning") {
    return <span className="text-yellow-300">⚠️</span>;
  }

  return <span className="text-red-300">❌</span>;
}


function cleanGeneratedText(text: string) {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^---$/gm, "────────────────────")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [weeklyForm, setWeeklyForm] =
    useState<WeeklyFormState>(emptyWeeklyForm);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([
    createEmptyTask(1),
  ]);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [draftStatus, setDraftStatus] = useState("草稿未保存");
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [aliWordSearch, setAliWordSearch] = useState("");
  const [selectedAliWord, setSelectedAliWord] = useState<AliWord | null>(null);

  const filteredAliWords = (aliWords as AliWord[])
    .filter((item) => {
      const keyword = aliWordSearch.trim().toLowerCase();

      if (!keyword) return true;

      return [
        item.word,
        item.category,
        item.meaning,
        item.workerTranslation,
        item.example,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    })
    .slice(0, 20);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(STORAGE_KEY);

      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as {
          weeklyForm?: WeeklyFormState;
          weeklyTasks?: WeeklyTask[];
          input?: string;
        };

        if (draft.weeklyForm) {
          setWeeklyForm(draft.weeklyForm);
        }

        if (draft.weeklyTasks && draft.weeklyTasks.length > 0) {
          setWeeklyTasks(draft.weeklyTasks);
        }

        if (typeof draft.input === "string") {
          setInput(draft.input);
        }

        setDraftStatus("已恢复上次草稿");
      } else {
        setDraftStatus("暂无历史草稿");
      }
    } catch {
      setDraftStatus("草稿恢复失败");
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            weeklyForm,
            weeklyTasks,
            input,
          })
        );

        setDraftStatus("草稿已自动保存");
      } catch {
        setDraftStatus("草稿保存失败");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [hasLoadedDraft, weeklyForm, weeklyTasks, input]);

  function handleWeeklyFormChange(field: keyof WeeklyFormState, value: string) {
    setWeeklyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleWeeklyTaskChange(
    taskId: number,
    field: keyof WeeklyTask,
    value: string
  ) {
    setWeeklyTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: value,
            }
          : task
      )
    );
  }

  function handleAddTask() {
    setWeeklyTasks((prev) => [...prev, createEmptyTask(Date.now())]);
  }

  function handleRemoveTask(taskId: number) {
    setWeeklyTasks((prev) => {
      if (prev.length === 1) {
        return [createEmptyTask(Date.now())];
      }

      return prev.filter((task) => task.id !== taskId);
    });
  }

  function buildWeeklyInputFromForm(
    form: WeeklyFormState,
    tasks: WeeklyTask[]
  ) {
    const taskLines = tasks
      .map((task, index) => {
        return `任务${index + 1}：发起日期=${task.startDate || "待补充"}；发起人=${
          task.creator || "待补充"
        }；执行方=${task.executor || "待补充"}；需求方=${
          task.requester || "待补充"
        }；需求简述=${task.summary || "待补充"}；截止日期=${
          task.deadline || "待补充"
        }；需求状态=${task.status || "待补充"}`;
      })
      .join("\n");

    return `周报日期：${form.reportDate || "待补充"}
姓名：${form.name || "待补充"}
部门：${form.department || "待补充"}

任务列表：
${taskLines}

产出链接名称：${form.outputLinkName || "待补充"}
产出链接地址：${form.outputLinkUrl || "待补充"}

本周完成：
${form.completed || "待补充"}

下周计划：
${form.nextPlans || "待补充"}

问题：
${form.problems || "暂无明确问题"}

需要支持：
${form.supportNeeds || "暂无明确支持需求"}`;
  }

  function validateWeeklyReport() {
    const items: CheckItem[] = [];

    if (weeklyForm.reportDate && weeklyForm.name && weeklyForm.department) {
      items.push({
        type: "success",
        message: "周报标题信息完整。",
      });
    } else {
      items.push({
        type: "error",
        message: "周报日期、姓名、部门不能为空。",
      });
    }

    const filledTasks = weeklyTasks.filter(
      (task) =>
        task.startDate ||
        task.creator ||
        task.executor ||
        task.requester ||
        task.summary ||
        task.deadline
    );

    if (filledTasks.length === 0) {
      items.push({
        type: "error",
        message: "至少需要填写 1 条任务状态。",
      });
    } else {
      items.push({
        type: "success",
        message: `任务状态栏已填写 ${filledTasks.length} 条。`,
      });
    }

    filledTasks.forEach((task, index) => {
      const missingFields = [];

      if (!task.startDate) missingFields.push("发起日期");
      if (!task.creator) missingFields.push("发起人");
      if (!task.executor) missingFields.push("执行方");
      if (!task.requester) missingFields.push("需求方");
      if (!task.summary) missingFields.push("需求简述");
      if (!task.deadline) missingFields.push("截止日期");
      if (!task.status) missingFields.push("需求状态");

      if (missingFields.length > 0) {
        items.push({
          type: "error",
          message: `任务 ${index + 1} 缺少：${missingFields.join("、")}。`,
        });
      }
    });

    const hasCompletedTask = filledTasks.some((task) => task.status === "已完成");

    if (hasCompletedTask && !weeklyForm.outputLinkName.trim()) {
      items.push({
        type: "warning",
        message: "存在已完成任务，但未填写产出链接名称。",
      });
    }

    if (hasCompletedTask && !weeklyForm.outputLinkUrl.trim()) {
      items.push({
        type: "warning",
        message: "存在已完成任务，但未填写产出链接地址。",
      });
    }

    if (
      weeklyForm.outputLinkUrl.trim() &&
      !isValidUrl(weeklyForm.outputLinkUrl)
    ) {
      items.push({
        type: "warning",
        message:
          "产出链接地址不是 http:// 或 https:// 开头，Word 中不会生成可点击链接。",
      });
    }

    if (!weeklyForm.completed.trim()) {
      items.push({
        type: "warning",
        message: "本周完成内容为空，建议补充按堆友 / PIC / AITIC 分类的完成事项。",
      });
    } else {
      items.push({
        type: "success",
        message: "本周完成内容已填写。",
      });
    }

    if (!weeklyForm.nextPlans.trim()) {
      items.push({
        type: "warning",
        message: "下周计划为空，建议补充计划任务和预计完成时间。",
      });
    } else {
      items.push({
        type: "success",
        message: "下周计划已填写。",
      });
    }

    if (!weeklyForm.problems.trim()) {
      items.push({
        type: "warning",
        message: "问题为空。若暂无问题，可以写“暂无明确问题”。",
      });
    }

    if (!weeklyForm.supportNeeds.trim()) {
      items.push({
        type: "warning",
        message: "需要支持为空。若暂无支持需求，可以写“暂无明确支持需求”。",
      });
    }

    const unfinishedTasks = filledTasks.filter(
      (task) => task.status === "进行中" || task.status === "未开始"
    );

    if (unfinishedTasks.length > 0) {
      items.push({
        type: "warning",
        message: `有 ${unfinishedTasks.length} 条任务为进行中或未开始，请确认是否不应写入“本周完成”。`,
      });
    }

    if (!items.some((item) => item.type === "error")) {
      items.push({
        type: "success",
        message: "没有发现阻塞下载的严重问题。",
      });
    }

    setCheckItems(items);
    return items;
  }

  function handleCheckWeeklyReport() {
    validateWeeklyReport();
  }

  function handleGenerateWeeklyInput() {
    const weeklyInput = buildWeeklyInputFromForm(weeklyForm, weeklyTasks);
    setInput(weeklyInput);
    setOutput("");
  }

  function handleUseSample() {
    if (selectedAgent.id === "weekly") {
      setWeeklyForm(sampleWeeklyForm);
      setWeeklyTasks(sampleWeeklyTasks);
      setInput(buildWeeklyInputFromForm(sampleWeeklyForm, sampleWeeklyTasks));
      setOutput("");
      setCheckItems([]);
      setDraftStatus("已填入示例，草稿将自动保存");
    } else {
      setInput(selectedAgent.placeholder);
    }
  }

  function handleClearWeeklyForm() {
    setWeeklyForm(emptyWeeklyForm);
    setWeeklyTasks([createEmptyTask(1)]);
    setInput("");
    setOutput("");
    setCheckItems([]);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setDraftStatus("草稿已清空");
    } catch {
      setDraftStatus("草稿清空失败");
    }
  }

  function handleGenerate() {
    if (!input.trim()) {
      setOutput("先输入一点内容，我才能帮你把这个事情闭环。");
      return;
    }

    let result = "";

    if (selectedAgent.id === "weekly") {
      result = `# 周报预览

当前复制结果是 Markdown 文本，仅用于预览。
如果要得到真正 Word 格式，请点击「下载 Word 周报」。

---

## 原始输入

${input}

---

## 周报填写规范

${weeklySpec.outputRules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}

`;
    }

    if (selectedAgent.id === "okr") {
      result = `# OKR 生成结果

## 原始目标
${input}

## Objective
提升「${input}」相关工作的推进质量与结果确定性，让目标更清晰、过程更可控、产出更可验证。

## Key Results
1. KR1：在本周期内明确核心目标、关键对象和验收口径，形成一版可执行方案。
2. KR2：拆解不少于 3 个关键任务，每个任务明确 owner、deadline 和交付物。
3. KR3：完成至少 1 轮相关方对齐，减少信息差，确认推进节奏和协同方式。
4. KR4：沉淀可复用的过程文档或模板，为后续类似事项复用提供参考。
5. KR5：收集不少于 3 条真实反馈，并基于反馈完成至少 1 次优化迭代。

## 风险点
1. 目标可能仍然偏大，需要继续拆成更小的阶段性任务。
2. KR 中如果没有数字、时间或验收标准，后续很难判断是否完成。
3. 如果相关方没有提前对齐，执行中容易出现返工和信息差。

## 优化建议
1. 把「想提升」改成「提升到什么程度」，例如完成率、耗时、满意度、反馈数量。
2. 把「我要做」改成「谁在什么时间交付什么结果」。
3. 每个 KR 尽量带一个可衡量指标，比如数量、比例、时间、质量标准。

## 打工人版解释
这套 OKR 的意思是：先把目标说清楚，再拆成能验收的任务，过程中持续对齐，最后用数据和反馈证明事情真的做成了。`;
    }

    if (selectedAgent.id === "review") {
      result = `# 项目复盘生成结果

## 原始描述
${input}

## S - Situation 背景
围绕「${input}」这个事项，项目从一个相对模糊的想法开始，需要在有限时间内完成目标拆解、方案验证和结果交付。

## T - Task 目标
本次任务的核心目标是跑通最小可用闭环：明确要解决的问题，完成关键功能或关键交付，并让结果可以被他人真实体验或验证。

## A - Action 行动
1. 先聚焦最核心的使用场景，避免一开始就做大而全的平台。
2. 将任务拆成若干小步骤，逐步完成页面、逻辑、内容和部署。
3. 遇到阻塞时及时定位问题，例如环境配置、页面样式、线上部署和用户访问。
4. 在功能可用后进行体验优化，让用户更容易理解和使用。
5. 最后完成上线，让项目从本地 Demo 变成可分享的线上 MVP。

## R - Result 结果
当前事项已经形成阶段性成果：核心流程可以被演示，用户可以打开页面体验，项目也具备继续收集反馈和迭代优化的基础。

## 亮点
1. 没有一开始追求完整平台，而是先选择最容易验证价值的场景切入。
2. 能持续根据使用反馈调整页面结构和交互体验。
3. 完成了从本地开发到线上部署的完整闭环。
4. 项目已经具备可演示、可试用、可迭代的 MVP 形态。

## 问题与不足
1. 当前生成内容仍以模板为主，智能化程度有限。
2. 部分功能还需要更明确的输入引导，降低新用户理解成本。
3. 如果后续用户增多，还需要考虑数据保存、权限和稳定性问题。

## 下次优化
1. 优先收集真实用户反馈，不要凭感觉继续堆功能。
2. 对高频场景继续做深，例如周报、OKR、复盘三个核心 Agent。
3. 后续再考虑接入 AI，让系统从“模板生成”升级为“自动理解和生成”。

## 方法论沉淀
先跑通最小闭环，再基于真实反馈迭代。MVP 的重点不是功能多，而是能证明一个具体问题真的被解决了。`;
    }

    if (selectedAgent.id === "translate") {
      const matchedWords = (aliWords as AliWord[])
        .filter((item) => {
          const meaning = getAliWordMeaning(item);
          const workerTranslation = getWorkerTranslation(item);

          return (
            input.includes(item.word) ||
            input.includes(meaning) ||
            input.includes(workerTranslation)
          );
        })
        .slice(0, 6);

      const wordsToUse =
        matchedWords.length > 0
          ? matchedWords
          : (aliWords as AliWord[]).slice(0, 6);

      const wordList = wordsToUse
        .map(
          (item, index) =>
            `${index + 1}. ${item.word}：${getAliWordMeaning(item)}\n   打工人翻译：${getWorkerTranslation(
              item
            )}`
        )
        .join("\n");

      const mainWords = wordsToUse.map((item) => item.word).join("、");

      result = `# 黑话翻译结果

## 原文
${input}

## 阿里味表达
围绕「${input}」这个事项，建议先把相关信息进行同步，拉齐各方认知，再明确核心抓手、推进节奏和交付口径，确保后续动作能够闭环。

## 使用到的黑话
${mainWords}

## 黑话解释
${wordList}

## 打工人翻译
这句话的意思是：大家先把事情说清楚，统一理解，再确定怎么做、谁来做、什么时候交付。`;
    }

    setOutput(cleanGeneratedText(result));
  }

  async function handleCopy() {
    if (!output) {
      alert("还没有生成内容，先点一下生成。");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      alert("已复制到剪贴板。");
    } catch {
      alert("复制失败，可以手动选中结果复制。");
    }
  }

  async function handleDownloadWeeklyDocx() {
    if (selectedAgent.id !== "weekly") {
      alert("只有周报 Agent 支持下载 Word。");
      return;
    }

    const items = validateWeeklyReport();
    const hasError = items.some((item) => item.type === "error");

    if (hasError) {
      alert("周报体检发现必填项缺失，请先修正红色错误再下载。");
      return;
    }

    const finalInput = buildWeeklyInputFromForm(weeklyForm, weeklyTasks);

    await exportWeeklyDocx({
      rawInput: finalInput,
      flavorLevel: "中",
    });

    setInput(finalInput);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <div className="mb-3 inline-flex rounded-full bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
            阿里味 Agent · MVP
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            阿里味智能工作助手
          </h1>

          <p className="mt-4 max-w-5xl text-slate-300">
            阿里味工作助手：周报、OKR、项目复盘和黑话翻译一站式生成。当前主打周报 Agent：填写信息 → 体检校验 → 下载 Word 周报。
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[260px_1fr_340px]">
          <aside className="self-start rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-lg font-semibold">选择 Agent</h2>

            <div className="space-y-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setOutput("");
                    setInput("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedAgent.id === agent.id
                      ? "border-orange-400 bg-orange-500/10"
                      : "border-slate-800 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {agent.description}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">{selectedAgent.name}</h2>
              <p className="mt-2 text-slate-400">
                {selectedAgent.description}
              </p>
            </div>

            {selectedAgent.id === "weekly" && (
              <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">周报表单模式</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      添加多条任务状态，体检通过后生成标准 Word 周报。
                    </p>

                    <div className="mt-2 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {draftStatus}
                    </div>
                  </div>

                  <button
                    onClick={handleClearWeeklyForm}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    清空表单
                  </button>
                </div>

                <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="mb-3 text-sm font-medium text-orange-300">
                    周报标题信息
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <InputBox
                      label="周报日期"
                      value={weeklyForm.reportDate}
                      placeholder="例如 0909"
                      onChange={(value) =>
                        handleWeeklyFormChange("reportDate", value)
                      }
                    />

                    <InputBox
                      label="姓名"
                      value={weeklyForm.name}
                      placeholder="例如 小明"
                      onChange={(value) =>
                        handleWeeklyFormChange("name", value)
                      }
                    />

                    <InputBox
                      label="部门"
                      value={weeklyForm.department}
                      placeholder="例如 设计部"
                      onChange={(value) =>
                        handleWeeklyFormChange("department", value)
                      }
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-300">
                      任务进度状态栏
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      每一条都会生成到 Word 顶部表格里。
                    </p>
                  </div>

                  <button
                    onClick={handleAddTask}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-400"
                  >
                    + 添加任务
                  </button>
                </div>

                <div className="space-y-4">
                  {weeklyTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-medium text-slate-200">
                          任务 {index + 1}
                        </div>

                        <button
                          onClick={() => handleRemoveTask(task.id)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                        >
                          删除
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <InputBox
                          label="发起日期"
                          value={task.startDate}
                          placeholder="例如 2025-09-06"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "startDate", value)
                          }
                        />

                        <InputBox
                          label="发起人"
                          value={task.creator}
                          placeholder="例如 马雨欣"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "creator", value)
                          }
                        />

                        <InputBox
                          label="执行方"
                          value={task.executor}
                          placeholder="例如 小明"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "executor", value)
                          }
                        />

                        <InputBox
                          label="需求方"
                          value={task.requester}
                          placeholder="例如 AITIC / 堆友 / PIC"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "requester", value)
                          }
                        />

                        <InputBox
                          label="截止日期"
                          value={task.deadline}
                          placeholder="例如 2025-09-09"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "deadline", value)
                          }
                        />

                        <div>
                          <FieldLabel>需求状态</FieldLabel>
                          <select
                            value={task.status}
                            onChange={(event) =>
                              handleWeeklyTaskChange(
                                task.id,
                                "status",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm outline-none focus:border-orange-400"
                          >
                            <option value="已完成">已完成</option>
                            <option value="进行中">进行中</option>
                            <option value="未开始">未开始</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <InputBox
                          label="需求简述"
                          value={task.summary}
                          placeholder="例如 AITIC 线下实训营 banner 图 3 张"
                          onChange={(value) =>
                            handleWeeklyTaskChange(task.id, "summary", value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InputBox
                    label="产出链接名称"
                    value={weeklyForm.outputLinkName}
                    placeholder="例如 0909-AITIC-线下实训营 banner 图-3 张"
                    onChange={(value) =>
                      handleWeeklyFormChange("outputLinkName", value)
                    }
                  />

                  <InputBox
                    label="产出链接地址"
                    value={weeklyForm.outputLinkUrl}
                    placeholder="粘贴钉盘/文档分享链接，例如 https://..."
                    onChange={(value) =>
                      handleWeeklyFormChange("outputLinkUrl", value)
                    }
                  />
                </div>

                <div className="mt-3">
                  <TextAreaBox
                    label="本周完成"
                    value={weeklyForm.completed}
                    height="h-28"
                    placeholder={`每行一条，例如：
堆友工具与 Nano Banana 结合视频教程 3 条
UCG 模特视频 5 条
AITIC 线下实训营 banner 图 3 张`}
                    onChange={(value) =>
                      handleWeeklyFormChange("completed", value)
                    }
                  />
                </div>

                <div className="mt-3">
                  <TextAreaBox
                    label="下周计划"
                    value={weeklyForm.nextPlans}
                    height="h-24"
                    placeholder={`每行一条，例如：
5 个“手持万物”视频等待 PIC 审核，预计 3 天提交完成`}
                    onChange={(value) =>
                      handleWeeklyFormChange("nextPlans", value)
                    }
                  />
                </div>

                <div className="mt-3">
                  <TextAreaBox
                    label="问题"
                    value={weeklyForm.problems}
                    height="h-20"
                    placeholder="例如：对 AI 工具操作不熟悉，导致任务进度延迟"
                    onChange={(value) =>
                      handleWeeklyFormChange("problems", value)
                    }
                  />
                </div>

                <div className="mt-3">
                  <TextAreaBox
                    label="需要支持"
                    value={weeklyForm.supportNeeds}
                    height="h-20"
                    placeholder="例如：需要 PIC 给出文档权限"
                    onChange={(value) =>
                      handleWeeklyFormChange("supportNeeds", value)
                    }
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleGenerateWeeklyInput}
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
                  >
                    生成周报输入
                  </button>

                  <button
                    onClick={handleCheckWeeklyReport}
                    className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-400"
                  >
                    周报体检
                  </button>

                  <button
                    onClick={handleUseSample}
                    className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
                  >
                    填入示例
                  </button>
                </div>

                {checkItems.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="mb-3 font-medium text-slate-200">
                      周报体检结果
                    </div>

                    <div className="space-y-2">
                      {checkItems.map((item, index) => (
                        <div
                          key={`${item.message}-${index}`}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            item.type === "error"
                              ? "bg-red-500/10 text-red-200"
                              : item.type === "warning"
                              ? "bg-yellow-500/10 text-yellow-100"
                              : "bg-emerald-500/10 text-emerald-100"
                          }`}
                        >
                          <span className="mr-2">
                            <CheckBadge type={item.type} />
                          </span>
                          {item.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm text-slate-300">
                输入你的内容
              </label>

              {selectedAgent.id !== "weekly" && (
                <button
                  onClick={handleUseSample}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                >
                  填入示例
                </button>
              )}
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={selectedAgent.placeholder}
              className="h-52 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-orange-400"
            />

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-col gap-3 sm:flex-row">
                {selectedAgent.id === "weekly" && (
                  <button
                    onClick={handleDownloadWeeklyDocx}
                    className="rounded-xl bg-slate-100 px-6 py-3 font-medium text-slate-950 hover:bg-white"
                  >
                    下载 Word 周报
                  </button>
                )}

                <button
                  onClick={handleGenerate}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-400"
                >
                  生成阿里味内容
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-slate-400">生成结果</div>

                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
                >
                  复制结果
                </button>
              </div>

              <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                {output || "生成结果会显示在这里。"}
              </pre>
            </div>
          </section>

          <aside className="space-y-6">
            {selectedAgent.id === "weekly" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">周报规范</h2>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    已接入
                  </span>
                </div>

                <p className="mb-3 text-sm text-slate-400">
                  当前只在周报 Agent 中展示。周报 Agent 会优先按你上传的模板输出，并支持下载真正的 Word 文件。
                </p>

                <div className="space-y-2 text-sm text-slate-300">
                  {weeklySpec.outputRules.slice(0, 8).map((rule) => (
                    <div
                      key={rule}
                      className="rounded-lg bg-slate-950 px-3 py-2"
                    >
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAgent.id === "translate" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">黑话库预览</h2>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {aliWords.length} 个词
                  </span>
                </div>

                <p className="mb-4 text-sm text-slate-400">
                  点击词条查看完整解释。黑话翻译器会优先从这里匹配表达。
                </p>

                <input
                  value={aliWordSearch}
                  onChange={(event) => setAliWordSearch(event.target.value)}
                  placeholder="搜索黑话，例如 闭环 / 拉齐 / TP99"
                  className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-orange-400"
                />

                <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                  {filteredAliWords.map((item) => {
                    const isSelected = selectedAliWord?.word === item.word;

                    return (
                      <button
                        key={`${item.word}-${item.category}`}
                        onClick={() =>
                          setSelectedAliWord(isSelected ? null : item)
                        }
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-orange-400 bg-orange-500/10"
                            : "border-slate-800 bg-slate-950 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-orange-300">
                            {item.word}
                          </div>
                          <div className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                            {item.category || "未分类"}
                          </div>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {getAliWordMeaning(item)}
                        </p>

                        {isSelected && (
                          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
                            <div className="mb-1 text-xs text-slate-400">
                              打工人翻译
                            </div>
                            <p className="text-sm leading-6 text-slate-200">
                              {getWorkerTranslation(item)}
                            </p>

                            <div className="mt-3 text-xs text-slate-500">
                              再点一次可收起
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedAgent.id === "okr" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">OKR 写作提示</h2>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    模板版
                  </span>
                </div>

                <p className="mb-3 text-sm text-slate-400">
                  OKR Agent 目前是模板化输出，适合先做 MVP 演示。后续可以接 AI 做自动拆解和评分。
                </p>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    Objective：一句话描述方向，尽量有业务价值。
                  </div>
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    KR：写成可衡量结果，避免只写动作。
                  </div>
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    优化建议：补充指标、截止时间和验收标准。
                  </div>
                </div>
              </div>
            )}

            {selectedAgent.id === "review" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">复盘写作提示</h2>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    STAR / PDCA
                  </span>
                </div>

                <p className="mb-3 text-sm text-slate-400">
                  复盘 Agent 目前按 STAR 结构输出，适合项目结束后快速沉淀经验。
                </p>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    S：背景是什么，为什么要做。
                  </div>
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    T：目标是什么，判断成功的标准是什么。
                  </div>
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    A：做了哪些动作，遇到什么阻塞。
                  </div>
                  <div className="rounded-lg bg-slate-950 px-3 py-2">
                    R：结果如何，后续怎么迭代。
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
