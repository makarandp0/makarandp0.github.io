export function getBooleanUrlParam(paramName, defaultValue) {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(paramName)) {
    const paramValue = urlParams.get(paramName);
    if (paramValue.length === 0) {
      // when url=www.foo.com?autoJoin&bar
      // urlParams.get('autoJoin') returns ''
      // ?autoJoin&foo should return autoJoin = true;
      return true;
    }

    if (!paramValue || paramValue.toLowerCase() === 'false') {
      return false;
    }

    return true;
  }
  return defaultValue;
}

