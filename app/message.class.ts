export class Message{
  text: string;
  type: string;
  displayType: string;
  timestamp: number;

  constructor(text: string, type: string = 'error', timestamp: number = 0){
    if (timestamp === 0) {
      this.timestamp = Date.now();
    }
    this.text = text || 'no message.';
    this.type = type;
    this.displayType = this.type;

    if (type == 'toast') {
      this.displayType = 'message';
    }
  }
}
