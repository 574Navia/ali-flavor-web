import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { weeklySpec } from "../data/weeklySpec";

const FONT_NAME = "Alibaba PuHuiTi 2.0";

const FONT = {
  ascii: FONT_NAME,
  eastAsia: FONT_NAME,
  hAnsi: FONT_NAME,
};

const BODY_SIZE = 18;
const SUB_TITLE_SIZE = 18;
const SECTION_TITLE_SIZE = 24;
const MAIN_TITLE_SIZE = 36;

type ExportWeeklyDocxParams = {
  rawInput: string;
  flavorLevel: string;
};

type TaskRowData = {
  index: string;
  startDate: string;
  creator: string;
  executor: string;
  requester: string;
  summary: string;
  deadline: string;
  status: string;
};

function extractValue(text: string, label: string) {
  const match = text.match(new RegExp(`${label}[：:]\\s*([^\\n]+)`));
  return match?.[1]?.trim() || "待补充";
}

function extractSection(text: string, startLabel: string, endLabels: string[]) {
  const startIndex = text.indexOf(startLabel);

  if (startIndex === -1) {
    return [];
  }

  const rest = text.slice(startIndex + startLabel.length).trim();
  let endIndex = rest.length;

  for (const label of endLabels) {
    const index = rest.indexOf(label);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  return rest
    .slice(0, endIndex)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanTaskText(text: string) {
  return text.replace(/^[-●○\d、.\s]+/, "").trim();
}

function getKeyValue(text: string, key: string) {
  const match = text.match(new RegExp(`${key}[=＝:：]\\s*([^；;]+)`));
  return match?.[1]?.trim() || "待补充";
}

function isValidUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function groupCompletedTasks(items: string[]) {
  const groups = {
    duiyou: [] as string[],
    pic: [] as string[],
    aitic: [] as string[],
    other: [] as string[],
  };

  for (const rawItem of items) {
    const item = cleanTaskText(rawItem);

    if (!item) continue;

    if (/堆友|Nano|小红书|扩图|笔记/i.test(item)) {
      groups.duiyou.push(item);
    } else if (/PIC|UCG|模特|手持/i.test(item)) {
      groups.pic.push(item);
    } else if (/AITIC|banner|实训营|专题课程|团服设计/i.test(item)) {
      groups.aitic.push(item);
    } else {
      groups.other.push(item);
    }
  }

  return groups;
}

function parseTaskList(rawInput: string): TaskRowData[] {
  const taskLines = extractSection(rawInput, "任务列表：", [
    "产出链接名称：",
    "产出链接地址：",
    "产出链接：",
    "本周完成：",
    "下周计划：",
    "问题：",
    "需要支持：",
  ]);

  const parsedTasks = taskLines
    .map((line, index) => {
      const content = line.replace(/^任务\d+[：:]\s*/, "").trim();

      if (!content) return null;

      return {
        index: String(index + 1),
        startDate: getKeyValue(content, "发起日期"),
        creator: getKeyValue(content, "发起人"),
        executor: getKeyValue(content, "执行方"),
        requester: getKeyValue(content, "需求方"),
        summary: getKeyValue(content, "需求简述"),
        deadline: getKeyValue(content, "截止日期"),
        status: getKeyValue(content, "需求状态"),
      };
    })
    .filter(Boolean) as TaskRowData[];

  return parsedTasks;
}

function fallbackSingleTask(rawInput: string): TaskRowData[] {
  return [
    {
      index: "1",
      startDate: extractValue(rawInput, "发起日期"),
      creator: extractValue(rawInput, "发起人"),
      executor: extractValue(rawInput, "执行方"),
      requester: extractValue(rawInput, "需求方"),
      summary: extractValue(rawInput, "需求简述"),
      deadline: extractValue(rawInput, "截止日期"),
      status: extractValue(rawInput, "需求状态"),
    },
  ];
}

function paragraph(
  text: string,
  options?: {
    bold?: boolean;
    size?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingAfter?: number;
    spacingBefore?: number;
  }
) {
  return new Paragraph({
    alignment: options?.alignment,
    spacing: {
      before: options?.spacingBefore ?? 0,
      after: options?.spacingAfter ?? 80,
      line: 240,
    },
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        size: options?.size ?? BODY_SIZE,
        font: FONT,
      }),
    ],
  });
}

