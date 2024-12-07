const sharp = require("sharp");
const process = require("process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const async = require("async");

function scaleImage(inputImagePath, outputImagePath, scaleFactor, convertToJpg) {
    sharp(inputImagePath)
        .metadata()
        .then((metadata) => {
            const width = Math.round(metadata.width * scaleFactor);
            const height = Math.round(metadata.height * scaleFactor);
            let transformer = sharp(inputImagePath).resize(width, height);
            if (convertToJpg) {
                transformer = transformer.jpeg({ quality: 100 });
                outputImagePath = outputImagePath.replace(path.extname(outputImagePath), '.jpg');
            }
            return transformer.toBuffer()
                .then((data) => {
                    fs.writeFile(outputImagePath, data, (err) => {
                        if (err) {
                            console.error(`❌ Error saving file: ${err}`);
                            return;
                        }
                        fs.stat(outputImagePath, (err, stats) => {
                            if (err) {
                                console.error(`❌ Error getting new file stats: ${err}`);
                                return;
                            }
                            const newSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                            // console.log(`✅ Image saved to ${outputImagePath}`);
                            console.log(`📏 New size: ${newSizeMB} MB`);
                            if (stats.size > 44 * 1024 * 1024) {
                                console.log(`🔄 Rescaling ${outputImagePath} as it is still larger than 45MB`);
                                scaleImage(outputImagePath, outputImagePath, scaleFactor, convertToJpg);
                            }
                        });
                    });
                });
        })
        .catch((err) => {
            console.error(`❌ ${err}`);
        });
}

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
                fs.stat(inputImagePath, (err, stats) => {
                    if (err) {
                        console.error(`❌ Error getting file stats: ${err}`);
                        callback(err);
                        return;
                    }
                    if (stats.size > 44 * 1024 * 1024) {
                        // 45 megabytes
                        scaleImage(
                            inputImagePath,
                            outputImagePath,
                            scaleFactor,
                            convertToJpg
                        );
                    } else {
                        // console.log(`Skipping ${file} as it is smaller than 44MB`);
                    }
                    callback();
                });
            },
            (err) => {
                if (err) {
                    console.error(`❌ Error processing files: ${err}`);
                } else {
                    console.log('✅ All files processed.');
                }
            }
        );
    });
}

function getScaleFactor(scaleFactor) {
    const factor = parseFloat(scaleFactor);
    if (isNaN(factor) || factor <= 0) {
        throw new Error("❌ Invalid scale factor. It must be a positive number.");
    }
    return factor;
}

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
