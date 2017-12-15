import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Message } from '../../../message.class';

@Component({
  templateUrl: 'build/components/modals/message-log/message-log.html',
})
export class MessageLog {
  messages: any[];
  display: string = 'all';

  constructor(private nav: NavController, private params: NavParams) {
    this.messages = params.get('messages');
  }

  isTrue(expression){
    // check for string/bool true/'true'
    return expression == true || expression == 'true';
  }
  close(){
    this.nav.pop();
  }

}
