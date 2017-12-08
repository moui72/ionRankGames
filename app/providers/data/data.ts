import { Component } from '@angular/core';
import {
  Alert,
  ViewController,
  ActionSheet
} from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { BggOpts } from '../../bggopts.class';
import { Observable } from 'rxjs/Observable';
import { GameCard } from '../../components/game/game';

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: []
})

export class Data {

  /* TODO: comment each method */
  /* TODO: add game details display options */

  constructor(
    private db: Db,
    private bgg: BggData
  )
  {
    this.refresh().subscribe(msg => {}, error => {}, () => {
      this.ready = true;
    })
  }

  local: Storage;

  bggOpts: BggOpts;

  ready: boolean = false;

  fetchCount:   number = 0; // how many attempts have been made
  maxFetches:   number = 5; // max number of retries
  fetchThrottle: number = 250; // wait 250 ms between retries

  // the main data object
  games = [];

  // for tracking database updates
  updatingDB: boolean = false;
  dbUpdateProg: number = 0;

  /**
   * Evaluates expression (exp) accounting for either boolean or string
   * @param  {any} exp    should be a string or boolean
   * @return {boolean}    True if exp is true or 'true'; otherwise, false
   */
  isTrue(exp){
    // check for string/bool true/'true'
    return exp == true || exp == 'true';
  }

  /**
   * Returns the number of games currently filtered out or trashed.
   * @return {number} length of array containing all games with trash = true or filtered = true
   */
  out(){
    // returns number of games in trash or filtered out
    if(!this.games){
      return 0;
    }
    return _.filter(this.games, game => {
      return this.isTrue(game.trash) || this.isTrue(game.filtered);
    }).length;
  }

  /**
   * For each game in arr, changes value of filtered on that game to true if it
   * fails any check dictated by opts
   * @param  {Array<Game>} arr  Array of games to filter; usually all games
   * @param  {BggOpts}     opts Options determining the filter
   * @return {Observable}          emits 'mem' when filter complete in memory,
   *                               'db' when filter complete in database
   */
  filter(arr: Array<Game>, opts: BggOpts){
    return new Observable(obs => {

      // make sure there are actually games in arr
      if (arr.length < 1) {
        obs.error("CANNOT FILTER -> SET EMPTY");
        // no games, return false
      }

      let pool = _.reject(arr, game => {
        if(this.isTrue(opts.wishList) && this.isTrue(game.wishList) && !this.isTrue(game.owned)){
          // reject if game is wishList and rejecting wishList
          return true;
        }
        if(this.isTrue(opts.excludeExp) && this.isTrue(game.isExpansion)){
          // reject if excluding expansion AND this game is an expansion
          return true;
        }
        if(this.isTrue(opts.owned) && !this.isTrue(game.owned)){
          // excluding unowned AND this game is not owned
          return true;
        };
        if(this.isTrue(opts.played) && game.numPlays < 1){
          // reject if game not played and excluding unplayed
          return true;
        }
        if(game.numPlays > 0 && game.numPlays < opts.minplays){
          // reject if played and not enough plays
          return true;
        }

        if(this.isTrue(opts.rated) && game.rating < 0){
          // reject if unrated and excluding unrated
          return true;
        }

        if(game.rating > 0 && game.rating < opts.minrating){
          // reject if rated and rating too low
          return true;
        }

        // game is in!
        return false;
      })

      /*
        arr contains all games that passed through filter
        filtered gets set to array of all games not in arr
      */
      this.games = _.map(arr, game => {
        let inPool = _.some(pool, pGame => {
          return pGame.gameId == game.gameId;
        });
        if(inPool){
          game.filtered = false;
        }else{
          game.filtered = true;
        }
        return game;
      });
      obs.next('mem');
      if(this.db.ionicSQL){
        this.db.save().subscribe(msg => obs.next(msg), err => obs.err(err),
        () => {
          obs.complete();
        });
      }else{
        this.db.filterSet(pool, _.filter(this.games, g => {
          return g.filtered;
        })).then(() => {
          obs.complete();
        }).catch(e => {
          obs.error(e);
        })
      }
    });
  }

  /**
   * Updates database after a game has been trashed or restored.
   * @param  {Game} game      The game to save
   * @return {Obsvervable}    Either db.save() observable if ionSQL is
   *                          available, otherwise db.putGame() observable.
   */
    saveGame(game: Game){
      if(this.db.ionicSQL){
        return this.db.save();
      }
      return this.db.putGame(game);

    }

    saveGames(games: Game[]){
      if(this.db.ionicSQL){
        this.games = games;
        return this.db.save();
      }
      return new Observable(obs => {
        let toLoad = games.length;
        let loaded = 0;
        games.forEach(game => {
          this.db.putGame(game);
          loaded++;
          obs.next(100 * loaded/toLoad);
          if(toLoad == loaded){
            obs.complete();
          }
        });
      });
    }

