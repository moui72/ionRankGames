import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import * as _ from 'lodash';
import { Game } from '../../game.class';

/*
  Generated class for the MyData provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

@Injectable()
export class MyData {
  games: Array<Game>;

  constructor(private http: Http) {
    this.games = [];
  }

  add(game){
    if(_.some(this.games, {'id': game.id})){
      return false;
    }
    this.games.push(game);
    return true;
  }

}
