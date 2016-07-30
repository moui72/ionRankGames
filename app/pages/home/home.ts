import { Component } from '@angular/core';
import {
  Alert,
  NavController,
  MenuController,
  Modal,
  ViewController,
  NavParams,
  ActionSheet,
  Menu,
  Loading,
  Toast,
  Storage,
  LocalStorage
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Data } from '../../providers/data/data';
import { FilterGames } from '../../components/modals/filter';
import { ListPage } from '../../pages/list/list';
import { Listdb } from '../../providers/listdb/listdb'
import { GameCard } from '../../components/game/game';
import { BggOpts } from '../../bggopts.class';
import { Game } from '../../game.class';
import { List } from '../../list.class';

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: []
})

export class HomePage {

  /* TODO: add game details display options */

  bggUsr: string;
  loading: boolean = false;
  local: Storage;

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

  lastList: List;

  showingTrash: boolean = false;
  viewing: string = 'in';

  logging = true;

  updatingDB: boolean = false;
  dbUpdateProg: number = 0;

  initialized: boolean = false;

  sort: string = 'name';
  sortAsc: boolean = true;

  constructor(
    private nav: NavController,
    private menu: MenuController,
    private data: Data,
    private listdb: Listdb
  )
  {
    this.local = new Storage(LocalStorage);
    try{
      this.local.get('bggUsr').then(usr => {
        this.bggUsr = usr;
      })
    }catch(e){
      this.log('No stored username');
      this.log(e);
    }
    try{
      this.local.get('bggOpts').then(opts => {
        this.bggOpts = JSON.parse(opts);
      })
    }catch(e){
      this.log('No stored options');
      this.log(e);
    }
    try{
      this.local.get('lastList').then(list => {
        this.lastList = JSON.parse(list);
      })
    }catch(e){
        this.lastList = undefined;
        this.log('Last list not stored');
        this.log(e);
      }
  }

  /**
   * Debugging output -- sends messages to console.log() if this.logging ==
   * true.
   * @param  {any}    text   The debugging message to log; should be coercible
   *                         to string.
   * @return {void}          No return value.
   */
  log(text: any){
    if (this.logging) {
      console.log(text);
    }
  }

