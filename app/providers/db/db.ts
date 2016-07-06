import { Injectable } from '@angular/core';
import { Storage, SqlStorage } from 'ionic-angular';
import { Game } from '../../game.class';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

/*
  Generated class for the Db provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

@Injectable()
export class Db {
  storage: any;
  games: any;
  duped: Array<Game>;
  added: number;

  constructor() {
    this.storage = null;
    this.added = 0;
    this.games = [];
    this.duped = [];
  }

  load() {
    return new Observable(observer => {
      this.storage = new Storage(SqlStorage);
      // this.storage.query('DROP TABLE games');
      this.storage.query('CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, gameId TEXT, imgUrl TEXT)').then((data) => {
          observer.next("TABLE CREATED");
      }, (error) => {
          observer.error(error);
      });
      this.refresh().subscribe(
        resp => observer.next(resp),
        error => observer.error(error),
        () => observer.complete()
      );
    })
  }

  refresh() {
    return new Observable(observer => {
      observer.next("REFRESHING GAMES");
      this.storage.query('SELECT * FROM games').then((data) => {
        if(data.res.rows.length > 0) {
          // map to array
          this.games = _.values(data.res.rows);
          observer.next("LOADED GAMES -> " + this.games.length);
        } else {
          this.games = [];
          observer.next("DB EMPTY");
        }
        observer.next("DONE REFRESHING");
        observer.complete();
      });
    })
  }

  exists(game: Game){
    return this.storage.query('SELECT * FROM games WHERE' +
    ' gameId="'+game.gameId+'"');
  }

  /**
   * insert: Inserts a game into db
   * @param  {[Game]} game    [game to add to db (uses gameId to identify)]
   * @return {[Observable]}   [game added, error if dupe]
   */
  insert(game: Game, refresh: boolean = true){
    return new Observable(observer => {
      this.exists(game).then(data => {
        if(data.res.rows.length > 0){
          this.duped.push(game);
          observer.next('GAME IS DUPE');
          return observer.complete();
        }
        this.storage.query('INSERT INTO games(name, gameId, imgUrl)' +
        ' values("' + game.name + '","' + game.gameId + '","' + game.image + '") ').then(d => {
          // observer.next("INSERTED -> " + game.name + "["+game.gameId+"]");
          observer.complete();
        }, error => {
          observer.error(error);
        });
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
      observer.next("DROPPING GAME -> " + game.name);
      this.storage.query('DELETE FROM games WHERE gameId="'+game.gameId+'"').then((data) => {
        observer.next("GAME DROPPED");
        this.refresh().subscribe(
          resp => observer.next(resp),
          error => observer.error(error),
          () => observer.complete()
        );
        observer.complete();
      });
    })
  }

  purge(){
    return new Observable(observer => {
      observer.next('PURGING DB')
      this.storage.query('DELETE FROM games').then(
      result => {
        observer.next("PURGED -> " + result.res.rowsAffected);
        observer.complete();
      },
      error => {
        observer.error(error.err);
      });
    });
  }

}
