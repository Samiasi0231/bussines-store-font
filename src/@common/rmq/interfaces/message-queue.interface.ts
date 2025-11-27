export interface IMessageQueue {
  publish(queue: string, message: any): Promise<void>;
  subscribe(
    queue: string,
    handler: (message: any) => Promise<void> | void,
  ): Promise<void>;
  unsubscribe(queue: string): Promise<void>;
}

