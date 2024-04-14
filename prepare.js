/*
    1. ✅ use the Height API(https://height-api.xyz/openapi/#tag/Tasks/operation/searchTasks) and fetch all tasks into MongoDB
      use MongoDB compass to explore this data, and save API calls too
    2. having gotten tasks, hydrate each one with the its comments. ✅
    3. Convert the tasks array from height format to tasks array in Notion format
        1. Take care of basic attributes ✅
        2. Take care of comments - will become side page ✅
        3. Take care of height attributes, have to take care of all. ✅
    4. Hit Notion API and insert rows ✅
    5. Fix nesting, by setting parent for each Notion row ✅
*/

import { get, update } from "./database.js";
import { height } from "./setup.js";
import axios from "axios";
import { to } from "await-to-js";
import attributes from "./attributes-of-workspace.json" assert { type: "json" };
import getNested from "get-value";
import { markdownToBlocks, markdownToRichText } from "@tryfabric/martian";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { waitForMilliseconds } from "./utils.js";
import ora from "ora";

const spinner = ora("Loading unicorns");
function getHeightTaskLink(index, parent = "OitGt6StRG") {
  return `https://height.app/OitGt6StRG/T-${index}`;
}
// const tasksArray = "66127174a45d4964757742ed"; // step 1
const tasksArray = "661288bdf59f661c99dc1d28"; // step 2 (cloned from step 1)

// import tasks from "./all-height-tasks.json" assert { type: "json" };
// const tasks = (
//   await height.tasks.search({
//     filters: { listIds: { values: [lfTasksListId] } },
//   })
// ).list;

const tasks = (await get("661288bdf59f661c99dc1d28")).res.list;

const ignoreFirstCount = 0;
async function Step_1_hydrateTasksWithComments(
  collectionName = "height-api-logs"
) {
  let count = 0;
  for (let task of tasks) {
    count++;
    if (count <= ignoreFirstCount) continue;

    const activities = await height.activities.get({
      taskId: task.id,
    });
    const comments = activities.list.filter(
      (activity) => activity.type === "comment"
    );

    await update(
      { _id: tasksArray },
      {
        $set: { "res.list.$[element].comments": comments },
      },
      { arrayFilters: [{ "element.id": task.id }], upsert: true }
    );

    console.log(
      `${count}. Added ${comments.length} comments for task ${task.id}`
    );
  }
}
const simpleAttributes = attributes.list.filter((item) => true);

// console.log(new Set(simpleAttributes));
const statusAttributes = Object.groupBy(
  attributes.list[0].labels,
  (item) => item.id
);
const priorityAttributes = Object.groupBy(
  attributes.list[3].labels,
  (item) => item.id
);

// Step_1_hydrateTasksWithComments();

