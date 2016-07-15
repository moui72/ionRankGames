import { Injectable } from '@angular/core';
import { Storage, SqlStorage } from 'ionic-angular';
import { Game, WrappedGame } from '../../game.class';
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
    this.load();
  }

  load() {
    this.games_db = new PouchDB('rankGames_games');
    this.refresh();
  }

  refresh() {
    return new Observable(obs => {
      obs.next("REFRESHING GAMES");
      this.games_db.allDocs((error, response) => {
        if(error){
          obs.error(error);
          return false;
        }
        // should map each row's game into array for game
        let arr = [];
        var done = _.after(response.rows.length, (game) => {
          obs.next("FETCHING COMPLETE -> " + response.rows.length + ' games.');
          this.games = arr;
          obs.complete();
        })
        _.forEach(response.rows, doc => {
          this.games_db.get(doc['id']).then((response) => {
            arr.push(response.game);
            done(response.game);
          }).catch(error => {
            obs.error(error);
          });
        });

        return true;
      })
    })
  }

  exists(game: Game){
    return this.games_db.get('g_' + game.gameId);
  }

  /**
   * insert: Inserts a game into db
   * @param  {[Game]} game    [game to add to db (uses gameId to identify)]
   * @return {[Observable]}   [game added, error if dupe]
   */
  insert(game: Game){
    let gameDoc: WrappedGame = {_id: 'g_' + game.gameId, game: game};
    return new Observable(obs => {
      this.games_db.put(gameDoc).then(result => {
        this.refresh().subscribe(
          msg => obs.next(msg),
          error => obs.error(error),
          () => obs.complete()
        )
      }).error(error => {
        obs.error(error);
      })
    })
  }

  /**
   * drop: Drops a game from db
   * @param  {[Game]} game [game to by dropped (uses gameId to identify)]
   * @return {[type]}      [description]
   */
  drop(game: Game){
    return new Observable(observer => {
      // get game then remove game
      this.games_db.get('g_' + game.gameId, (error, doc) => {
        if(error){
          return console.log(error);
        }
        this.games_db.remove(doc);
      })
    })
  }

  purge(){
    return new Observable(observer => {
      observer.next('PURGING DB');
      this.games_db.destroy().then(
      result => {
        observer.next("PURGED");
        this.load();
        observer.complete();
      })
    });
  }

  updateGame(game: Game, column: string, value: boolean){
    return new Observable(obs => {
      this.exists(game).then((doc) => {
        doc.game[column] = value;
        this.games_db.put(doc).then(response => {
          obs.next('UPDATED ' + doc.game.name + ' IN DB -> ' +
           column + ' = ' + doc.game[column] + '(intended ' + value + ')');
          obs.complete();
        })
      }, error => obs.error(error));
    });
  }
}
