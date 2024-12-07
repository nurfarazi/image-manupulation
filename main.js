const sharp = require("sharp");
const process = require("process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const async = require("async");

const SIZE_LIMIT_MB = 44; // Size limit in megabytes

let skippedCount = 0;
let processedCount = 0;

// Function to scale an image
function scaleImage(inputImagePath, outputImagePath, scaleFactor, convertToJpg) {
    sharp(inputImagePath)
        .metadata()
        .then((metadata) => {
            const { width, height } = getNewDimensions(metadata, scaleFactor);
            let transformer = sharp(inputImagePath).resize(width, height);
            if (convertToJpg) {
                transformer = transformer.jpeg({ quality: 100 });
                outputImagePath = changeExtensionToJpg(outputImagePath);
            }
            return saveTransformedImage(transformer, outputImagePath, scaleFactor, convertToJpg);
        })
        .catch((err) => {
            console.error(`❌ ${err}`);
        });
}

// Function to get new dimensions based on scale factor
function getNewDimensions(metadata, scaleFactor) {
    const width = Math.round(metadata.width * scaleFactor);
    const height = Math.round(metadata.height * scaleFactor);
    return { width, height };
}

// Function to change file extension to .jpg
function changeExtensionToJpg(filePath) {
    return filePath.replace(path.extname(filePath), '.jpg');
}

// Function to save the transformed image
function saveTransformedImage(transformer, outputImagePath, scaleFactor, convertToJpg) {
    return transformer.toBuffer()
        .then((data) => {
            fs.writeFile(outputImagePath, data, (err) => {
                if (err) {
                    console.error(`❌ Error saving file: ${err}`);
                    return;
                }
                checkFileSize(outputImagePath, scaleFactor, convertToJpg);
            });
        });
}

// Function to check the file size and rescale if necessary
function checkFileSize(outputImagePath, scaleFactor, convertToJpg) {
    fs.stat(outputImagePath, (err, stats) => {
        if (err) {
            console.error(`❌ Error getting new file stats: ${err}`);
            return;
        }
        const newSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📏 New size: ${newSizeMB} MB`);
        if (stats.size > SIZE_LIMIT_MB * 1024 * 1024) {
            scaleImage(outputImagePath, outputImagePath, scaleFactor, convertToJpg);
        } else {
            processedCount++;
        }
    });
}

// Function to convert an image to JPG
function convertImageToJpg(inputImagePath, outputImagePath) {
    const outputJpgPath = changeExtensionToJpg(outputImagePath);
    sharp(inputImagePath)
        .jpeg({ quality: 100 })
        .toFile(outputJpgPath, (err) => {
            if (err) {
                console.error(`❌ Error converting to JPG: ${err}`);
                return;
            }
            skippedCount++;
            console.log(`✅ Converted to JPG: ${outputJpgPath}`);
        });
}

// Function to scale images in a directory
function scaleImagesInDirectory(inputDir, outputDir, scaleFactor, convertToJpg) {
    const numCPUs = os.cpus().length;
    fs.readdir(inputDir, (err, files) => {
        if (err) {
            console.error(`❌ Error reading directory: ${err}`);
            return;
        }
        async.eachLimit(
            files,
            numCPUs,
            (file, callback) => {
                const inputImagePath = path.join(inputDir, file);
                const outputImagePath = path.join(outputDir, file);
                processFile(inputImagePath, outputImagePath, scaleFactor, convertToJpg, callback);
            },
            (err) => {
                if (err) {
                    console.error(`❌ Error processing files: ${err}`);
                } else {
                    logSummary(files.length);
                }
            }
        );
    });
}

// Function to process a single file
function processFile(inputImagePath, outputImagePath, scaleFactor, convertToJpg, callback) {
    fs.stat(inputImagePath, (err, stats) => {
        if (err) {
            console.error(`❌ Error getting file stats: ${err}`);
            callback(err);
            return;
        }
        if (stats.size > SIZE_LIMIT_MB * 1024 * 1024) {
            scaleImage(inputImagePath, outputImagePath, scaleFactor, convertToJpg);
        } else {
            convertImageToJpg(inputImagePath, outputImagePath);
        }
        callback();
    });
}

// Function to log the summary of processed and skipped files
function logSummary(totalFiles) {
    console.log('✅ All files processed.');
    console.log(`📊 Total files: ${totalFiles}`);
    console.log(`📊 Processed files: ${processedCount}`);
    console.log(`📊 Skipped files: ${skippedCount}`);
}

// Function to get the scale factor from the input
function getScaleFactor(scaleFactor) {
    const factor = parseFloat(scaleFactor);
    if (isNaN(factor) || factor <= 0) {
        throw new Error("❌ Invalid scale factor. It must be a positive number.");
    }
    return factor;
}

// Main script execution
if (process.argv.length !== 6) {
    console.log(
        "ℹ️ Usage: node main.js <input_directory> <output_directory> <scale_factor> <convert_to_jpg>"
    );
    console.log("ℹ️ scale_factor: positive number for scaling factor");
    console.log("ℹ️ convert_to_jpg: true or false");
} else {
    const inputDir = process.argv[2];
    const outputDir = process.argv[3];
    const scaleFactor = process.argv[4];
    const convertToJpg = process.argv[5].toLowerCase() === 'true';
    try {
        const factor = getScaleFactor(scaleFactor);
        scaleImagesInDirectory(inputDir, outputDir, factor, convertToJpg);
    } catch (err) {
        console.error(`❌ ${err.message}`);
    }
}