    merge(games){
      // merge games into current library
    }

    oneFetch (username) {
      return new Promise((resolve, reject) => {
        this.bgg.fetch(username).then(
          data => {
            resolve (data);
          },
          err => {
            // bgg-data.fetch promise was rejected
            reject (err);
          }
        )
      })
    }

  /**
   * Forwards request to BggData service which then fetches data
   * @param  {string} username The BGG username who's collection to fetch
   * @return {Observable}      Observable of fetching process
   */
  fetch = function fetch(username: string){
    return new Observable(obs => {
      this.fetches(username, this.maxFetches).then(
        data => {
          this.procImport(_.values(data)).subscribe(
            m => obs.next(m),
            e => obs.error(e),
            () => obs.complete()
          );
        },
        error => {
            obs.error(error);
            obs.complete();
          }
        )
      }
    )
  }

  fetches (username, attempt) {
    console.log(`${attempt} fetches remaining.`)
    return new Promise((resolve, reject) => {
      if (attempt < 1) {
        reject({
          status: 202,
          message: 'The server is taking too long to process the request.'
        });
      }
      this.bgg.fetch(username).then(
        data => {
          resolve(data);
        }, error => {
          if (error.status === 202) {
            setTimeout(() => {
              console.log(username);
              resolve(this.fetches(username, attempt--));
            }, this.fetchThrottle);
          } else {
            reject(error);
          }
        }
      )
    })


  }
  /**
   * Goes through a set of raw imported games and inserts them into local DB
   * @param  {Array<any>} set     Set of raw impored games
   * @return {Observable}         complete when all games are in db
   */
  procImport(set: Array<any>){
    return new Observable(obs => {
      let toLoad = set.length;
      let dupes = 0;
      let failed = [];
      set = _.reject(set, game => {
        let reject = true;
        let tests = [
          'owned',
          'preOrdered',
          'forTrade',
          'previousOwned',
          'want',
          'wantToPlay',
          'wantToBuy',
          'wishList'
        ]
        for(let test of tests){
          reject = reject && !game[test];
        }
        reject = reject && game.numPlays < 1 && game.rating < 0;
        if(reject){
          failed.push(game.name);
        }
        return reject;
      });
      if(failed.length > 0){
        obs.next('Ghost games!');
        obs.next(failed.join(', '));
      }

      // iterate through the set of retrieved games
      for(let rawGame of set){
        let game = new Game();
        game.trash = false;
        game.filtered = false;
        _.forIn(game, (val, key) => {
          if (typeof rawGame[key] != undefined) {
            game[key] = rawGame[key];
          }
        });

        // add game to memory
        if(!_.some(this.games, g => {
          return game.gameId == g.gameId;
        })){
          this.games.push(game);
        }else{
          dupes++;
        }
        if (this.games.length + dupes == set.length) {
          // games are all in memory
          obs.next('mem');
        }
      }
      if(this.db.ionicSQL){
        obs.next('saving, ionicSQL');
        this.db.save().subscribe(
          msg => obs.next(msg),
          err => obs.error(err),
          () => obs.complete()
        )
      }else{
        obs.next('saving, pouchDB');
        this.db.addSet(this.games).subscribe(
          msg => obs.next(msg),
          err => obs.error(err),
          () => obs.complete()
        );
      }
    })
  }

  /**
   * Add a game to database
   * @param  {Game}   game game to add
   * @return {boolean}      true on success, false on error
   */
  add(game: Game){
    return new Observable(obs => {
      this.db.insert(game).subscribe(
        result => {
          obs.next(result);
        },
        error => {
          obs.error(error)
        },
        () => {
          obs.next("INSERTION COMPLETE");
          obs.complete();
        }
      );
    })
  }

  /**
   * Gets all games from DB. Slow, so use conservatively.
   * @param  {string = "REFRESHING"} msg Describes the reason for refresing
   * @return {void}      no return value
   */
  refresh(reason: string = "REFRESHING"){
    return new Observable(obs => {
      obs.next(reason);
      this.db.getAll().subscribe(
        msg => obs.next(msg),
        error => obs.next(error),
        () => {
          this.games = this.db.games;
          obs.complete();
        });
    });
  }

  /**
   * Destroys and recreates the database.
   * @return {} no return value
   */
  purge(){
    this.db.purge().subscribe(
      msg => {/* */},
      err => {/* */},
      () => {
        this.games = [];
        this.db.load();
      }
    );
  }

  /**
   * Determines whether there are loaded games or not.
   * @return {boolean} True if this.games[] exists and has at least 1 member,
   *                         false otherwise
   */
  thereAreGames(){
    if(this.games && this.games.length > 0){
      return true;
    }
    return false;
  }

}
