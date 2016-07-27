import { Injectable } from '@angular/core';
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
    this.createDesignDoc();
    if(this.games.length < 1){
      this.getAll();
    }
  }

  createDesignDoc(){
    var ddoc = {
    _id: '_design/my_index',
    views: {
      by_name: {
        map: function (doc) { emit(doc.game.name); }.toString()
      },
      by_filtered: {
        map: function (doc) { emit(doc.game.filtered); }.toString()
        }
      }
    }

    this.games_db.put(ddoc).then(function() {
        this.games_db.query('my_index/by_name', {
        limit: 0 // don't return any results
      }).then(function (res) {
        // index was built!
      }).catch(function (err) {
        // some error
      });
    }).catch(err => {
      // error adding design doc
    });
  }

  getAll() {
    return new Observable(obs => {
      this.games_db.allDocs({
          include_docs: true
      }).then(response => {
        // should map each row's game into array for game
        obs.next('LOADING ' + response.total_rows + ' GAMES');
        let arr = [];
         _.forEach(response.rows, row => {
          if(!row['key'].includes('g_')){
            return;
          }
          return arr.push(row['doc'].game);
        });
        this.games = arr;
        obs.complete();
      }).catch(error => {
        obs.error(error);
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
        obs.next('Inserted ' + game,name+ '.');
      }).catch(error => {
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
          observer.next(error);
        }
        this.games_db.remove(doc)
          .then(response => observer.complete()
          .catch(error => observer.next(error)));
      })
    })
  }

  purge(){
    return new Observable(obs => {
      obs.next('PURGING DB');
      this.games_db.destroy().then(
      result => {
        obs.next(result);
        obs.complete();
      })
    });
  }

  getFiltered(value: boolean = true){
    return this.games_db.query('by_filtered', {key: value});
  }

  filterSet(inSet, outSet){
    return this.getFiltered().then(result => {
      console.log(result);
      let unfilter = _.map(_.filter(result.rows, doc => {
        return _.some(inSet, doc['game'].gameId);
      }), doc => {
        doc['game'].filtered = false;
        return doc;
      })
      this.getFiltered(false).then(result => {
        let filter = _.map(_.filter(result.rows, doc => {
          return _.some(outSet, doc['game'].gameId);
        }), doc => {
          doc['game'].filtered = true;
          return doc;
        });
        return this.games_db.bulkDocs(unfilter.concat(filter));
      }).catch(err => {
        // error
      });;
    }).catch(err => {
      // error
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
        }).catch(error => obs.error(error));
      }).catch(error => obs.error(error));
    });
  }
}
