import { Component, EventEmitter, Output } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Game } from '../../game.class';
import { Db } from '../../providers/db/db';

/*
  Generated class for the ViewtrashPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/viewtrash/viewtrash.html',
  providers: [Db],
  selector: "viewtrash"
})
export class ViewtrashPage {
  games: Array<Game>;
  @Output() onRestore = new EventEmitter<Game>();
  constructor(
    private nav: NavController,
    private params: NavParams
  ) {
    this.games = this.params.get('games');
  }

  restore(game){
    console.log("RESTORE GAME REQUEST")
    this.onRestore.emit(game);
  }

}
