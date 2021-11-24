const fs = require('fs');


function processFile(content) {
  const zombie = JSON.parse(content);
  // reveal your secrets...
  Object.entries(zombie).forEach((element) => {
    const { edition } = element[1];
    const { attributes } = element[1];

    fs.writeFile(`./apocalypse/${edition}.json`, JSON.stringify(attributes, null, 2), (err) => {
      if (err) {
        throw err;
      }
      console.log(`Finished ${edition}.json`);
    });
  });
}

fs.readFile('./_metadata.json', 'utf8', function read(err, data) {
  if (err) {
    throw err;
  }
  const content = data;
  processFile(content);
});