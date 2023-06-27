const lcovParse = require("lcov-parse");
const xml = require("xmlbuilder");
const fs = require("fs");

const INPUT_FILE_PATH = process.env.LCOV_FILE_PATH || "./lcov.info";
const OUTPUT_FILE_PATH = process.env.XML_FILE_PATH || "./output.xml";

function lcovToSonar(lcovFile) {
  return new Promise((resolve, reject) => {
    lcovParse(lcovFile, (err, data) => {
      if (err) {
        console.error("Error parsing lcov:", err);
        reject(err);
        return;
      }

      const report = xml.create("coverage", {
        version: "1.0",
        encoding: "UTF-8",
      });
      report.att("version", "1");

      data.forEach((file) => {
        const fileNode = report.ele("file", { path: file.file });

        // Handling line coverage
        file.lines.details.forEach((detail) => {
          fileNode.ele("lineToCover", {
            lineNumber: detail.line,
            covered: detail.hit > 0,
          });
        });

        // Handling branch coverage
        file.branches.details.forEach((detail) => {
          fileNode.ele("lineToCover", {
            lineNumber: detail.line,
            covered: detail.taken > 0,
            branchesToCover: detail.block, // Assuming 'block' represents branches
            coveredBranches: detail.taken, // Assuming 'taken' represents covered branches
          });
        });
      });

      resolve(report.end({ pretty: true }));
    });
  });
}

async function main() {
  const xmlString = await lcovToSonar(INPUT_FILE_PATH);
  fs.writeFile(OUTPUT_FILE_PATH, xmlString, (err) => {
    if (err) {
      return console.error("Error writing to file:", err);
    }
    console.log("The file was saved!");
  });
}

main()
  .catch((e) => {
    console.log(e);
  })
  .then(() => {
    console.log("end");
  });
