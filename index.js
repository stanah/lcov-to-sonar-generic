#!/usr/bin/env node

const fs = require("fs");
const lcov = require("lcov-parse");
const xmlbuilder = require("xmlbuilder");

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
    const args = process.argv.slice(2);
    if (args.length != 2 || args.includes("-h") || args.includes("--help")) {
      console.log("Usage: lcov-to-sonar-generic [input file] [output file]");
      console.log("Options:");
      console.log("  -h, --help    Show help");
      process.exit(0);
    }

    const inputFile = args[0];
    const outputFile = args[1];

    const validFilenameRegex = /^[^<>:"/\\|?*\x00-\x1F]*$/;
    if (!validFilenameRegex.test(inputFile)) {
      console.error(`Invalid input file name: ${inputFile}`);
      process.exit(1);
    }
    if (!validFilenameRegex.test(outputFile)) {
      console.error(`Invalid output file name: ${outputFile}`);
      process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
      console.error(`Input file ${inputFile} does not exist`);
      process.exit(1);
    }

    const xmlString = await lcovToSonar(inputFile);
    await fs.promises.writeFile(outputFile, xmlString);
    console.log("The file was saved!");
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

main().then(() => {
  console.log("end");
});
