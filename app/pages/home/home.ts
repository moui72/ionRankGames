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
import { UploadGames } from '../../components/modals/upload';
import { MessageLog } from '../../components/modals/message-log/message-log';
import { ListPage } from '../../pages/list/list';
import { GameDetailPage } from '../../pages/game-detail/game-detail';
import { Listdb } from '../../providers/listdb/listdb'
import { GameCard } from '../../components/game/game';
import { BggOpts } from '../../bggopts.class';
import { Game } from '../../game.class';
import { Message } from '../../message.class';
import * as fileSaver from 'file-saver'

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

  bggOpts: BggOpts;

  showingTrash: boolean = false;
  viewing: string = 'in';

  logging = true;

  updatingDB: boolean = false;
  dbUpdateProg: number = 0;

  initialized: boolean = false;

  sort: string = 'name';
  sortAsc: boolean = true;

  msgLog: any[] = [];
  errObjs: any[] = [];

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
      this.log('No stored username', 'notice');
      this.log(e);
    }
    try{
      this.local.get('bggOpts').then(opts => {
        if(opts != null){
          this.bggOpts = JSON.parse(opts);
        }else{
          this.bggOpts = {
            minrating: 7,
            maxrank: 0,
            minplays: 0,
            minAverageRating: 7,
            excludeExp: true,
            owned: false,
            rated: false,
            played: false,
            preOrdered: false,
            forTrade: false,
            previousOwned: false,
            want: false,
            wantToPlay: false,
            wantToBuy: false,
            wishList: false
          };
        }
      })
    }catch(e){
      this.log('No stored options');
      this.log(e);
    }

  }

  exportJSON(){
    this.log('exporting', 'notice');
    let json = JSON.stringify(this.data.games);
    let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
    fileSaver.saveAs(blob, 'rg_' + this.bggUsr ? this.bggUsr : 'my' + '-games.json');
  }

  /**
   * Debugging output -- sends messages to console.log() if this.logging ==
   * true.
   * @param  {any}    text   The debugging message to log; should be coercible
   *                         to string.
   * @return {void}          No return value.
   */
  log(text: any, type: string = 'error'){
    console.log();
    if (typeof text === 'object') {
      this.errObjs.push({timestamp: Date.now(), body: text})
      text = this.getErrorMessage(text);
    }
    if (this.logging) {
      if(type == 'error') {
        console.error(text);
      }
      console.log(text);
    }
    this.logItem(text, type);

  }

  /**
   * Pushes the detail page onto the top nav stack
   * @param  {Game}   showGame game to show
   */
  more(showGame: Game){
    this.nav.parent.parent.push(GameDetailPage, {game: showGame});
  }

  logItem (msg, type) {
    this.msgLog.push(new Message(
      msg,
      type
    ));
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
      opts['duration'] = 5000;
    } else {
      opts['showCloseButton'] = true;
    }
    let toast = Toast.create(opts);
    this.nav.present(toast);
    this.log(msg, 'toast');
    return toast;
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
    this.log('fetching', 'notice');
    const fetch = Alert.create({
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
            this.log('Fetching canceled.', 'notice');
          }
        },
        {
          text: 'Fetch',
          handler: data => {
            if(data.username){
              let result = '';
              this.loading = true;
              this.local.set('bggUsr', data.username);
              // update username
              this.bggUsr = data.username;
              this.data.fetchCount = 0;
              this.data.fetch(this.bggUsr).subscribe(
                msg => {
                  if(msg == 'mem'){
                    result += 'Imported ' + this.data.games.length + ' games.';
                  }
                },
                error => {
                  this.log(error);
                  let msg = 'Error fetching games. ';
                  msg += this.getErrorMessage(error);

                  this.toast(msg);
                  this.loading = false;

                },
                () => {
                  this.log('import complete', 'notice');
                  this.toast(result + ' Import saved.');
                  this.loading = false;
                }
              );
            } else {
              this.toast('No username provided.');
            }
          }
        }
      ]
    })
    this.nav.present(fetch);
  }

  getErrorMessage (error) {
    let msg = '';
    while (typeof(error) === 'object') {
      if (error.message) {
        msg += error.message
      }
      error = error.error;
    }
    return msg;
  }

  /**
   * Display modal allowing user to set values on this.bggOpts, then calls filter() on this.games and this.bggOpts
   * @return {Void} no return value
   */
  filtering(){
    let fmodal = Modal.create(FilterGames, {bggOpts: this.bggOpts});

    this.nav.present(fmodal);

    fmodal.onDismiss(data => {
      if(data){
        let result = '';
        this.loading = true;
        this.bggOpts = data;
        this.local.set('bggOpts', JSON.stringify(this.bggOpts));
        this.data.filter(this.data.games, this.bggOpts).subscribe(
          msg => {
            if(msg == 'mem'){
              result += 'Filtered out ' + this.out() + ' games.';
            }
          },
          error => this.log(error),
          () => {
            this.toast(result + ' Saved changes.')
            this.loading = false;
            this.log('filtering complete', 'notice');

          }
        );
      } else {
        this.log('filtering canceled.', 'notice');
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
            this.log('Cancel clicked', 'notice');
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

  showLog() {
    console.log(this.msgLog);
    let messageLog = Modal.create(MessageLog, {messages: this.msgLog});
    this.nav.present(messageLog);
  }

  importing(){
    let umodal = Modal.create(UploadGames);
    this.nav.present(umodal);
    umodal.onDismiss((data: Game[], merge?: boolean) => {
      merge = merge || false;
      if(!merge){
        this.data.saveGames(data).subscribe(
          msg => this.log(msg, 'notice'),
          err => this.log(err),
          () => {
            this.toast('Imported ' + data.length + ' games from file, overwriting existing library.');
          });
      } else {
        // @TODO allow merging of games
        this.log('attempted merge, feature not available', 'warning');
      }
    });
  }

  /**
   * [trash description]
   * @param  {Game}   game [description]
   * @return {[type]}      [description]
   */
  trash(game: Game){
    game.trash = true;
    let result = 'Trashed ' + game.name + '.';
    this.data.saveGame(game).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg, 'notice');
      },
      error => {
        this.toast(result + ' Error saving.');
        this.log(error);
      },
      () => {
        this.log('TRASH -> database update complete', 'notice');
        this.toast(result + ' Saved data updated.');
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
    let result = 'Restored ' + game.name + '.';

    this.data.saveGame(game).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg), 'notice';
      },
      error => {
        this.toast(result + ' Error saving.');
        this.log(error);
      },
      () => {
        this.log('RESTORE -> database update complete');
        this.toast(result + ' Saved data updated.');
      }
    );
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



}
