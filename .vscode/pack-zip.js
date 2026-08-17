import {
  createWriteStream,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import jszip from "jszip";

export default async function packZip() {
  const iconFile = "icon.png";
  const pluginJSON = "plugin.json";
  const distFolder = "dist";
  const json = JSON.parse(readFileSync(pluginJSON, "utf8"));
  let readmeDotMd;
  let changelogDotMd;

  console.log(json.readme, json.changelogs);

  if (!json.readme) {
    readmeDotMd = "readme.md";
    if (!existsSync(readmeDotMd)) {
      readmeDotMd = "README.md";
    }
  }

  if (!json.changelogs) {
    if (!existsSync(changelogDotMd)) {
      changelogDotMd = "CHANGELOG.md";
    }

    if (!existsSync(changelogDotMd)) {
      changelogDotMd = "changelog.md";
    }
  }

  // create zip file of dist folder

  const zip = new jszip();

  zip.file("icon.png", readFileSync(iconFile));
  zip.file("plugin.json", readFileSync(pluginJSON));

  if (readmeDotMd) {
    zip.file("readme.md", readFileSync(readmeDotMd));
  }
  if (changelogDotMd) {
    zip.file("changelog.md", readFileSync(changelogDotMd));
  }

  loadFile("", distFolder);

  return new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(createWriteStream("plugin.zip"))
      .on("finish", () => {
        console.log("plugin.zip created successfully");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error creating plugin.zip:", err);
        reject(err);
      });
  });

  function loadFile(root, folder) {
    const distFiles = readdirSync(folder);
    distFiles.forEach((file) => {
      const stat = statSync(join(folder, file));

      if (stat.isDirectory()) {
        zip.folder(file);
        loadFile(join(root, file), join(folder, file));
        return;
      }

      if (!/LICENSE.txt/.test(file)) {
        zip.file(join(root, file), readFileSync(join(folder, file)));
      }
    });

  }

}