function hyperlinkParagraph(label: string, linkName: string, linkUrl: string) {
  if (isValidUrl(linkUrl)) {
    return new Paragraph({
      spacing: {
        after: 240,
        line: 240,
      },
      children: [
        new TextRun({
          text: `${label}：`,
          size: BODY_SIZE,
          font: FONT,
        }),
        new ExternalHyperlink({
          link: linkUrl,
          children: [
            new TextRun({
              text: linkName || linkUrl,
              size: BODY_SIZE,
              font: FONT,
              color: "0563C1",
              underline: {},
            }),
          ],
        }),
      ],
    });
  }

  return paragraph(`${label}：${linkName || "待补充"}`, {
    size: BODY_SIZE,
    spacingAfter: 240,
  });
}

function cell(
  text: string,
  options?: {
    bold?: boolean;
    fill?: string;
    width?: number;
  }
) {
  return new TableCell({
    width: options?.width
      ? {
          size: options.width,
          type: WidthType.PERCENTAGE,
        }
      : undefined,
    shading: options?.fill
      ? {
          fill: options.fill,
        }
      : undefined,
    margins: {
      top: 90,
      bottom: 90,
      left: 80,
      right: 80,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
    },
    children: [
      paragraph(text, {
        size: BODY_SIZE,
        bold: options?.bold,
        alignment: AlignmentType.CENTER,
        spacingAfter: 0,
      }),
    ],
  });
}

function taskLine(index: number, text: string) {
  return paragraph(`${index}、${text}`, {
    size: BODY_SIZE,
    spacingAfter: 40,
  });
}

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-");
}

