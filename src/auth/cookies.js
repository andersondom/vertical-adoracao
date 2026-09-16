export function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(";")
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => {
        const index = value.indexOf("=");
        return [
          value.slice(0, index),
          decodeURIComponent(value.slice(index + 1))
        ];
      })
  );
}
