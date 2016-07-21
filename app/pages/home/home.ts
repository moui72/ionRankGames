import { Component } from '@angular/core';
import {
  Alert,
  NavController,
  MenuController,
  Loading,
  Modal,
  ViewController,
  NavParams,
  ActionSheet
} from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { BggOpts } from '../../bggopts.class';
import { Observable } from 'rxjs/Observable';
import { GameCard } from '../../components/game/game';
import { FilterGames } from '../../components/modals/filter';
import { ListsPage } from '../../pages/lists/lists'

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: [BggData]
})

export class HomePage {

  /* TODO: comment each method */

  constructor(
    private navController: NavController,
    private db: Db,
    private bgg: BggData,
    private menu: MenuController
  )
  {
    this.init();
  }

  bggUsr: string;

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

  logging = false;
  viewGames = [];
  games = [];
  showingTrash: boolean = false;
  viewing: string = 'in';
  initialized: boolean = false;
  updatingDB: boolean = false;
  dbUpdateProg: number = 0;

  init(){
    this.refresh('Initializing').then(() => {
      this.initialized = true;
    });
  }

  log(text){
    if (this.logging) {
      console.log(text);
    }
  }

  /**
   * Determines if a game is in trash or not
   * @param  {Game}   game  Game to check status of
   * @return {boolean}      True if game.trash or game.filtered is true
   */
  isGameOut(game: Game){
    return this.isTrue(game.filtered) || this.isTrue(game.trash);
  }

