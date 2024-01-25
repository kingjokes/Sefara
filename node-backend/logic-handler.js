const { readFile, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");

class LogicHandler {
  constructor(req, res) {
    this.command = req.body.command;
    this.req = req;
    this.res = res;

    //perform users command
    try {
      this.execute();
    } catch (e) {
      return this.res.json({
        status: false,
        message: "internal server error",
        err: e.message,
      });
    }
  }

  //handles command payload filtering
  filterCommand() {
    let allowedCommands = ["CREATE", "MOVE", "DELETE", "LIST"];
    let array = this.command?.split(" ");

    //if payload contains allowed instruction
    if (allowedCommands.includes(array[0])) {
      return {
        instruction: array[0],
        path: array.slice(1)?.join(" "),
      };
    }

    //if command is not supported
    return {
      instruction: "error",
      path: "",
    };
  }

  //checks for file.json
  async checkFile() {
    let result = { entries: [] };

    try {
      const filePath = resolve("./file.json");
      //read file content
      const contents = await readFile(filePath, { encoding: "utf8" });

      //parse content
      result = JSON.parse(contents);
    } catch (err) {
      if (err.code === "ENOENT") {
        //creates file and store default value
        writeFile("./file.json", JSON.stringify(result));
      }
    }

    //return file content
    return result;
  }

  //handles command actions
  async addContents(content) {
    let command = this.filterCommand();

    let path;
    switch (command.instruction) {
      case "CREATE":
        path = command.path?.split("/");

        //if command is like CREATE fruits
        if (path.length === 1) {
          let filter = content.entries.filter((item) => item.name === path[0]);
          if (filter.length === 0) {
            content.entries.push({
              name: path[0],
              children: [],
            });
          }
        }
        // if command is like CREATE fruits/apples
        else if (path.length === 2) {
          let firstIndex = content.entries.findIndex(
            (item) => item.name === path[0]
          );
          if (firstIndex !== -1) {
            content.entries[firstIndex].children.push({
              name: path[1],
              children: [],
            });
          }
        }

        //if command is like CREATE fruits/apples/fuji
        else if (path.length === 3) {
          let firstIndex = content.entries.findIndex(
            (item) => item.name === path[0]
          );
          if (firstIndex !== -1) {
            let secondIndex = content.entries[firstIndex].children.findIndex(
              (item) => item.name === path[1]
            );
            if (secondIndex !== -1) {
              content.entries[firstIndex].children[secondIndex].children.push({
                name: path[2],
                children: [],
              });
            }
          }
        }
        //create command not supported
        else {
          return this.res.json({
            status: false,
            message: "The length of file path is not supported ",
          });
        }
        break;

      case "MOVE":
        path = command.path?.split(" ");

        let movDir = path[0];
        let destDir = path[1];

        //get destination index
        let destDirIndex = content.entries.findIndex(
          (item) => item.name === destDir
        );

        // if command is like MOVE grains foods
        if (!movDir.includes("/")) {
          let movDirIndex = content.entries.findIndex(
            (item) => item.name === movDir
          );

          if (movDirIndex !== -1 && destDirIndex !== -1) {
            //if element exists, push and delete from old directory
            content.entries[destDirIndex].children.push({
              ...content.entries[movDirIndex],
            });
            content.entries.splice(movDirIndex, 1);
          }
        }
        //if command is like MOVE grains/squash vegetables
        else {
          let array = movDir?.split("/");
          let parentDir = array[0];
          let childDir = array[1];

          //parent index
          let parentDirIndex = content.entries.findIndex(
            (item) => item.name === parentDir
          );

          if (parentDirIndex !== -1) {
            let childDirIndex = content.entries[
              parentDirIndex
            ].children.findIndex((item) => item.name === childDir);

            if (childDirIndex !== 1 && destDirIndex !== -1) {
              //if child content exist move to destination and delete
              content.entries[destDirIndex].children.push({
                ...content.entries[parentDirIndex].children[childDirIndex],
              });

              content.entries[parentDirIndex].children.splice(childDirIndex, 1);
            }
          }
        }

        break;

      case "DELETE":
        path = command.path?.split("/");

        //checks if delete was successful or not
        let deleteChecker = false;

        //this get the delete path that does not exist
        let deleteDir = "";

        //if command is like  DELETE fruits
        if (path.length === 1) {
          deleteDir = path[0];
          let index = content.entries.findIndex(
            (item) => item.name === path[0]
          );
          if (index !== -1) {
            deleteChecker = !!content.entries.splice(index, 1).length;
          }
        }
        // if command is like DELETE fruits/apples
        else if (path.length === 2) {
          let parentDir = path[0];
          let childDir = path[1];
          let parentIndex = content.entries.findIndex(
            (item) => item.name === parentDir
          );
          if (parentIndex !== -1) {
            let childIndex = content.entries[parentIndex].children.findIndex(
              (item) => item.name === childDir
            );

            if (childIndex !== -1) {
              deleteChecker = !!content.entries[parentIndex].children.splice(
                childIndex,
                1
              ).length;
            } else {
              deleteDir = path[1];
            }
          } else {
            deleteDir = path[0];
          }
        }
        //if command is like DELETE foods/fruits/apples
        else if (path.length === 3) {
          let parentDir = path[0];
          let childDir = path[1];
          let subDir = path[2];
          let parentIndex = content.entries.findIndex(
            (item) => item.name === parentDir
          );
          if (parentIndex !== -1) {
            let childIndex = content.entries[parentIndex].children.findIndex(
              (item) => item.name === childDir
            );

            if (childIndex !== -1) {
              let subIndex = content.entries[parentIndex].children[
                childIndex
              ].children.findIndex((item) => item.name === subDir);
              if (subIndex !== -1) {
                deleteChecker = !!content.entries[parentIndex].children[
                  childIndex
                ].children.splice(subIndex, 1).length;
              } else {
                deleteDir = path[2];
              }
            } else {
              deleteDir = path[1];
            }
          } else {
            deleteDir = path[0];
          }
        }
        //if delete path levels is not supported
        else {
          return this.res.json({
            status: false,
            message: "Only 3-level of delete path is allowed",
          });
        }

        //if delete was not successful
        if (!deleteChecker) {
          return this.res.json({
            status: false,
            message: `${this.command} - ${deleteDir}  does not exist`,
          });
        }
        break;

      case "LIST":
        //get the list of contents in file.json
        let data = await this.displayList(content.entries);

        return this.res.json({
          status: true,
          message: "list retrieved successfully",
          data,
        });

         

      default:
        return this.res.json({
          status: false,
          message: "Invalid command sent",
        });

         
    }

    //write updated contents into file json 
    writeFile("./file.json", JSON.stringify(content));

    //command was successful
    return this.res.json({
      status: 200,
      message: "Command ran successfully",
    });
  }

  //handles command operation
  async execute() {
    
    let content = await this.checkFile();

    await this.addContents(content);
  }

  //display file content in a list form
  async displayList(array) {
    let list = "";
    function displayNode(node, depth) {
      // Create indentation based on the depth
      const indentation = "  ".repeat(depth);

      // Display the current node's name
      list += `${indentation}&nbsp;&nbsp; ${node.name}<br/>`;

      // Recursively display children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => displayNode(child, depth + 1));
      }
    }

    // Start the display with each top-level node
    array.forEach((node) => displayNode(node, 0));

    return list;
  }
}

module.exports = LogicHandler;
