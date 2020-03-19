// git log --max-count=2 --skip=5

const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = ({
  // no config at moment
}={}) => async ({
  cmd       // again for consistency ... might want to include arbitrary items 
}) => {
  try {
    const { stdout, stderr } = await exec(cmd);
    if (stderr){console.error('stderr:', stderr);}
    return stdout;
    //console.log('stdout:', stdout);

  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
  } 
};