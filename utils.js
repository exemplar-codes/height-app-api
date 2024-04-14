export function roughSizeOfObject(object) {
  const objectList = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    switch (typeof value) {
      case "boolean":
        bytes += 4;
        break;
      case "string":
        bytes += value.length * 2;
        break;
      case "number":
        bytes += 8;
        break;
      case "object":
        if (!objectList.includes(value)) {
          objectList.push(value);
          for (const prop in value) {
            if (value.hasOwnProperty(prop)) {
              stack.push(value[prop]);
            }
          }
        }
        break;
    }
  }

  return bytes;
}

/**
 * Converts a space-separated string into camelCase.
 *
 * @param {string} inputStr - the input string to convert
 * @return {string} the camelCase version of the input string
 */
export function toCamelCase(inputStr) {
  if (!inputStr) return inputStr;

  const words = inputStr.split("_");

  // Capitalize the first letter of each word except the first one
  const camelCaseWords = [words[0].toLowerCase()].concat(
    words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  );

  // Concatenate the modified words to form the camelCase string
  const camelCaseOutput = camelCaseWords.join("");

  return camelCaseOutput;
}

export const waitForMilliseconds = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
