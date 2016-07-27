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
  Loading
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Data } from '../../providers/data/data';
import { FilterGames } from '../../components/modals/filter';
import { ListsPage } from '../../pages/lists/lists'
import { GameCard } from '../../components/game/game';
import { BggOpts } from '../../bggopts.class';
import { Game } from '../../game.class';

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: []
})

export class HomePage {

  /* TODO: comment each method */
  /* TODO: move menu to root scope */
  /* TODO: add game details display options */

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
    private data: Data
  )
  {
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

  toggleSortOrder(){
    this.sortAsc = !this.sortAsc;
  }

  sortGames(arr){
    let result = _.sortBy(arr, game => {
      return game[this.sort];
    })
    if(!this.sortAsc){
      return _.reverse(result);
    }
    return result;
  }

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
        placeholder: 'BGG Username'
      }],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.log('Cancel fetching');
          }
        },
        {
          text: 'Fetch',
          handler: data => {
            if(data.username){
              let loading = Loading.create({
                content: 'Fetching games, please wait...'
              });
              this.nav.present(loading);
              // update username
              this.bggUsr = data.username;
              this.data.fetch(this.bggUsr).subscribe(
                msg => this.log(msg),
                error => this.log(error),
                () => {
                  this.log('fetching complete');
                  loading.dismiss();
                }
              );
            } else {
              this.log('No username provided');
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
    let modal = Modal.create(FilterGames, {bggOpts: this.bggOpts});
    modal.onDismiss(data => {
      if(data){
        this.bggOpts = data;
        this.data.filter(this.data.games, this.bggOpts).subscribe(
          msg => this.log(msg),
          error => this.log(error),
          () => {
            this.log('filtering complete');
          }
        );;
      } else {
        this.log('Filtering canceled.');
      }
    });
    this.nav.present(modal);
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
            this.data.purge();
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
    this.data.updateGame(game, 'trash', true).subscribe(
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
  }

  /**
   * [restore description]
   * @param  {Game}   game [description]
   * @return {[type]}      [description]
   */
  restore(game: Game) {
    game.trash = false;
    game.filtered = false;
    this.data.updateGame(game, 'trash', false).subscribe(
      msg => {
        this.log("DB UPDATE MESSAGE -> " + msg);
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

}
