/* eslint-disable no-console */
global.caseCount = 1;
global.passedCount = 0;
global.failedCount = 0;

/**
 * 这里本来是想用Mocha的那个测试库，上周试了下，在使用async/await的时候一直报error：
 * Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called;
 * 在网上也试了挺多方法，依然会报这个error，然后我就不用这个库了，自己重新写了describe和it这两个方法。
 *  */
async function describe(title, callback) {
  console.log(title);
  global.caseCount = 1;
  await callback();
  if (global.passedCount) console.log('Passed Count: ', global.passedCount);
  if (global.failedCount) console.log('Failed Count: ', global.failedCount);
}

async function it(title, callback) {
  console.log('\t', `#Case ${global.caseCount}: ${title}`);
  try {
    await callback();
    console.log('\t\tPassed');
    global.passedCount += 1;
  } catch (error) {
    console.log('\t\tFailed');
    global.failedCount += 1;
  }

  global.caseCount += 1;
}

module.exports = {
  describe,
  it,
};
