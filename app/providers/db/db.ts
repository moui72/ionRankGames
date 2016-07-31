import { Injectable } from '@angular/core';
import { Storage, SqlStorage } from 'ionic-angular';
import { Game, WrappedGame } from '../../game.class';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import * as PouchDB from 'pouchdb';

/*
  Database interface
  TODO: reimplement SqlStorage; fall back on PouchDB
*/

@Injectable()
export class Db {
  games: Array<any>;
  pgames: Array<any>;
  duped: Array<Game>;
  games_db: any;
  old_games_db: any;
  ionicSQL: boolean = true;

  constructor() {
    this.games = [];
    this.duped = [];
    this.load();
  }

  load() {
    this.makeDbWithLegacyCheck().subscribe(
      msg => {},
      error => {},
      () => {}
    );


  }

  createDesignDoc(){
    if(this.ionicSQL){
      console.log('createDesignDoc called but ionic storage enabled');
      return;
    }
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

  save(){
    return new Observable(obs => {
      if(this.ionicSQL){
        this.games_db.set('games', JSON.stringify(this.games));
        obs.next('saved');
        obs.complete();
      }else{
        throw new Error('db.save was called but ionicSQL is not available');
      }
    })
  }

  makeDbWithLegacyCheck(){
    return new Observable(obs => {
      try{
        this.games_db = new Storage(SqlStorage);
        obs.next('ionicSQL ready');
      }catch(e){
        if(e.message.includes('openDatabase')){
          obs.next('ionicSQL not available');
          this.ionicSQL = false;
          this.games_db = new PouchDB('rankGames_games');
          this.createDesignDoc();
          obs.complete();
          return; // using pouchDB
        }else{
          console.log('DB ERROR');
          obs.error(e);
        }
      }
      try{
        this.games_db.get('games').then(res => {
          if(res == undefined){
            this.old_games_db = new PouchDB('rankGames_games');
            this.getAll(true).subscribe(
              msg => obs.next(msg),
              err => obs.error(err),
              ()  => {
                this.games = this.pgames;
                this.save().subscribe(msg => obs.next(msg),
                  error => obs.error(error),
                  () => {
                    this.old_games_db.destroy((err, resp) => {
                      obs.next('legacy database destroyed');
                      delete this.pgames;
                      obs.complete();
                      return; // using ionicSQL, data from pouchDB recovered
                    })
                });
              }
            );
          }
        })
      }catch(e){
        this.games = [];
        this.save().subscribe(msg => obs.next(msg),
          error => obs.error(error),
          () => {
              obs.next('new ionicSQL database created and ready');
              obs.complete();
              return; // using ionicSQL, no data from pouchDB recovered
        });
      }
    })
  }

  getAll(xpouch: boolean = false) {
    // ionic db preferred
    // xpouch means we're upgrading old data
    if(this.ionicSQL && !xpouch){
      return new Observable(obs => {
        this.games_db.get('games').then((txObj) => {
          if(txObj == undefined){
            obs.next('no data');
            this.games = [];
            obs.complete();
            return this.games;
          }
          try{
            let res = JSON.parse(txObj);
            this.games = res;
            obs.next('success: loaded ' + this.games.length + ' games');
            obs.complete();
            return this.games;
          }catch(e){
            obs.next('bad data');
            this.games = [];
            obs.complete();
            return this.games;
          }
        }).catch(err => {
          console.log(err);
        });
      })
    }
    // pouch DB fallback
    return new Observable(obs => {
      let db = this.games_db;
      if(xpouch){
        db = this.old_games_db;
      }
      db.allDocs({
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
        if(xpouch){
          this.pgames = arr;
          return obs.complete();
        }
        this.games = arr;
        return obs.complete();
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
    if(this.ionicSQL){
      this.games.push(game);
      return this.save();
    }
    let gameDoc: WrappedGame = {_id: 'g_' + game.gameId, game: game};
    return new Observable(obs => {
      this.games_db.put(gameDoc).then(result => {
        obs.next('Inserted ' + game.name+ '.');
      }).catch(error => {
        obs.error(error);
      })
    })
  }

  addSet(games: Game[]){
    if(this.ionicSQL){
      throw new Error('addSet was called but ionicSQL is available');
    }
    return new Observable(obs => {
      let gameDocs = _.map(games, game => {
        let gameDoc: WrappedGame = {_id: 'g_' + game.gameId, game: game};
        return gameDoc;
      });
      obs.next('adding ' + gameDocs.length + ' games to db');
      this.games_db.bulkDocs(gameDocs, (err, res) => {
        if(err){
          obs.error(err);
        }
        obs.next(res);
        obs.complete();
      })
    })

  }

  /**
   * drop: Drops a game from db
   * @param  {[Game]} game [game to drop (uses gameId to identify)]
   * @return {[type]}      [description]
   */
  drop(game: Game){
    if(this.ionicSQL){
      return new Observable(obs => {
        let delgame = _.remove(this.games, delgame => {
          return delgame.gameId == game.gameId;
        });
        if(delgame){
          obs.next('deleted ' + delgame['name'] + '.');
        }else{
          obs.next(game.name + ' not found.')
        }
        this.save().subscribe(msg => {
          obs.next(msg);
        }, error => {
          obs.error(error);
        }, () => {
          obs.complete()
        })
      })
    }
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
    if(this.ionicSQL){
      return new Observable(obs => {
        this.games_db.clear().then(r => {
          obs.next('db cleared');
          obs.complete();
        }).catch(e => {
          obs.error(e);
        })
      })
    }
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

  filterSet(inSet, outSet?){
    if(this.ionicSQL){
      return new Promise((resolve, reject) => {
        let arr = _.map(this.games, game => {
          if(_.some(inSet, inGame => {
            return inGame['gameId'] == game.gameId;
          })){
            game.filtered = false;
          }else{
            game.filtered = true;
          }
        })
        this.games = arr;
        resolve(this.save());
      })
    }
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

  putGame(game: Game){
    return new Observable(obs => {
      this.exists(game).then((doc) => {
        doc.game = game;
        this.games_db.put(doc).then(response => {
          obs.next('UPDATED ' + doc.game.name);
          obs.complete();
        }).catch(error => obs.error(error));
      }).catch(error => obs.error(error));
    });
  }
}
