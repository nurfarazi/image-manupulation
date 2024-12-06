# Image Manipulation

This project allows you to scale and convert images in a directory using the `sharp` library.

## Installation

1. Clone the repository:
    ```sh
    git clone <repository_url>
    cd image-manipulation
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

## Usage

To scale and convert images in a directory, run the following command:
```sh
node main.js <input_directory> <output_directory> <scale_factor> <output_format>


node main.js input output 0.5 jpg