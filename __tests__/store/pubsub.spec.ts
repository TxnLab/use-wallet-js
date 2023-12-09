import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { PubSub } from 'src/store/pubsub'

describe('PubSub', () => {
  let pubSub: PubSub

  beforeEach(() => {
    pubSub = new PubSub()
  })

  it('should call all callbacks subscribed to an event when it is published', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const event = 'testEvent'
    const data = { key: 'value' }

    pubSub.subscribe(event, callback1)
    pubSub.subscribe(event, callback2)
    pubSub.publish(event, data)

    expect(callback1).toHaveBeenCalledWith(data)
    expect(callback2).toHaveBeenCalledWith(data)
  })

  it('should not call callbacks subscribed to different events', () => {
    const callback1 = jest.fn()
    const event1 = 'testEvent1'
    const event2 = 'testEvent2'
    const data = { key: 'value' }

    pubSub.subscribe(event1, callback1)
    pubSub.publish(event2, data)

    expect(callback1).not.toHaveBeenCalled()
  })

  it('should pass the correct data to callbacks when an event is published', () => {
    const callback = jest.fn()
    const event = 'testEvent'
    const data1 = { key: 'value1' }
    const data2 = { key: 'value2' }

    pubSub.subscribe(event, callback)
    pubSub.publish(event, data1)
    pubSub.publish(event, data2)

    expect(callback).toHaveBeenNthCalledWith(1, data1)
    expect(callback).toHaveBeenNthCalledWith(2, data2)
  })
})
