require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const imageToBase64 = require('image-to-base64');
const fs = require('fs');
const path = require('path');

let START_NUM = 20;
const END_NUM = 99;

let unsortedFiles = [];
let filesToUpload = [];
let totalUploaded = 0;

const uploadPath = path.join('./apocalypse/');

let startTime = new Date();

//? Helper Functions
function compareFileNames(f1, f2) {
  let name1 = f1.split('.')[0];
  let name2 = f2.split('.')[0];
  return name1 === name2;
}

function elapsedTimeReport(assetNumber, err = false, ended = false) {
  // https://stackoverflow.com/questions/1210701/compute-elapsed-time/1210726#1210726
  // later record end time
  let endTime = new Date();
  // time difference in ms
  let timeDiff = endTime - startTime;
  // strip the ms
  timeDiff /= 1000;
  // get seconds (Original had 'round' which incorrectly counts 0:28, 0:29, 1:30 ... 1:59, 1:0)
  let seconds = Math.round(timeDiff % 60);
  // remove seconds from the date
  timeDiff = Math.floor(timeDiff / 60);
  // get minutes
  let minutes = Math.round(timeDiff % 60);
  // remove minutes from the date
  timeDiff = Math.floor(timeDiff / 60);
  // get hours
  let hours = Math.round(timeDiff % 24);
  if (ended) {
    return console.log(chalk.blueBright.bgBlackBright.bold(`🎉 Good job! ${totalUploaded} NFTs have been uploaded ▶️ Elapsed time: ${hours}h ${minutes}m ${seconds}s`));
  }
  if (err) {
    console.log(chalk.yellow.bold(`Elapsed time: ${hours}h ${minutes}m ${seconds}s`));
  } else {
    totalUploaded += 1;
    console.log(chalk.blueBright.bgBlackBright.bold(`🚀 Success! ${assetNumber} has been uploaded ▶️ Elapsed time: ${hours}h ${minutes}m ${seconds}s`));
  }
}


// ? Data staging and upload function!!!!
const getFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(uploadPath, (err, files) => {
      if (err) {
        reject(err);
      }
      files.forEach((file) => {
        unsortedFiles.push(file);
      });
      resolve(true);
    });
  });
}

const modifyFilesForUpload = async () => {
  for (let index = 0; index < unsortedFiles.length; ++index) {
    const element1 = unsortedFiles[index]; // JSON
    const element2 = unsortedFiles[index +1]; // IMAGE
    if (index + 1 === unsortedFiles.length) {
      return;
    }
    if (compareFileNames(element1, element2)) {
      await imageToBase64(uploadPath + element2)
        .then((response) => {
          filesToUpload.push({
            fileReference: element2.split('.')[0],
            meta: fs.readFileSync(uploadPath + element1, {
              encoding: 'utf8',
              flag: 'r',
            }),
            img: response,
          });
        })
        .catch((error) => {
          console.log(chalk.yellow.bold(`Error in imageToBase64 ${error} ........`))
        });
    }
  }
}

async function uploadMyNFT(metadata, assetNumber, base64ImageData) {
  const body = {
    AssetName: assetNumber,
    previewImageNft: {
      displayname: `ADA Apocalypse #${assetNumber}`,
      mimetype: 'image/png',
      fileFromBase64: base64ImageData,
      metadataPlaceholder: [
        {
          name: 'Background',
          value: metadata[0].value,
        },
        {
          name: 'Skin',
          value: metadata[1].value,
        },
        {
          name: 'Condition',
          value: metadata[2].value,
        },
        {
          name: 'Clothes',
          value: metadata[3].value,
        },
        {
          name: 'Mouth',
          value: metadata[4].value,
        },
        {
          name: 'Eyes',
          value: metadata[5].value,
        },
        {
          name: 'Head',
          value: metadata[6].value,
        },
      ],
    },
  }

  const data = JSON.stringify(body);

  const config = {
    method: 'post',
    url: `https://api.nft-maker.io/UploadNft/${process.env.API_KEY}/${process.env.PROJECT_ID}`,
    headers: {
      accept: 'text/plain',
      'Content-Type': 'application/json'
    },
    data: data,
  }

  await axios(config)
    .then(function (response) {
      elapsedTimeReport(assetNumber, err = false);
    })
    .catch(function (error) {
      console.log(chalk.yellow.bold(`Whoops! Error in ${assetNumber} ▶️ ${error} ............`));
      elapsedTimeReport(assetNumber, err = true);
    });
}

// ? RUN THE SCRIPT!!!
async function* asyncGenerator() {
  let i = START_NUM;
  yield getFiles();
  yield modifyFilesForUpload();
  while (i <= END_NUM) {
    const metadata = JSON.parse(filesToUpload[i].meta);
    const assetNumber = filesToUpload[i].fileReference.padStart(4,'0');
    const base64ImageData = filesToUpload[i].img;
    yield uploadMyNFT(metadata, assetNumber, base64ImageData);
    yield i++;
  }
}

(async function () {
  for await (let num of asyncGenerator()) {
    if (num === END_NUM) {
      elapsedTimeReport(END_NUM, err = false, ended = true);
      console.log(chalk.magentaBright.bold('Finished generating images. Have a great day and god bless!!!!'));
      process.exitCode = 0;
    }
  }
})();