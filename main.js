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
            fs.stat(inputImagePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting file stats: ${err}`);
                    return;
                }
                if (stats.size > 44 * 1024 * 1024) { // 44 megabytes
                    scaleImage(inputImagePath, outputImagePath, scaleFactor);
                } else {
                    console.log(`Skipping ${file} as it is smaller than 44MB`);
                }
            });
        });
    });
}

function getScaleFactor(scaleFactor) {
    const factor = parseFloat(scaleFactor);
    if (isNaN(factor) || factor <= 0) {
        throw new Error("Invalid scale factor. It must be a positive number.");
    }
    return factor;
}

if (process.argv.length !== 5) {
    console.log("Usage: node main.js <input_directory> <output_directory> <scale_factor>");
    console.log("scale_factor: positive number for scaling factor");
} else {
    const inputDir = process.argv[2];
    const outputDir = process.argv[3];
    const scaleFactor = process.argv[4];
    try {
        const factor = getScaleFactor(scaleFactor);
        scaleImagesInDirectory(inputDir, outputDir, factor);
    } catch (err) {
        console.error(err.message);
    }
}