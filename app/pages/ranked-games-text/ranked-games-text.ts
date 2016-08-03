import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { List } from '../../list.class';
import * as _ from 'lodash'

/*
  Generated class for the RankedGamesTextPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/ranked-games-text/ranked-games-text.html',
  directives: []
})
export class RankedGamesTextPage {
  list: List;
  reverse: boolean;
  games: any[];
  mode: string = 'html';
  constructor(private nav: NavController, private params: NavParams) {
    this.list = params.get('list');
    this.mode = 'html';
    this.reverse = false;
    this.games = this.list.rankedSet;
  }


  ratingColor(game){
    let score = game.rating / 10;
    let r = this.getHexStr((1 - score) * 255 - 75);
    let g = this.getHexStr(score * 255 - 75);
    let b = this.getHexStr(50);
    let hex =  '#' + r + g + b;
    return hex;
  }

  showRating(game){
    let hex = this.ratingColor(game);
    let string = '\<span style="background-color: ' + hex + '"\>' + game.rating.toFixed(2) + '\</span\>'
    return string;

  }

  reverseGames(games){
    this.reverse = !this.reverse;
    this.games = _.reverse(games);
    return this.reverse;
  }

  getHexStr(n){
    let str = Math.round(n).toString(16);
    if(str.length < 2){
      return "0"+str;
    }
    return str;
  }

  getImageID(game){
    let arr = game.image.split('/');
    let str = _.last(arr).toString();
    console.log(str);
    return str.substr(3, str.length - 7);
  }
}
