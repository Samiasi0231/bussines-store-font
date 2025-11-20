import { Deserializer, IncomingEvent } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

export class RmqDeserializer implements Deserializer {
  private readonly logger = new Logger(RmqDeserializer.name);
  private pattern: string;

  /**
   * Set the pattern for this deserializer instance
   * @param pattern RabbitMQ queue name
   */
  setPattern(pattern: string) {
    this.pattern = pattern;
    this.logger.log(`Deserializer pattern set to: ${pattern}`);
  }

  deserialize(message: any): IncomingEvent | any {
    try {
      let parsedData: any;

      if (message?.content) {
        const contentString = message.content.toString();
        try {
          parsedData = JSON.parse(contentString);
        } catch (parseError) {
          throw new Error(
            `Failed to parse message content as JSON: ${contentString}`,
          );
        }
      } else if (typeof message === 'string') {
        try {
          parsedData = JSON.parse(message);
        } catch {
          parsedData = message;
        }
      } else if (Buffer.isBuffer(message)) {
        try {
          parsedData = JSON.parse(message.toString());
        } catch {
          parsedData = message.toString();
        }
      } else {
        parsedData = message;
      }

      if (this.pattern) {
        return {
          pattern: this.pattern,
          data: parsedData,
        };
      }

      this.logger.warn(
        `No pattern set for deserializer, returning parsed data as-is`,
      );
      return parsedData;
    } catch (error) {
      this.logger.error('Error deserializing message', error);
      return message;
    }
  }
}
