import AsyncIterationBuffer from 'async-iteration-buffer';

export function afterTasks() {
  return new Promise(r => setTimeout(r));
}

export function asyncList(...args) {
  let buffer = new AsyncIterationBuffer();
  for (let x of args) {
    buffer.next(x);
  }
  return buffer;
}

export { AsyncIterationBuffer };