  /**
   * Manipulates the viewlist based on segment modeled on viewing button click
   * @param  {viewChangeEvent}  Event emitted by segment modeled on viewing
   * @return {function()}                        call to viewIn() or viewOut()
   */
  view(viewChangeEvent){
    if(viewChangeEvent.value == "in"){
      this.log('VIEWING IN');
      return this.viewIn();
    }
    this.log('VIEWING OUT');
    return this.viewOut();
  }
  /**
   * Filters games to just those which are not trashed/filtered
   * @return {array}   array of games in view
   */
  viewIn(){
    this.viewGames = _.filter(this.games, game => {
      return !this.isTrue(game.filtered) && !this.isTrue(game.trash);
    });
    return this.viewGames;
  }
  /**
   * Filters games to just those which are trashed/filtered
   * @return {array}   array of games in view
   */
  viewOut(){
    this.viewGames = _.filter(this.games, game => {
      return this.isTrue(game.filtered) || this.isTrue(game.trash);
    })
    return this.viewGames;
  }

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
   * Prompts user for BGG username and then calls fetch() with that username
   * @return {void} no return value
   */
  fetching(){
    let fetch = Alert.create({
      title: 'Import games from BGG',
      message: 'Import your (or someone else\'s) game collection from boardgamegeek.com.',
      inputs: [{
        name: 'username',
        placeholder: 'BGG Username'
      }],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.log('Cancel clicked');
          }
        },
        {
          text: 'Fetch',
          handler: data => {
            if(data){
              // update username
              this.menu.close();
              this.bggUsr = data.username;
              this.fetch(this.bggUsr);
            } else {
              this.log('Fetching canceled.');
            }
          }
        }
      ]
    })
    this.navController.present(fetch);
  }

  /**
   * Display modal allowing user to set values on this.bggOpts, then calls filter() on this.games and this.bggOpts
   * @return {Void} no return value
   */
  filtering(){
    let modal = Modal.create(FilterGames, {bggOpts: this.bggOpts});
    modal.onDismiss(data => {
      if(data){
        this.menu.close();
        this.bggOpts = data;
        this.filter(this.games, this.bggOpts);
      } else {
        this.log('Filtering canceled.');
      }
    });
    this.navController.present(modal);
  }

  /**
   * Prompts user for confirmation that they want to purge their database
   * @return {void} no return value
   */
  purging(){
    let purge = Alert.create({
      title: 'Delete all data',
      message: 'Delete all application data? This will remove everything and cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.log('Cancel clicked');
          }
        },
        {
          text: 'Destroy',
          handler: data => {
            this.purge();
          }
        }
      ]
    })
    this.navController.present(purge);
  }

  /**
   * For each game in arr, changes value of filtered on that game to true if it
   * fails any check dictated by opts
   * @param  {Array<Game>} arr  Array of games to filter; usually all games
   * @param  {BggOpts}     opts Options determining the filter
   * @return {Boolean}          true if success, false if not
   */
  filter(arr: Array<Game>, opts: BggOpts){

    // make sure there are actually games in arr
    if (arr.length < 1) {
      this.log("CANNOT FILTER -> SET EMPTY")
      // no games, return false
      return false;
    }

    this.log('filtering...')

    arr = _.reject(arr, game => {
      let reject: boolean = false;
      // reject if excluding expansion AND this game is an expansion
      reject = this.isTrue(opts.excludeExp) && this.isTrue(game.isExpansion);

      // reject if previously rejected
      // OR (excluding unowned AND this game is not owned)
      reject = reject || (this.isTrue(opts.owned) && this.isTrue(game.owned));

      // reject if previously rejected
      // OR (excluding low or unplayed AND this game has too few plays)
      reject = reject || this.isTrue(opts.played)
        && game.numPlays < (opts.minplays > 0 ? opts.minplays : 1);

      // reject if previously rejected
      // OR (excluding low or unrated AND this game has low or no rating)
      reject = reject || this.isTrue(opts.rated)
        && game.rating < (opts.minrating > 0 ? opts.minrating : 0);

      // reject if previously rejected
      // OR (excluding poorly ranked games AND this game has low or no rating)
      reject = reject || (opts.maxrank > 0 && game.rank > opts.maxrank);

      // reject if previously rejected
      // OR (excluding poor averageRating games AND this game has low or
      // no averageRating)
      reject = reject || (opts.minAverageRating > 0 &&
        game.averageRating < opts.minAverageRating);

      return reject;
    });

    /*
      arr contains all games that passed through filter
      filtered gets set to array of all games not in arr
    */

    let filtered = _.differenceBy(this.games, arr, 'gameId');
    this.updatingDB = true;

    let toUpdate = arr.length + filtered.length;
    let updatedGames = 0;

    let dbupdated = _.after(arr.length + filtered.length, () => {
      this.log('filter complete in db');
      this.updatingDB = false;
      return true;
    });
    let memupdated = _.after(arr.length + filtered.length, () => {
      this.log('filter complete in memory');
      return true;
    });

    let progress = () => {
      updatedGames++;
      this.dbUpdateProg = _.floor(updatedGames / toUpdate * 100);
      dbupdated();
    }

    _.forEach(filtered, game => {
      game.filtered = true;
      memupdated();
      this.updateGame(game, 'filtered', true).subscribe(
        msg => this.log(msg),
        err => this.log(err),
        () => progress()
      );
    });
    _.forEach(arr, game => {
      game.filtered = false;
      memupdated();
      this.updateGame(game, 'filtered', false).subscribe(
        msg => this.log(msg),
        err => this.log(err),
        () => progress()
      );
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
    let loading = Loading.create({
      content: "Please wait"
    });
    this.navController.present(loading);
    this.bgg.fetch(username).then(data => {
      this.procImport(_.values(data)).subscribe(
        update => {
          this.log(update);
        },
        error => {
          this.log('import processing error:')
          this.log(error)
        },
        () => {
          this.log('import complete');
          this.refresh();
          this.viewIn();
          loading.dismiss();
        }
      );
    });
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
        this.games.push(game);
        if (this.games.length == set.length) {
          // games are all in memory
        }

        // add game to db
        this.dbUpdateProg = _.floor(loaded / toLoad * 100)
        this.add(game).subscribe(
          msg => {},
          error => {
            if(error.status == 409){
              toLoad--;
              obs.next('Dupe, ' + loaded + ' added');
              if(loaded == toLoad){
                obs.complete();
              }
            } else {
              obs.error(error);
            }
          },
          () => {
            loaded++;
            obs.next('Added to db, ' + loaded + ' added');
            if(loaded == toLoad){
              obs.complete();
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
          this.log(error);
        },
        () => {
          obs.next("INSERTION COMPLETE");
          obs.complete();
        }
      );
    })
  }

  /**
   * [trash description]
   * @param  {Game}   game [description]
   * @return {[type]}      [description]
   */
  trash(game: Game){
    game.trash = true;
    this.updateGame(game, 'trash', true).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg);
      },
      error => {
        this.log(error);
      },
      () => {
        this.log('TRASH -> database update complete');
      }
    );
    return this.view({value: this.viewing});
  }

  /**
   * [restore description]
   * @param  {Game}   game [description]
   * @return {[type]}      [description]
   */
  restore(game: Game) {
    game.trash = false;
    game.filtered = false;
    this.updateGame(game, 'trash', false).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg);
      },
      error => {
        this.log(error);
      },
      () => {
        this.updateGame(game, 'filtered', false).subscribe(
          msg => {
            this.log("DB UPDATE MESSAGE -> " + msg);
          },
          error => {
            this.log(error);
          },
          () => {
            this.log('RESTORE -> database update complete');
          }
        );
      }
    );
    return this.view({value: this.viewing});
  }

  /**
   * pushes list management page onto nav
   * @return {void} no return value
   */
  ranking(){
    this.log('pushing lists page')
    this.navController.push(ListsPage, {pool: this.viewIn()});
  }

  /**
   * Gets all games from DB. Slow, so use conservatively.
   * @param  {string = "REFRESHING"} msg Describes the reason for refresing
   * @return {void}      no return value
   */
  refresh(msg: string = "REFRESHING"){
    this.log(msg);
    let loading = Loading.create({content: 'Updating view'});
    this.navController.present(loading);
    return new Promise((resolve, reject) => {
      this.db.refresh().subscribe(
        resp => this.log(resp),
        error => reject(error),
        () => {
          this.games = this.db.games;
          this.view({value: this.viewing});
          loading.dismiss()
          resolve(true);
          // _.defer(() => loading.dismiss());
        });
    })

  }

  /**
   * Destroys and recreates the database.
   * @return {} no return value
   */
  purge(){
    this.db.purge().subscribe(
      msg => this.log(msg),
      err => this.log(err),
      () => {
        this.log('purged');
        this.games = [];
        this.viewGames = [];
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
    this.log(game);
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
