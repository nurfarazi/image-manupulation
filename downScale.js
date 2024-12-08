const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Get the scaling factor and folder paths from command-line arguments
const inputFolder = process.argv[2];
const outputFolder = process.argv[3];
const scaleFactor = parseFloat(process.argv[4]);

if (isNaN(scaleFactor) || scaleFactor <= 0) {
    console.error('Please provide a valid scaling factor greater than 0.');
    process.exit(1);
}

if (!inputFolder || !outputFolder) {
    console.error('Please provide both input and output folder paths.');
    process.exit(1);
}

// Check if input folder exists
if (!fs.existsSync(inputFolder)) {
    console.error('Input folder does not exist.');
    process.exit(1);
}

// Create output folder if it does not exist
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// Process each image in the input folder
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Error reading input folder:', err);
        process.exit(1);
    }

    files.forEach(file => {
        const inputFilePath = path.join(inputFolder, file);
        const outputFilePath = path.join(outputFolder, file);

        // Check if the file is an image
        if (path.extname(file).match(/\.(jpg|jpeg|png|webp|tiff|gif|svg)$/i)) {
            sharp(inputFilePath)
                .metadata()
                .then(metadata => {
                    const width = Math.round(metadata.width * scaleFactor);
                    const height = Math.round(metadata.height * scaleFactor);
                    return sharp(inputFilePath)
                        .resize(width, height)
                        .toFile(outputFilePath);
                })
                .then(() => {
                    console.log(`Image ${file} downscaled by a factor of ${scaleFactor} and saved to ${outputFilePath}`);
                })
                .catch(err => {
                    console.error(`Error processing image ${file}:`, err);
                });
        }
    });
});
