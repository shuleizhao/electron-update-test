const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { name, version } = require("../package.json");

function generateLatestYml() {
  const makeDir = path.join(
    __dirname,
    "..",
    "out",
    "make",
    "squirrel.windows",
    "x64"
  );
  const setupExe = `${name}-${version} Setup.exe`;
  const setupExePath = path.join(makeDir, setupExe);

  if (!fs.existsSync(setupExePath)) {
    console.error(`Setup exe not found: ${setupExePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(setupExePath);
  const hashSum = crypto.createHash("sha512");
  hashSum.update(fileBuffer);
  const sha512 = hashSum.digest("base64");

  const latestYml = `version: ${version}
files:
  - url: ${setupExe}
    sha512: ${sha512}
    size: ${fileBuffer.length}
path: ${setupExe}
sha512: ${sha512}
releaseDate: ${new Date().toISOString()}`;

  const latestYmlPath = path.join(makeDir, "latest.yml");
  fs.writeFileSync(latestYmlPath, latestYml);
  console.log(`Generated latest.yml at: ${latestYmlPath}`);
  return latestYmlPath;
}

module.exports = generateLatestYml;

if (require.main === module) {
  generateLatestYml();
}
