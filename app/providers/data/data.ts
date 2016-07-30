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

  bggOpts: BggOpts = {
    minrating: 7,
    maxrank: 0,
    minplays: 0,
    minAverageRating: 7,
    excludeExp: true,
    owned: false,
    rated: false,
    played: false
  }

  ready: boolean = false;

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
        let reject: boolean = false;
        // reject if excluding expansion AND this game is an expansion
        reject = this.isTrue(opts.excludeExp) && this.isTrue(game.isExpansion);

        // reject if previously rejected
        // OR (excluding unowned AND this game is not owned)
        reject = reject || (this.isTrue(opts.owned) &&
                 !this.isTrue(game.owned));

        // reject if previously rejected
        // OR (excluding low or unplayed AND this game has too few plays)
        reject = reject || (this.isTrue(opts.played) && game.numPlays < 1);
        reject = reject || (game.numPlays > 0 && game.numPlays < opts.minplays);

        // reject if previously rejected
        // OR (excluding low or unrated AND this game has low or no rating)
        reject = reject || (this.isTrue(opts.rated)
                 && game.rating < (opts.minrating > 0 ? opts.minrating : 0));

        return reject;
      })

      /*
        arr contains all games that passed through filter
        filtered gets set to array of all games not in arr
      */
      this.games = _.map(arr, game => {
        let inpool = _.some(pool, pGame => {
          return pGame.gameId == game.gameId;
        });
        if(inpool){
          game.filtered = false;
        }else{
          game.filtered = true;
        }
        return game;
      });
      obs.next('mem');

      // update db -- pool Game[] in, filtered Game[] out
      this.updatingDB = true;
      let filtered = _.filter(this.games, game => {
        return game.filtered;
      })
      this.db.filterSet(pool, filtered).then(result => {
        obs.next('db');
        obs.complete();
      }).catch(err => {
        obs.next(err);
      })
    });
  }

  /**
   * Wrapper for updateGame method of Db service
   * @param  {Game}    game   the game to update (uses gameId property for
   *  lookup)
   * @param  {string}  column   the column to change (filter or trash)
   * @param  {boolean} value    the value to insert for column
   * @return {Observable}       passes observable returned by Db service
   */
  updateGame(game: Game, column: string, value : boolean){
    if(column != 'filtered' && column != 'trash'){
      return new Observable(obs => {
        obs.error(new Error('invalid column name'));
      });
    }
    return this.db.updateGame(game, column, value);
  }

  /**
   * Forwards request to BggData service which then fetches data
   * @param  {string} username The BGG username who's collection to fetch
   * @return {void}            None
   */
  fetch(username: string){
    return new Observable(obs => {
      this.bgg.fetch(username).then(data => {
        this.procImport(_.values(data)).subscribe(
          update => {
            obs.next(update);
          },
          error => {
            obs.next(error);
          },
          () => {
            obs.next('import complete');
            obs.complete();
          }
        );
      });
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
      let loaded = 0;
      let dupes = 0;

      this.updatingDB = true;
      this.dbUpdateProg = 0;

      let dbupdated = _.after(set.length, () => {
        this.updatingDB = false;
        this.dbUpdateProg = 0;
      })

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

        // add game to db
        this.add(game).subscribe(
          msg => {},
          error => {
            if(error.status == 409){
              loaded++;
              obs.next(loaded / toLoad);
              if(loaded == toLoad){
                obs.next('db');
                obs.complete();
              }
            } else {
              obs.error(error);
            }
          },
          () => {
            loaded++;
            obs.next(loaded / toLoad);
            if(loaded == toLoad){
              obs.next('db');
            }
          }
        )
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
   * Displays detailed info for game
   * @param  {Game}   game the game to display details of
   * @return {}            no return value
   */
  detail(game: Game){
    /*

     */
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
