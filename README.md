# height-app-api
Explore and extract my app data from Height.app

See [Notion](https://www.notion.so/sanjarcode/Tasks-25ddd15f8bea45a5ba9c363663a59ad7?pvs=4#e60824ab87b34a2f857124f312185b2c) submodule

1. ✅ use the Height API(https://height-api.xyz/openapi/#tag/Tasks/operation/searchTasks) and fetch all tasks into MongoDB
  use MongoDB compass to explore this data, and save API calls too
2. having gotten tasks, hydrate each one with the its comments. ✅
3. Convert the tasks array from height format to tasks array in Notion format
    1. Take care of basic attributes ✅
    2. Take care of comments - will become side page ✅
    3. Take care of height attributes, have to take care of all. ✅
4. Hit Notion API and insert rows ✅
5. Fix nesting, by setting parent for each Notion row ✅
