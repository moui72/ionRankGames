import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';

/*
  Generated class for the GameDetailPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/game-detail/game-detail.html',
})
export class GameDetailPage {
  game: Game;
  constructor(private nav: NavController, private params: NavParams) {
    this.game = params.get('game');
  }
  isOut(){
    return this.isTrue(this.game.filtered) || this.isTrue(this.game.trash);
  }
  isTrue(expression){
    // check for string/bool true/'true'
    return expression == true || expression == 'true';
  }
  close(){
    this.nav.pop();
  }

}