export async function exportWeeklyDocx({
  rawInput,
  flavorLevel,
}: ExportWeeklyDocxParams) {
  const reportDate = extractValue(rawInput, "周报日期");
  const name = extractValue(rawInput, "姓名");
  const department = extractValue(rawInput, "部门");

  const outputLinkName =
    extractValue(rawInput, "产出链接名称") !== "待补充"
      ? extractValue(rawInput, "产出链接名称")
      : extractValue(rawInput, "产出链接");

  const outputLinkUrl = extractValue(rawInput, "产出链接地址");

  const completedItems = extractSection(rawInput, "本周完成：", [
    "下周计划：",
    "问题：",
    "需要支持：",
  ]);

  const nextPlans = extractSection(rawInput, "下周计划：", [
    "问题：",
    "需要支持：",
  ]);

  const problems = extractSection(rawInput, "问题：", ["需要支持："]);

  const supportNeeds = extractSection(rawInput, "需要支持：", []);

  const groupedTasks = groupCompletedTasks(completedItems);

  const parsedTaskRows = parseTaskList(rawInput);
  const taskRows =
    parsedTaskRows.length > 0 ? parsedTaskRows : fallbackSingleTask(rawInput);

  const tableColumnWidths = [6, 13, 11, 10, 10, 30, 12, 8];

  const taskTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: weeklySpec.taskTable.columns.map((column, index) =>
          cell(column, {
            bold: true,
            fill: "FFFFFF",
            width: tableColumnWidths[index],
          })
        ),
      }),

      ...taskRows.map((row) => {
        const rowFill = row.status.includes("已完成") ? "E8F2E4" : "FFFFFF";

        return new TableRow({
          children: [
            cell(row.index, { fill: rowFill, width: tableColumnWidths[0] }),
            cell(row.startDate, { fill: rowFill, width: tableColumnWidths[1] }),
            cell(row.creator, { fill: rowFill, width: tableColumnWidths[2] }),
            cell(row.executor, { fill: rowFill, width: tableColumnWidths[3] }),
            cell(row.requester, { fill: rowFill, width: tableColumnWidths[4] }),
            cell(row.summary, { fill: rowFill, width: tableColumnWidths[5] }),
            cell(row.deadline, { fill: rowFill, width: tableColumnWidths[6] }),
            cell(row.status, { fill: rowFill, width: tableColumnWidths[7] }),
          ],
        });
      }),
    ],
  });

  const title =
    reportDate !== "待补充" && name !== "待补充" && department !== "待补充"
      ? `${reportDate}-${name}-${department}-周报`
      : weeklySpec.titleFormat;

  const children = [
    paragraph(title, {
      bold: true,
      size: MAIN_TITLE_SIZE,
      spacingAfter: 220,
    }),

    paragraph(weeklySpec.taskTable.title, {
      bold: true,
      size: SECTION_TITLE_SIZE,
      spacingAfter: 120,
    }),

    taskTable,

    paragraph(weeklySpec.taskTable.description, {
      size: BODY_SIZE,
      spacingAfter: 260,
    }),

    paragraph("一、本周工作/学习总结", {
      bold: true,
      size: SECTION_TITLE_SIZE,
      spacingAfter: 120,
    }),

    paragraph("a、完成的主要任务（可分条列出）：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 100,
    }),

    paragraph("● 堆友：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 60,
    }),

    ...(groupedTasks.duiyou.length
      ? groupedTasks.duiyou.map((item, index) => taskLine(index + 1, item))
      : [taskLine(1, "本周暂无堆友类任务，待补充。")]),

    paragraph("● PIC：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 60,
    }),

    ...(groupedTasks.pic.length
      ? groupedTasks.pic.map((item, index) => taskLine(index + 1, item))
      : [taskLine(1, "本周暂无 PIC 类任务，待补充。")]),

    paragraph("● AITIC：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 60,
    }),

    ...(groupedTasks.aitic.length
      ? groupedTasks.aitic.map((item, index) => taskLine(index + 1, item))
      : [taskLine(1, "本周暂无 AITIC 类任务，待补充。")]),

    ...(groupedTasks.other.length
      ? [
          paragraph("● 其他：", {
            bold: true,
            size: SUB_TITLE_SIZE,
            spacingAfter: 60,
          }),
          ...groupedTasks.other.map((item, index) => taskLine(index + 1, item)),
        ]
      : []),

    hyperlinkParagraph("产出链接", outputLinkName, outputLinkUrl),

    paragraph("二、下周计划", {
      bold: true,
      size: SECTION_TITLE_SIZE,
      spacingAfter: 120,
    }),

    paragraph("b、计划完成的任务：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 100,
    }),

    ...(nextPlans.length
      ? nextPlans.map((item, index) =>
          paragraph(`● 任务 ${index + 1}：${cleanTaskText(item)}`, {
            size: BODY_SIZE,
            spacingAfter: 60,
          })
        )
      : [
          paragraph("● 任务 1：下周计划待补充。", {
            size: BODY_SIZE,
            spacingAfter: 60,
          }),
        ]),

    paragraph("三、问题与挑战", {
      bold: true,
      size: SECTION_TITLE_SIZE,
      spacingAfter: 120,
      spacingBefore: 120,
    }),

    paragraph("遇到的困难：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 100,
    }),

    ...(problems.length
      ? problems.map((item, index) =>
          paragraph(`● 问题 ${index + 1}：${cleanTaskText(item)}`, {
            size: BODY_SIZE,
            spacingAfter: 60,
          })
        )
      : [
          paragraph("● 问题 1：暂无明确问题。", {
            size: BODY_SIZE,
            spacingAfter: 60,
          }),
        ]),

    paragraph("需要支持的需求：", {
      bold: true,
      size: SUB_TITLE_SIZE,
      spacingAfter: 100,
    }),

    ...(supportNeeds.length
      ? supportNeeds.map((item, index) =>
          paragraph(`○ 需求 ${index + 1}：${cleanTaskText(item)}`, {
            size: BODY_SIZE,
            spacingAfter: 60,
          })
        )
      : [
          paragraph("○ 需求 1：暂无明确支持需求。", {
            size: BODY_SIZE,
            spacingAfter: 60,
          }),
        ]),

    paragraph(`黑话浓度：${flavorLevel}`, {
      size: BODY_SIZE,
      spacingAfter: 80,
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  const fileName =
    reportDate !== "待补充" && name !== "待补充" && department !== "待补充"
      ? `${safeFileName(reportDate)}-${safeFileName(name)}-${safeFileName(
          department
        )}-周报.docx`
      : "周报.docx";

  saveAs(blob, fileName);
}