function HeightTaskToNotionRow(task) {
  const properties = task.fields.reduce(
    (accum, field) => {
      const attribute = simpleAttributes.find(
        (attribute) => attribute.name === field.name
      );

      // 'select', ✅
      // 'text' ✅
      // 'date', ✅
      // 'status',

      // 'linkedTasks',
      // 'reverseLinkedTasks',
      // 'timer',

      /**
   *
   * 'Status',
  'Due date', ✅
  'Start date', ✅
  'Priority', ✅
  'Blocked by', 🟡
  'Blocking', 🟡
  'Timer',
  'mETA', ✅
  'mRepeats', ✅
  'mEffort', ✅
  'Project'
   */

      // console.log(JSON.stringify(field), "\n--");
      let addObj;
      // if (field.type === "status") {
      //   const valueName = attribute.labels.find(
      //     (label) => label.id === field.value
      //   ).value;
      //   addObj = { [field.name]: { select: { name: valueName } } };
      // } else
      if (field.type === "select") {
        const valueName = attribute.labels.find(
          (label) => label.id === field.value
        ).value;
        addObj = { [field.name]: { select: { name: valueName } } };
      } else if (field.type === "text") {
        addObj = {
          [field.name]: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: field.value,
                },
              },
            ],
          },
        };
      } else if (field.type === "date") {
        // console.log("Hey");
        const dateObj = new Date(field.date);
        const value = [
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
        ].join("-");

        addObj = {
          [field.name]: {
            date: {
              start: field.date,
            },
          },
        };
      }
      // console.log(addObj);
      // console.log(field.name);
      return {
        ...accum,
        ...addObj,
      };
    },
    {
      Name: {
        title: [
          {
            type: "text",
            text: {
              content: task.name,
            },
          },
        ],
      },
      Status: {
        status: {
          name: (
            statusAttributes[task.status] || statusAttributes[task.status]
          ).find(
            (item) => item.id === task.status || item.status === task.status
          ).value,
        },
      },
      OldAppLink: {
        rich_text: markdownToRichText(
          `[${getHeightTaskLink(task.index)}](${getHeightTaskLink(task.index)})`
        ),

        // {
        //   type: "text",
        //   text: { content: getHeightTaskLink(task.index) },
        //   href: getHeightTaskLink(task.index),
        // },
      },
      // Comment: {
      //   rich_text: [
      //     {
      //       text: {
      //         content: "A dark green leafy vegetable",
      //       },
      //     },
      //   ],
      // },
      // Status: {
      //   select: [
      //     {
      //       name: "",
      //     },
      //   ],
      // },
    }
  );

  const children = [
    {
      messageRichText: `<h2> Description </h2>  ${
        task.description && task.descriptionRichText
      }`,
    },
    ,
    ...task.comments,
  ]
    .map((item) =>
      NodeHtmlMarkdown.translate(item.messageRichText, {
        // codeBlockStyle: "indented",
      })
    )
    .reduce(
      (accum, item) => [
        ...accum,
        ...markdownToBlocks(
          item,
          { strictImageUrls: false }
          // NodeHtmlMarkdown.translate(item).replaceAll("\n", "  ")
        ),
      ],
      []
    )
    .map((item) => {
      const imageLinks = JSON.stringify(item)
        .split('"image":{"type":"external","external":{"url":"')
        .filter((potentialLink) => potentialLink.startsWith("http"))
        .map((link) => link.split('"').at(0))
        .map((link) => `[${link}](${link})`)
        .join("\n  ");

      if (!imageLinks.length) return item;
      else {
        return {
          _nested: true,
          val: markdownToBlocks(imageLinks),
        };
      }
    })
    .reduce((accum, item) => {
      if (!item._nested) return [...accum, item];
      return [...accum, ...item.val];
    }, []);
  // .filter((comment) => !!comment.paragraph.rich_text.length);

  // console.log({ k: JSON.stringify(children) });

  return {
    properties,
    children,
  };
}

async function Step_2_1_Basic_Attributes_Notion(
  collectionName = "height-api-logs"
) {
  let count = 0;
  for (let task of tasks) {
    count++;
    // const notionRow = HeightTaskToNotionRow(task);

    const taskFields = Object.groupBy(task.fields, (item) => item.name);

    // await update(
    //   { _id: tasksArray },
    //   {
    //     $set: {
    //       "res.list.$[element].statusNotion":
    //         statusAttributes[task.status][0].value,
    //       "res.list.$[element].priorityNotion":
    //         taskFields?.["Priority"]?.[0]?.value ?? "",
    //       "res.list.$[element].ETANotion":
    //         taskFields?.["mETA"]?.[0]?.value ?? "",
    //     },
    //   },
    //   { arrayFilters: [{ "element.id": task.id }], upsert: true }
    // );

    // console.log(notionRow);
    // console.log(task);
    console.log(
      `${count}. Status ${JSON.stringify({
        "res.list.$[element].statusNotion":
          statusAttributes[task.status][0].value,
        "res.list.$[element].priorityNotion":
          priorityAttributes?.[taskFields?.["Priority"]?.[0]?.label]?.value ??
          "",
        "res.list.$[element].ETANotion": taskFields?.["mETA"]?.[0]?.value ?? "",
      })} added for task ${task.id}`
    );
    break;
  }
}

// Step_2_1_Basic_Attributes_Notion();

//  Step 3
const databaseId = `afd0e6e9ef5a4b9e94be3a4a022798bc`;
// How to get Notion API key: https://syncwith.com/gs/support/notion-api-key-qrsJHMnH5LuHUjDqvZnmWC

const $axios = axios.create({
  // baseURL: `https://api.notion.com/v1/pages`,
  headers: {
    Authorization: `Bearer ${process.env.HEIGHT_TO_NOTION_INTEGRATION_KEY}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  },
});

const doneTill = 457;
// Success count:265, index: T-247
// Error at index: T-246
async function Step_3_Add_Rows_to_Notion() {
  let count = 1;
  console.log("Starting migration");
  for (let task of tasks) {
    if (doneTill && count <= doneTill) {
      if (count === doneTill) console.log(`Skipped till ${count}`);
      count++;
      continue;
    }
    const notionRowData = HeightTaskToNotionRow(task);
    // console.log(JSON.stringify(notionRowData));
    // return;
    const [err, resp] = await to(
      $axios.post(`https://api.notion.com/v1/pages`, {
        parent: {
          database_id: databaseId,
        },
        ...notionRowData,
      })
    );
    // const [err, resp] = await to(
    //   $axios.get(`https://api.github.com/users/sanjarcode`)
    // );

    if (err) {
      console.log(`Error at index: T-${task.index} `);
      break;
    } else {
      console.log(`Success count:${count}, index: T-${task.index} `);
    }
    await waitForMilliseconds(1000);

    count++;
  }
}
// Step_3_Add_Rows_to_Notion();

