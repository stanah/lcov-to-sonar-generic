const fs = require("fs");
const lcov = require("lcov-parse");
const xmlbuilder = require("xmlbuilder");

const INPUT_FILE_PATH = process.env.LCOV_FILE_PATH || "./lcov.info";
const OUTPUT_FILE_PATH = process.env.XML_FILE_PATH || "./output.xml";

async function lcovToSonar(inputFilePath) {
  const lcovData = await new Promise((resolve, reject) => {
    fs.readFile(inputFilePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        lcov(data, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    });
  });

  const report = xmlbuilder.create("coverage", {
    version: "1.0",
    encoding: "UTF-8",
  });
  report.att("version", "1");

  lcovData.forEach((file) => {
    const fileNode = report.ele("file", { path: file.file });
    file.lines.details.forEach((detail) => {
      fileNode.ele("lineToCover", {
        lineNumber: detail.line,
        covered: detail.hit > 0,
      });
    });
    file.branches.details.forEach((detail) => {
      fileNode.ele("lineToCover", {
        lineNumber: detail.line,
        covered: detail.taken > 0,
        branchesToCover: detail.block,
        coveredBranches: detail.taken,
      });
    });
  });

  return report.end({ pretty: true });
}

async function main() {
  try {
    const xmlString = await lcovToSonar(INPUT_FILE_PATH);
    await fs.promises.writeFile(OUTPUT_FILE_PATH, xmlString);
    console.log("The file was saved!");
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

main().then(() => {
  console.log("end");
});
