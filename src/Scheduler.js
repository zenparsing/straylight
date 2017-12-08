export class Scheduler {

  constructor(queueTask) {
    this._queueTask = queueTask;
    this._callbacks = [];
    this._scheduled = false;
  }

  enqueue(fn) {
    this._callbacks.push(fn);
    if (!this._scheduled) {
      this._scheduled = true;
      this._queueRun();
    }
  }

  _queueRun() {
    this._queueTask(() => this._run());
  }

  _run() {
    try {
      while (this._callbacks.length > 0) {
        this._callbacks.shift()();
      }
      this._scheduled = false;
    } catch (err) {
      this._queueRun();
      throw err;
    }
  }

}

export const immediate = new Scheduler(fn => fn());