const doneTillCount = null;
async function Step4_Handle_Nesting(tasks = []) {
  console.log("Started", "Step4_Handle_Nesting");
  const taskSet = Object.groupBy(tasks, (task) => task.id);
  let count = 1;
  for (let task of tasks) {
    if (doneTillCount && count <= doneTillCount) {
      if (doneTillCount === count) console.log("Skipped till count:", count);
      count++;
      continue;
    }

    const startRoundText = `Checking count: ${count}, T-${task.index}\n`;
    // spinner.start(startRoundText);

    const { parentTaskId = null } = task;
    if (!parentTaskId) {
      console.log("No work needed for count", count, `T-${task.index}`);
      count++;
      // spinner.stop();
      continue;
    }

    console.log(parentTaskId, task.name);
    const parentTask = taskSet[parentTaskId]?.[0];
    // console.log({ parentTask });
    if (!parentTask) {
      console.log("PROBLEM: Parent task not found, problem", task.name);
      spinner.stop();
      count++;
      return;
    }
    try {
      const taskNotionPage = await getNotionPageByName(task.name);
      const parentTaskName = parentTask.name;
      let parentNotionPage = parentTask.notionPage ?? null;
      if (!parentNotionPage) {
        parentNotionPage = await getNotionPageByName(parentTaskName);
        parentTask.notionPage = parentNotionPage;
      }

      const updateStartingString = `Setting "${taskNotionPage.properties.Name.title[0].plain_text}"'s parent to "${parentNotionPage.properties.Name.title[0].plain_text}"`;
      // console.log(startingString);
      spinner.start(updateStartingString);

      await updateNotionPage(taskNotionPage.id, {
        "Parent item": {
          relation: [
            {
              id: parentNotionPage.id,
            },
          ],
        },
      });
    } catch (error) {
      // console.log(error);
      console.log(`Error at index: T-${task.index} `);
      count++;
      spinner.stopAndPersist();
      return;
    }
    spinner.stop();
    console.log(`Success count:${count}, index: T-${task.index} `);
    await waitForMilliseconds(100);

    count++;
  }

  console.log("Ended", "Step4_Handle_Nesting");
}

async function getNotionPageByName(name) {
  const [err, resp] = await to(
    $axios.post(
      `https://api.notion.com/v1/databases/${process.env.HEIGHT_DESTINATION_DB}/query`,
      {
        filter: {
          // or: [
          //   {
          //     property: "In stock",
          //     checkbox: {
          //       equals: true,
          //     },
          //   },
          //   {
          //     property: "Cost of next trip",
          //     number: {
          //       greater_than_or_equal_to: 2,
          //     },
          //   },
          // ],
          property: "Name",
          rich_text: {
            contains: name,
          },
        },
      }
    )
  );
  // console.log(resp.data.results[0]?.properties.Name.title[0].plain_text);
  if (resp) return resp.data.results[0];
  throw err;
}

async function updateNotionPage(pageId, payload) {
  const [err, resp] = await to(
    $axios.patch(`https://api.notion.com/v1/pages/${pageId}`, {
      properties: {
        ...payload,
      },
    })
  );
  // console.log(resp.data);
  if (resp) return resp;
  throw err;
}

// async function setParentPage(pageId, parentPageId) {
//   const [err, resp] = await to(
//     $axios.patch(`https://api.notion.com/v1/pages/${pageId}`, {
//       properties: {
//         ...payload,
//       },
//     })
//   );
//   // console.log(resp.data);
//   if (resp) return resp;
//   throw err;
// }

// getNotionPageByName("Third page");

// Step4_Handle_Nesting();
// updateNotionPage("49d8e7aa150e49788c1eb9efd039a18d", {
//   // OldAppLink: { rich_text: [{ type: "text", text: { content: "uyd2qd" } }] },
//   "Parent item": {
//     relation: [
//       {
//         id: "a4acd766bdc949fbbf6e999002d17566",
//         // type: "text",
//         // text: { content: "a4acd766bdc949fbbf6e999002d17566" },
//       },
//     ],
//   },
// });

Step4_Handle_Nesting(tasks);

// getNotionPageByName("Join a gym");
