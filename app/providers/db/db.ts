import { Injectable } from '@angular/core';
import { Storage, SqlStorage } from 'ionic-angular';
import { Game } from '../../game.class';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import * as PouchDB from 'pouchdb';

/*
  Database interface
*/

@Injectable()
export class Db {
  games: Array<any>;
  duped: Array<Game>;
  added: number;
  games_db: any;

  constructor() {
    this.added = 0;
    this.games = [];
    this.duped = [];

  }

  load() {
    this.games_db = new PouchDB('rankGames_games');
  }

  refresh() {
    return new Observable(obs => {
      obs.next("REFRESHING GAMES");
      this.games_db.allDocs((error, response) => {
        if(error){
          obs.error(error);
        }
        console.log(response);
        this.games = response.rows;
        obs.complete();
      })
    })
  }

  exists(game: Game){
    return this.games_db.get(game.gameId);
  }

  /**
   * insert: Inserts a game into db
   * @param  {[Game]} game    [game to add to db (uses gameId to identify)]
   * @return {[Observable]}   [game added, error if dupe]
   */
  insert(game: Game, refresh: boolean = true){
    let gameDoc = {_id: game.gameId, game: game};
    return new Observable(obs => {
      this.exists(game).then((error, response) => {
        this.games_db.put(gameDoc).then(result => {
          console.log(result);
          obs.complete();
        }).error(error => {
          obs.error(error)
        });
        }, error => {
          obs.error(error);
        });
      });
  }

  /**
   * drop: Drops a game from db
   * @param  {[Game]} game [game to by dropped (uses gameId to identify)]
   * @return {[type]}      [description]
   */
  drop(game: Game){
    return new Observable(observer => {
      // get game then remove game
    })
  }

  purge(){
    return new Observable(observer => {
      observer.next('PURGING DB');
      this.games_db.destroy().then(
      result => {
        observer.next("PURGED");
        observer.complete();
      })
    });
  }

  updateGame(game: Game, column: string, value: boolean){
    return new Observable(obs => {
      this.exists(game).then((error, result) => {
        // put game (include _rev)
        obs.next('UPDATED ' + game.name + ' IN DB -> ' +
         column + ' = ' + value);
        obs.complete();
      }, error => obs.error(error));
    });
  }
}
