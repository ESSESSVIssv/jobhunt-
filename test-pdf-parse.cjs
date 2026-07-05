const fs = require('fs');
const pdf = require('pdf-parse');
async function test() {
  try {
    const dataBuffer = fs.readFileSync('package.json'); // Just to see if pdf-parse crashes
    const data = await pdf(dataBuffer);
    console.log(data.text);
  } catch(e) {
    console.log('error', e.message);
  }
}
test();
