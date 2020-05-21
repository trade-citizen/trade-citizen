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

const STRUCTURE = {
  Left: [
    'Total Cargo Space',
    'Empty Cargo Space',
  ],
  Center: [
    'Available Items',
    'Filters', 'Sort',
    'Price / Unit',
    'aUEC'
  ],
  Right: [
    'Storage Inventory Levels',
    'Demand',
    'AMOUNT TO PURCHASE',
    'UNITS', 'FOR', 'aUEC',
    'Filling', 'SCU', 'Max Available Stock',
    'Min', 'Max',
    'Purchase'
  ]
};
const Commodities = {
  'Metal':[
    'Agricium',
    'Aluminum',
    'Gold',
    'Titanium',
    'Tungsten',
  ],
  'Agricultural Supply':[
    'Agricultural Supplies',
  ],
  'Vice':[
    'Altruciatoxin',
    'Distilled Spirits',
    'E\'tam',
    'Maze',
    'Neon',
    'Revenant Tree Pollen',
    'SLAM',
    'Stims',
    'WiDow',
  ],
  'Harvestable':[
    'Amioshi Plague',
    'Aphorite',
    'Compboard',
    'Dolivine',
    'Golden Medmons',
    'Hadanite',
    'Pitambu',
    'Prota',
    'Ranta Dung',
    'Revenant Pods',
  ],  
  'Gas':[
    'Astatine',
    'Chlorine',
    'Fluorine',
    'Hydrogen',
    'Iodine',
  ],
  'Mineral':[
    'Beryl',
    'Corundum',
    'Diamond',
    'Laranite',
    'Quartz',
  ],
  'Medical Supply':[
    'Medical Supplies',
  ],  
  'Food':[
    'Processed Food',
  ],
  'Scrap':[
    'Scrap',
  ],
  'Waste':[
    'Waste',
  ],
}

async function processResponse(filepath, response) {
  console.log('filepath', filepath);
  //console.log('response', response);

  const fullTextAnnotation = response.fullTextAnnotation;
  //console.log('fullTextAnnotation', fullTextAnnotation);

  const outputFilepath = filepath.split('.').slice(0, -1).join('.') + '.json';
  console.log('outputFilepath', outputFilepath);

  const pages = [];
  fullTextAnnotation.pages.forEach(page => {
    const blocks = [];
    page.blocks.forEach(block => {
      const paragraphs = [];
      //console.log('block', block);
      block.paragraphs.forEach(paragraph => {
        const words = [];
        //console.log('paragraph', paragraph);
        paragraph.words.forEach(word => {
          const wordText = word.symbols.map(s => s.text).join('');
          //console.log('wordText', wordText);
          words.push(wordText);
        });
        paragraphs.push(words);
      });
      blocks.push(paragraphs);
    });
    pages.push(blocks);
  });

  fs.writeFileSync(outputFilepath, JSON.stringify({ pages: pages }, null, 2));
}

async function main(inputDir) {
  const files = await readdir(inputDir);

  const imageFilesToProcess = (
    await Promise.all(
      files.map(async file => {
        const filename = path.join(inputDir, file);
        const stats = await stat(filename);
        if (stats.isDirectory()) {
          return;
        }
        if (path.extname(filename) != '.jpg') {
          return;
        }
        return filename;
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

main('./samples/');
