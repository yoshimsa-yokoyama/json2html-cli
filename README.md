# @asamihsoy/json2html

## Install and usage

``` bash
npm i -D @asamihsoy/json2html
npx json2html ./path/to/data/json/ -t ./path/to/_template.pug -o ./path/to/output/directory/
```

## Options

|flag|required|description                                                                                                                                                            |
|----|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`-o`|◯       |Directory to output completed HTML files. You can set javascript file to customize output location by each HTML files. See "How to customize output location" section below.|
|`-t`|◯       |Template pug file to bind data with.                                                                                                                                   |
|`-d`|        |Single JSON file or directory contains json files. Parsed objects can be accessed under "data" variable.                                                               |

## How to customize output location

By setting javascript file to `-o` option, you can customize HTML file output location.
Javascript file for customize is something like this:

#### outputFunc.js
``` javascript
const fs = require('fs');
const mkdirp = require('mkdirp');

const cb = err => {
  if (err) console.log(err);
};

// export function for customize
// obj ... original data passed via json2html command
// html ... completed HTML string to save
module.exports = function outputFunc (obj,html) {

  // sample: get pid from original data
  const id = obj.pid

  // create output directory with id
  mkdirp.sync(`./path/to/output/directory/${id}/`)

  // write file to the directory
  fs.writeFileSync(
    `./path/to/output/directory/${id}/index.html`,
    html,
    cb
  )
}
```

then execute json2html command by setting outputFunc.js to `-o` option :

``` bash
npx json2html ./path/to/data/json/ -t ./path/to/_template.pug -o ./path/to/outputFunc.js
```
