import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Game } from '../../game.class';
import { GameCard } from '../../components/game/game';

/*
  Generated class for the RankPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/rank/rank.html',
})
export class RankPage {

  games: Array<Game>

  constructor(private nav: NavController) {

  }

}
