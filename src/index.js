const defaults = require('./defaultOptions');
const sortObject = require('sort-object-keys');
const sortScripts = require('./sort-scripts');
const sortUsers = require('./sort-contributors');
const sortFiles = require('./sort-files');

function stringify(object, options) {
  const space = options.useTabs ? '\t' : Array(options.tabWidth+1).join(' ');

  const stringifiedSections = Object.keys(object)
    .filter( sectionName => object[sectionName] )
    .map( sectionName => {

      let sectionStartedByNewLine = false
      let sectionData = JSON
        .stringify(object[sectionName], null, space)
        .split('\n')
        .reduce((str, line, i, allLines) => {
          const originalLine = line
          if( sectionName === "scripts" ) {
            const newLineSpace = space// + space

            line = line.replace(/^\s*"\\n/, `\n${newLineSpace}"\\n`)
            if( i == 1 && originalLine !== line ) sectionStartedByNewLine = true
            
            line = line.replace(/": "\\r/, `":\n${newLineSpace}"\\r`)
           
            if( i == (allLines.length - 1) && sectionStartedByNewLine ) line = `\n${space}${line}`

          }
          return `${str}${i?'\n'+space:''}${line}`
        }, '')
        
      return `${space}"${sectionName}": ${sectionData}`
    } )

  return `{\n${stringifiedSections.join(',\n')}\n}\n`
}

function format(packageJson, opts) {
  const options = Object.assign({}, defaults, opts);

  const json = Object.assign(
    {},
    packageJson,
    sortUsers('author', packageJson, opts),
    sortUsers('maintainers', packageJson, Object.assign({}, opts, { enforceMultiple: true })),
    sortUsers('contributors', packageJson, Object.assign({}, opts, { enforceMultiple: true })),
    sort('man', packageJson),
    sort('bin', packageJson),
    sortFiles(packageJson),
    sort('directories', packageJson),
    sortScripts(packageJson.scripts, options.scriptsKeyOrder),
    sort('config', packageJson),
    sort('optionalDependencies', packageJson),
    sort('dependencies', packageJson),
    sort('bundleDependencies', packageJson),
    sort('bundledDependencies', packageJson),
    sort('peerDependencies', packageJson),
    sort('devDependencies', packageJson),
    sort('keywords', packageJson),
    sort('engines', packageJson),
    sort('os', packageJson),
    sort('cpu', packageJson),
    sort('publishConfig', packageJson)
  );

  return stringify(sortObject(json, options.keyOrder), options);
}

function check(packageJson, opts) {
  try {
    const options = Object.assign({}, defaults, opts);
    const isString = typeof packageJson === 'string';
    const object = isString ? JSON.parse(packageJson) : packageJson;
    const original = isString ? packageJson : stringify(object, options);
    const formatted = format(object, options);
    return stringify(object, options) === formatted;
  } catch(e) {
    return false;
  }
}

function sort(key, packageJson) {
  const input = packageJson[key] || {};
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return {};
    } else {
      return { [key]: input.sort() };
    }
  } else if (typeof input === 'object') {
    const keys = Object.keys(input);
    if (keys.length === 0) {
      return {};
    } else {
      return { [key]: sortObject(input, keys.sort()) };
    }
  } else {
    return {};
  }
}

module.exports = {
  format,
  check
};