  /**
   * Displays a toast with a given message. Persists until click and has close
   * button if stay == true.
   * @param  {string}           msg  The message to display.
   * @param  {boolean = false}  stay Whether to persist the message until click.
   * @return {Toast}                 The presented toast object.
   */
  toast(msg: string, stay: boolean = false){
    let opts = {
      message: msg
    }
    if(!stay){
      opts['duration'] = 3000;
    } else {
      opts['showCloseButton'] = true;
    }
    let toast = Toast.create(opts);
    this.nav.present(toast);
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
   * Change the current sort order
   * @return {void} no return value
   */
  toggleSortOrder(){
    this.sortAsc = !this.sortAsc;
  }

  /**
   * Sorts an array of games by the specified property in the specified
   * direction.
   * @param  {Game[]}                 arr    Array of games to sort.
   * @param  {string  = this.sort}    byProp Property to sort by.
   * @param  {boolean = this.sortAsc} asc    Direction of sort.
   * @return {Game[]}                        Sorted array of games.
   */
  sortGames(arr: Game[], byProp: string = this.sort,
   asc: boolean = this.sortAsc){
    let result = _.sortBy(arr, game => {
      return game[byProp];
    })
    if(!asc){
      return _.reverse(result);
    }
    return result;
  }

  /**
   * Returns array of games based on the current view.
   * @return {Game[]} [in games if viewing == in, or out games if
   *                       viewing == out]
   */
  games(){
    return this.sortGames(_.filter(this.data.games, game => {
      return this.isGameOut(game) != (this.viewing == 'in');
    }))
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
    if(!this.data.games){
      return 0;
    }
    return _.filter(this.data.games, game => {
      return this.isTrue(game.trash) || this.isTrue(game.filtered);
    }).length;
  }

  /**
   * Prompts user for BGG username and then calls fetch() with that username
   * @return {void} no return value
   */
  fetching(){
    this.log('fetching');
    let fetch = Alert.create({
      title: 'Import games from BGG',
      message: 'Import your (or someone else\'s) game collection from boardgamegeek.com.',
      inputs: [{
        name: 'username',
        placeholder: 'BGG Username',
        value: this.bggUsr
      }],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.log('Fetching canceled.');
          }
        },
        {
          text: 'Fetch',
          handler: data => {
            if(data.username){
              this.loading = true;
              this.local.set('bggUsr', data.username)
              // update username
              this.bggUsr = data.username;
              this.data.fetch(this.bggUsr).subscribe(
                msg => {
                  if(msg == 'mem'){
                    this.toast('Imported ' + this.games.length + ' games.');
                  }
                  this.log(msg);
                },
                error => this.log(error),
                () => {
                  this.log('import complete');
                  this.toast('Import saved.');
                  this.loading = false;
                }
              );
            } else {
              this.toast('No username provided');
            }
          }
        }
      ]
    })
    this.nav.present(fetch);
  }

  /**
   * Display modal allowing user to set values on this.bggOpts, then calls filter() on this.games and this.bggOpts
   * @return {Void} no return value
   */
  filtering(){
    let fmodal = Modal.create(FilterGames, {bggOpts: this.bggOpts});

    this.nav.present(fmodal);

    fmodal.onDismiss(data => {
      console.log('dismiss');
      if(data){
        this.loading = true;
        this.bggOpts = data;
        this.local.set('bggOpts', JSON.stringify(this.bggOpts));
        this.data.filter(this.data.games, this.bggOpts).subscribe(
          msg => {
            if(msg == 'mem'){
              this.toast('Filtered out ' + this.out() + ' games.');
            }
            this.log(msg);
          },
          error => this.log(error),
          () => {
            this.loading = false;
            this.log('filtering complete');
            this.toast('Changes saved.');

          }
        );
      } else {
        this.log('filtering canceled.');
      }
    });
  }

  /**
   * Prompts user for confirmation that they want to purge their database
   * @return {void} no return value
   */
  purging(){
    let purge = Alert.create({
      title: 'Delete all data',
      message: 'Delete all games from your library? This will remove ' +
      'everything except your lists, and it cannot be undone.',
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
            this.data.purge();
            this.toast('Purged library data.')
          }
        }
      ]
    })
    this.nav.present(purge);
  }

  /**
   * [trash description]
   * @param  {Game}   game [description]
   * @return {[type]}      [description]
   */
  trash(game: Game){
    game.trash = true;
    this.toast('Trashed ' + game.name + '.');
    let dbToast = Toast.create({
      message: 'Updating saved data. Please do not close your browser.',
      position: 'top',
      cssClass: 'danger'
    });
    this.nav.present(dbToast);
    this.data.updateGame(game, 'trash', true).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg);
      },
      error => {
        this.log(error);
      },
      () => {
        this.log('TRASH -> database update complete');
        dbToast.dismiss();
        this.toast('Saved data updated.');
      }
    );
  }

  /**
   * Returns a trashed or filtered game to the pool.
   * @param  {Game}   game The game to restore.
   * @return {void}        No return value.
   */
  restore(game: Game) {
    game.trash = false;
    game.filtered = false;
    this.toast('Restored ' + game.name + '.');
    let dbToast = Toast.create({
      message: 'Updating saved data. Please do not close your browser.',
      position: 'top',
      cssClass: 'danger'
    });
    this.nav.present(dbToast);
    this.data.updateGame(game, 'trash', false).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg);
        dbToast.setMessage(msg.toString());
      },
      error => {
        this.log(error);
      },
      () => {
        this.data.updateGame(game, 'filtered', false).subscribe(
          msg => {
            this.log("DB UPDATE MESSAGE -> " + msg);
          },
          error => {
            this.log(error);
          },
          () => {
            this.log('RESTORE -> database update complete');
            dbToast.dismiss();
            this.toast('Saved data updated.');
          }
        );
      }
    );
  }


  /**
   * Displays detailed info for game
   * @param  {Game}   game the game to display details of
   * @return {}            no return value
   */
  more(game: Game){
    this.log(game);
  }

  /**
   * Determines whether there are loaded games or not.
   * @return {boolean} True if this.games[] exists and has at least 1 member,
   *                         false otherwise
   */
  thereAreGames(){
    if(this.data.games && this.data.games.length > 0){
      return true;
    }
    return false;
  }

  openLastList(){
    this.local.get('lastList').then(list => {
      let editList = JSON.parse(list);
      this.nav.push(ListPage, {list: editList});
    }).catch(e => {
      this.toast('Most recent list not known.');
      this.log(e);

    })
  }

}
