/** 
 * run chromium for data extract - useful when you can't sign in otherwise (two factor auth etc)
 * You should run chromium with debugging port open, e.g.: 
 * C:\ProgramData\chocolatey\bin\chrome.exe --remote-debugging-port=9222
 * Then send e.g. {uri: 'http://someUrl/data.json'} to require('./puppet')({})
 * returns a promise of data (as text - run JSON.parse on it as necessary)
 */

const puppeteer = require('puppeteer');

/*const puppeteerOptions = {
  browserURL: 'http://localhost:9222',
};*/

let browser; 
module.exports = ({
  waitOptions= {
    waitUntil:'networkidle2', 
    timeout: 60 *1000,
  },
  puppeteerOptions = {
    browserURL: 'http://localhost:9222',
  },
  networkEnableOptions = {
    maxResourceBufferSize: 1024 * 1204 * 100,
    maxTotalBufferSize: 1024 * 1204 * 200,
  },
  extraHttpHeaders = {
    'prefer':'odata.include-annotations=*'
  }
}={}) => {
  
  return async ({
    uri,     // =defaultUri
  }={}) => {
    browser = browser || await puppeteer.connect(puppeteerOptions); 
    return new Promise(async(resolve,reject)=>{
      //const browser = await puppeteer.launch(opts2) 
      const page = await browser.newPage();
      page.setExtraHTTPHeaders(extraHttpHeaders);
      await page._client.send('Network.enable', networkEnableOptions);
      page.on('response', async response => {
        //console.log('Chromium got response', response._url);
        //const data = await response.json();     // this is parsed json
        resolve(response.text());
        //await page.close();
        //fs.writeFileSync(`${__dirname}/output/response.json`, data)
      })
      try{
        await page.goto(uri, waitOptions);
      } catch(e){
        console.error("page goto",e);
      }
      await page.close();
      //await browser.disconnect(); // don't want to close to preserve cookie. Could prob do this 
      //await browser.close();
    })
  }
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