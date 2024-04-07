/*
    1. having gotten tasks, hydrate each one with the its comments. ✅
    2. Convert the tasks array from height format to tasks array in Notion format
        1. Take care of basic attributes
        2. Take care of comments - will become side page
        3. Take care of height attributes, have to take care of all.
    3. Hit Notion API and insert rows
*/

import { update } from "./database.js";
import { height } from "./setup.js";

const lfTasksListId = "52facafa-3afc-4190-bff5-8fcdf8c4fa4d";
const tasksArray = "66127174a45d4964757742ed";

// import tasks from "./all-height-tasks.json" assert { type: "json" };
const tasks = (
  await height.tasks.search({
    filters: { listIds: { values: [lfTasksListId] } },
  })
).list;

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

// Step_1_hydrateTasksWithComments();
