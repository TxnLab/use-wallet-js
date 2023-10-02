type CallbackFunction = (data: unknown) => void

export class PubSub {
  private events: Map<string, CallbackFunction[]>

  constructor() {
    this.events = new Map()
  }

  subscribe(event: string, callback: CallbackFunction): number {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const callbacks = this.events.get(event)!
    callbacks.push(callback)
    this.events.set(event, callbacks)

    return callbacks.length
  }

  publish(event: string, data: any = {}): CallbackFunction[] {
    if (!this.events.has(event)) {
      return []
    }

    const callbacks = this.events.get(event)!
    for (const callback of callbacks) {
      callback(data)
    }

    return callbacks
  }
}
