/** 
 * run chromium for data extract - useful when you can't sign in otherwise (two factor auth etc)
 * You should run this: 
 * C:\ProgramData\chocolatey\bin\chrome.exe --remote-debugging-port=9222
 * Then send e.g. {uri: 'http://someUrl/data.json'} to require('./puppet').getData({})
 * getData returns a promise of data (as text - run JSON.parse on it as necessary)
 */

const puppeteer = require('puppeteer');


const getData = ({
  waitOptions= {
    waitUntil:'networkidle0', 
    timeout: 0,
  },
  puppeteerOptions = {
    browserURL: 'http://localhost:9222',
  } 
}={}) => ({
  uri,     // =defaultUri
}={}) => new Promise(async(resolve,reject)=>{
  //const browser = await puppeteer.launch(opts2) 
  const browser = await puppeteer.connect(puppeteerOptions); 
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({'prefer':'odata.include-annotations=*'});
  await page._client.send('Network.enable', {
    maxResourceBufferSize: 1024 * 1204 * 100,
    maxTotalBufferSize: 1024 * 1204 * 200,
  });
  page.on('response', async response => {
    console.log('Chromium got response', response._url);
    //const data = await response.json();     // this is parsed json
    resolve(response.text());
    //fs.writeFileSync(`${__dirname}/output/response.json`, data)
  })
  await page.goto(uri, waitOptions);
  await page.close();
  await browser.disconnect(); // don't want to close to preserve cookie. Could prob do this 
  //await browser.close();
});

module.exports = {
    getData
};


/*
const width = 1400, height=1000;
const options = {
	headless:true,
	devtools:false,
    args: [
      `--window-size=${ width },${ height }`
	    ,'--disable-infobars'
    ],
};
const opts2 = {
  headless: false,
  //executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  executablePath: 'C:/portable/chromium/bin/chrome.exe',
  args: ['--user-data-dir=C:/portable/chromium/profile']
} 
*/