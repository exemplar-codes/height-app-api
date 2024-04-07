import { height } from "./setup.js";
import { log } from "./database.js";
import { roughSizeOfObject } from "./utils.js";
import fs from "fs";

const lfTasksListId = "52facafa-3afc-4190-bff5-8fcdf8c4fa4d";
const taskId = "112d7251-862e-4586-977b-7ca0b8cf2c2e";

const req = "All comments";
let res = await height.activities.get({
  //   taskId: "7ca67d01-9180-4703-894f-a08638156ac1",
});

res = {
  ...res,
  list: res.list.filter((activity) => activity.type === "comment"),
};

const size = roughSizeOfObject(res);

await log({
  req,
  res,
  size,
});

fs.writeFileSync("./comments-of-task.json", JSON.stringify(res), (err) => {
  if (err) {
    console.log("Error writing file", err);
  } else {
    console.log("Successfully wrote file");
    process.exit(0);
  }
});
