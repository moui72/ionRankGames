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

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: [Db, BggData]
})

export class HomePage {

  /* TODO: comment each method */
  /* TODO: fix refresh after fetch */

  constructor(
    private navController: NavController,
    private db: Db,
    private bgg: BggData
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

  viewGames = [];
  games = [];
  added = 0;
  showingTrash: boolean = false;
  viewing: string = 'in';

  init(){
    this.refresh('Initializing');
  }

  isGameOut(game: Game){
    console.log('Is ' + game.name + ' out?')

    if(this.isTrue(game.filtered) || this.isTrue(game.trash)){
      console.log('--> yep')
      return true;
    }
    console.log(this.isTrue(game.filtered));
    console.log('--> nope')
    return false;
  }

  /**
   * Manipulates the viewlist based on segment modeled on viewing button click
   * @param  {viewChangeEvent}  Event emitted by segment modeled on viewing
   * @return {[type]}                        call to viewIn() or viewOut()
   */
  view(viewChangeEvent){
    if(viewChangeEvent.value == "in"){
      console.log('VIEWING IN');
      return this.viewIn();
    }
    console.log('VIEWING OUT');
    return  this.viewOut();
  }
  /**
   * Filters games to just those which are not trashed/filtered
   * @return {void}   no return value
   */
  viewIn(){
    this.viewGames = _.filter(this.games, game => {
      return !this.isTrue(game.filtered) && !this.isTrue(game.trash);
    });
  }
  /**
   * Filters games to just those which are trashed/filtered
   * @return {void}   no return value
   */
  viewOut(){
    this.viewGames = _.filter(this.games, game => {
      return this.isTrue(game.filtered) || this.isTrue(game.trash);
    })
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
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Fetch',
          handler: data => {
            if(data){
              // update username
              this.bggUsr = data.username;
              this.fetch(this.bggUsr);
            } else {
              console.log('Fetching canceled.');
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
        this.bggOpts = data;
        this.filter(this.games, this.bggOpts);
      } else {
        console.log('Filtering canceled.');
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
            console.log('Cancel clicked');
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
    let loading = Loading.create({
      content: "Please wait"
    });
    this.navController.present(loading);
    // make sure there are actually games in arr
    if (arr.length < 1) {
      console.log("CANNOT FILTER -> SET EMPTY")
      // no games, return false
      return false;
    }
    // should we exclude expansions?
    if (this.isTrue(opts.excludeExp)) {
      // select only non-expansions, if requested
      console.log("----- FILTERING BY EXPANSION STATUS -----");
      arr = _.filter(arr, game => {
        // returns all games where isExpansion != true or 'true'
        return !this.isTrue(game.isExpansion);
      });
      console.log("NON-EXPANSIONS: " + arr.length);
    } else {
      // not filtering expansions
      console.log("----- SKIPPING EXPANSION CHECK -----");
    }
    // should we include only games owned by user?
    if (this.isTrue(opts.owned)) {
      // select only owned games, if requested
      console.log("----- FILTERING BY OWNERSHIP -----");
      arr = _.filter(arr, game => {
        // returns all games where own == true or 'true'
        return this.isTrue(game.own);
      });
      console.log("OWNED GAMES: " + arr.length);
    } else {
      console.log("----- SKIPPING OWNERSHIP CHECK -----");
    }
    // should we exclude games based on low or no logged plays?
    if (this.isTrue(opts.played)) {
      // select only games played more than [0 or minplays] times, if requested
      let threshold = opts.minplays > 0 ? opts.minplays : 1;
      console.log("----- FILTERING BY PLAYS -----");
      arr = _.filter(arr, game => {
        // only 1 play needed
        return game.numPlays > threshold;
      });
      console.log("GAMES PLAYED MORE THAN " + threshold + " TIMES: " +
       arr.length);
    } else {
      console.log("----- SKIPPING PLAYS CHECK -----");
    }
    // should we exclude low rated or unrated games?
    var rateComp = this.bggOpts.rated == false ? -1 : opts.minrating >= 0 ? opts.minrating : 1;
    if (this.isTrue(opts.rated)) {
      console.log("----- FILTERING BY RATING -----");
      // filter out unrated or low rated games, if requested
      let threshold = opts.minrating > 0 ? opts.minrating : 0;
      arr = _.filter(arr, game => {
        // filter out games not rated above [minrating]
        return game.rating > threshold;
      });
      console.log("GAMES RATED HIGHER THAN " + threshold + ": " + arr.length);
    } else {
      console.log("----- SKIPPING RATING CHECK -----");
    }
    // should we exclude poorly ranked games?
    if (opts.maxrank > 0) {
      console.log("----- FILTERING BY RANK -----");
      // filter out unrated or low rated games, if requested
      let threshold = opts.maxrank * 1;
      arr = _.filter(arr, game => {
        // filter out games not ranked better than threshold
        return game.rank < threshold;
      });
      console.log("GAMES RANKED BETTER THAN " + threshold + ": " + arr.length);
    } else {
      console.log("----- SKIPPING RANK CHECK -----");
    }
    // should we exclude games with low average rating?
    if (opts.minAverageRating > 0) {
      console.log("----- FILTERING BY AVERAGE RATING -----");
      // filter out games with low average rating, if requested
      let threshold = opts.minAverageRating * 1;
      arr = _.filter(arr, game => {
        return game.averageRating > threshold;
      });
      console.log("GAMES RATED BETTER THAN " + threshold + " ON AVERAGE: " +
       arr.length);
    }else {
      console.log("----- SKIPPING AVERAGE RATING CHECK -----");
    }
    /*
      arr contains all games that passed through filter
      filtered gets set to array of all games not in arr
    */
    let filtered = _.differenceBy(this.games, arr, 'gameId');
    let updated = _.after(arr.length + filtered.length, () => {
      this.refresh();
      loading.dismiss();
    })
    _.forEach(filtered, game => {
      this.updateGame(game, 'filtered', true).subscribe(() => {
        updated();
      })
    });
    _.forEach(arr, game => {
      this.updateGame(game, 'filtered', false).subscribe(() => {
        updated();
      })
    });
  }

  /**
   * Wrapper for method of Db service
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
    let prog = 0;
    let loading = Loading.create({
      content: "Please wait"
    });
    this.navController.present(loading);
    this.bgg.fetch(username).then(data => {
      this.procImport(_.values(data)).subscribe(
        update => {
          console.log(update['msg']);
          prog = update['percentDone'];
        },
        error => console.log(error),
        () => {
          this.refresh();
          this.games = this.db.games;
          this.added = 0;
          this.viewIn();
          loading.dismiss();
        }
      );
    });
  }
  /**
   * [procImport description]
   * @param  {Array<any>} set [description]
   * @return {[type]}         [description]
   */
  procImport(set: Array<any>){
    return new Observable(obs => {
      let toload = set.length;
      let loaded = 0;
      let prog = 0;

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
        loaded++;
        prog = _.floor(loaded/toload);
        if(this.add(game)){
          obs.next({
            msg: "IMPORTED GAME -> " + game.name + '(' +
             prog + '%)',
            percentDone: prog});
          this.added++;
        } else {
          obs.next({
            msg: "DUPLICATE GAME -> " + game.name + '(' +
             prog + '%)',
            percentDone: prog});
        }
      }
      obs.complete();
    })
  }

  add(game: Game){
    this.db.insert(game).subscribe(
      result => {
        console.log('adding...');
        console.log(result);
      },
      error => {
        console.log("DB INSERTION ERROR")
        console.log(error);
        return false;
      },
      () => {
        console.log("INSERTION COMPLETE");
        return true;
      }
    );
  }

  trash(game: Game){
    this.updateGame(game, 'trash', true).subscribe(
      msg => {
        console.log("UPDATE MESSAGE -> " + msg);
      },
      error => {
        console.log(error);
      },
      () => {
        // console.log("FILTER UPDATED");
        this.refresh('REFRESHING -> trashed ' + game.name);
      }
    );
  }

  restore(game: Game) {
    this.updateGame(game, 'trash', false).subscribe(
      msg => {
        console.log("UPDATE MESSAGE -> " + msg);
      },
      error => {
        console.log(error);
      },
      () => {
        this.updateGame(game, 'filtered', false).subscribe(
          msg => {
            console.log("UPDATE MESSAGE -> " + msg);
          },
          error => {
            console.log(error);
          },
          () => {
            this.refresh('REFRESHING -> restored ' + game.name);
          }
        );
      }
    );
  }

  refresh(msg: string = "REFRESHING"){
    console.log(msg);
    this.db.refresh().subscribe(
      resp => console.log(resp),
      error => console.log(error),
      () => {
        this.games = this.db.games;
        this.view({value: this.viewing})
      });
  }

  purge(){
    this.db.purge();
    this.refresh();
  }

  detail(game){
    console.log(game);
  }

  thereAreGames(){
    if(this.games && this.games.length > 0){
      return true;
    }
    return false;
  }

}
