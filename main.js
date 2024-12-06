const sharp = require('sharp');
const process = require('process');
const fs = require('fs');
const path = require('path');

function scaleImage(inputImagePath, outputImagePath, scaleFactor) {
    sharp(inputImagePath)
        .metadata()
        .then(metadata => {
            const width = Math.round(metadata.width * scaleFactor);
            const height = Math.round(metadata.height * scaleFactor);
            return sharp(inputImagePath)
                .resize(width, height)
                .toFile(outputImagePath);
        })
        .then(() => {
            console.log(`Image saved to ${outputImagePath}`);
        })
        .catch(err => {
            console.error(err);
        });
}

function scaleImagesInDirectory(inputDir, outputDir, scaleFactor) {
    fs.readdir(inputDir, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err}`);
            return;
        }
        files.forEach(file => {
            const inputImagePath = path.join(inputDir, file);
            const outputImagePath = path.join(outputDir, file);
            scaleImage(inputImagePath, outputImagePath, scaleFactor);
        });
    });
}

if (process.argv.length !== 5) {
    console.log("Usage: node main.js <input_directory> <output_directory> <scale_factor>");
} else {
    const inputDir = process.argv[2];
    const outputDir = process.argv[3];
    const scaleFactor = parseFloat(process.argv[4]);
    scaleImagesInDirectory(inputDir, outputDir, scaleFactor);
}