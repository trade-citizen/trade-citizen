/**
 * set GOOGLE_APPLICATION_CREDENTIALS=D:\Dev\GitHub\trade-citizen\trade-citizen\trade-citizen-firebase-adminsdk.json
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function processResponse(filepath, response) {
  console.log('filepath', filepath);
  //console.log('response', response);

  const fullTextAnnotation = response.fullTextAnnotation;
  //console.log('fullTextAnnotation', fullTextAnnotation);

  const outputFilepath = filepath.split('.').slice(0, -1).join('.') + '.txt';
  console.log('outputFilepath', outputFilepath);
  const ws = fs.createWriteStream(outputFilepath);
  fullTextAnnotation.pages.forEach(page => {
    page.blocks.forEach(block => {
      //console.log('block', block);
      block.paragraphs.forEach(paragraph => {
        //console.log('paragraph', paragraph);
        paragraph.words.forEach(word => {
          const wordText = word.symbols.map(s => s.text).join('');
          console.log('wordText', wordText);
          ws.write(wordText + '\r\n');
        });
      });
    });
  });
  ws.end();
}

async function main() {
  const inputDir = './samples/';

  const files = await readdir(inputDir);

  // Get a list of all files in the directory (filter out other directories)
  // TODO:(pv) Filter out non-supported [image] files
  const imageFilesToProcess = (
    await Promise.all(
      files.map(async file => {
        const filename = path.join(inputDir, file);
        const stats = await stat(filename);
        if (!stats.isDirectory()) {
          return filename;
        }
      })
    )
  ).filter(f => !!f);
  if (imageFilesToProcess.length > 15) {
    console.log('Maximum of 15 images allowed. Analyzing the first 15 found.');
    imageFilesToProcess = imageFilesToProcess.slice(0, 15);
  }
  //console.log('allImageFiles', allImageFiles);

  const requests = await Promise.all(
    imageFilesToProcess.map(async filename => {
      const content = await readFile(filename);
      console.log('filename',  filename);
      return {
        image: {
          content: content.toString('base64'),
        },
        features: [{type: 'DOCUMENT_TEXT_DETECTION'}],
        //imageContext: {
        //  // https://cloud.google.com/vision/docs/languages
        //  languageHints: ["en-t-i0-handwrit"]
        //}
      };
    })
  );

  console.log('Requesting...');
  const results = await client.batchAnnotateImages({requests});
  console.log('DONE!');
  const detections = results[0].responses;
  await Promise.all(
    imageFilesToProcess.map(async (filename, i) => {
      const response = detections[i];
      if (response.error) {
        console.info(`API Error for ${filename}`, response.error);
        return;
      }
      await processResponse(filename, response);
    })
  );
}

main();
