import words from "friendly-words";

export function randomId() {
  const { predicates, objects } = words;
  const predicate = predicates[Math.floor(Math.random() * predicates.length)];
  const object = objects[Math.floor(Math.random() * objects.length)];
  return `${predicate}-${object}`;
}
