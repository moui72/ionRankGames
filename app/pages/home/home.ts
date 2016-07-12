import { Component } from '@angular/core';
import { NavController, Loading, Modal, ViewController, NavParams } from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { BggOpts } from '../../bggopts.class';
import { Observable } from 'rxjs/Observable';
import { GameCard } from '../../components/game/game';

class update{
  msg: string;
  percentDone: number;
}

@Component({
  directives: [GameCard],
  templateUrl: 'build/pages/home/home.html',
  providers: [Db, BggData]
})

export class HomePage {
  /* TODO: correct refresh() to appriopriately call viewIn() / viewOut() */
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
  rawbgg = [];
  dupes = [];
  added = 0;
  loading = Loading.create();
  showingTrash: boolean = false;
  viewingIn: boolean = true;

  init(){
    this.db.load().subscribe(
      result => {
        console.log("LOADING DB -> " + result);
      }, error => {
        console.log("ERROR LOADING DB -> " + error.err.message);
      }, () => {
        this.games = this.db.games;
        console.log("DONE LOADING DB");
        this.viewIn();
      }
    );
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

  viewIn(){
    this.viewGames = _.filter(this.games, game => {
      return !this.isTrue(game.filtered) && !this.isTrue(game.trash);
    });
    this.viewingIn = true;
  }
  viewOut(){
    this.viewGames = _.filter(this.games, game => {
      return this.isTrue(game.filtered) || this.isTrue(game.trash);
    })
    this.viewingIn = false;
  }

  isTrue(exp){
    // check for string/bool true/'true'
    return exp == true || exp == 'true';
  }

  out(){
    // returns number of games in trash or filtered out
    return _.filter(this.games, game => {
      return this.isTrue(game.trash) || this.isTrue(game.filtered);
    }).length;
  }

  fetching(){
    let modal = Modal.create(importGames, {username: this.bggUsr});
    modal.onDismiss(data => {
      if(data){
        this.bggUsr = data;
        this.fetch(this.bggUsr);
      } else {
        console.log('Fetching canceled.');
      }
    });
    this.navController.present(modal);
  }

  filtering(){
    let modal = Modal.create(filterGames, {bggOpts: this.bggOpts});
    modal.onDismiss(data => {
      if(data){
        this.bggOpts = data;
        this.filter(this.games);
      } else {
        console.log('Filtering canceled.');
      }
    });
    this.navController.present(modal);
  }

  filter(arr){
    if (arr.length < 1) {
      console.log("CANNOT FILTER -> SET EMPTY")
      return false;
    }

    let opts = this.bggOpts;

    if (opts.excludeExp) {
      // select only non-expansions, if requested
      console.log("----- FILTERING BY EXPANSION STATUS -----");
      arr = _.filter(arr, game => {
        if (game['isExpansion'] == 'true') {
          return false;
        }
        if (game['isExpansion'] === true) {
          return false;
        }
        return true;
      });
      console.log("NON-EXPANSIONS: " + _.map(arr, 'name').join(', '));
    } else {
      console.log("----- SKIPPING EXPANSION CHECK -----");
    }
    if (opts.owned) {
      // select only owned games, if requested
      console.log("----- FILTERING BY OWNERSHIP -----");
      arr = _.filter(arr, game => {
        if (game['own'] == 'true') {
          return true;
        }
        if (game['own'] === true) {
          return true;
        }
        return false;
      });
      console.log("OWNED GAMES: " + _.map(arr, 'name').join(', '));
    } else {
      console.log("----- SKIPPING OWNERSHIP CHECK -----");
    }

    var playComp = this.bggOpts.played == false ? 0 : this.bggOpts.minplays > 0 ? this.bggOpts.minplays : 1;
    if (playComp > 0) {
      // select only games played more than [0 or minplays] times, if requested
      console.log("----- FILTERING BY PLAYS -----");
      arr = _.filter(arr, game => {
        // only 1 play needed
        return game['numPlays'] > playComp;
      });
      console.log("GAMES PLAYED MORE THAN " + playComp + " TIMES: " + _.map(arr, 'name').join(', '));
    } else {
      console.log("SKIPPING PLAYS CHECK");
    }
    var rateComp = this.bggOpts.rated == false ? -1 : opts.minrating >= 0 ? opts.minrating : 1;
    if (rateComp >= 0) {
      console.log("----- FILTERING BY RATING -----");
      // filter out unrated or low rated games, if requested
      arr = _.filter(arr, game => {
        // filter out games not rated above [minrating]
        return game['rating'] > rateComp;
      });
      console.log("GAMES RATED HIGHER THAN " + rateComp + ": " + _.map(arr, 'name').join(', '));
    } else {
      console.log("SKIPPING RATING CHECK");
    }
    if (opts.maxrank > 0) {
      console.log("----- FILTERING BY RANK -----");
      // filter out unrated or low rated games, if requested
      arr = _.filter(arr, game => {
        // filter out games not rated
        return game['rank'] < opts.maxrank;
      });
      console.log("GAMES RANKED BETTER THAN " + opts.maxrank + ": " + _.map(arr, 'name').join(', '));
    } else {
      console.log("SKIPPING RANK CHECK");
    }
    if (opts.minAverageRating > 0) {
      // filter out unrated or low rated games, if requested
      console.log("----- FILTERING BY AVERAGE RATOMG -----");
      arr = _.filter(arr, game => {
        // filter out games not rated
        return game['averageRating'] > opts.minAverageRating;
      });
      console.log("GAMES RATED BETTER THAN " + opts.minAverageRating + " ON AVERAGE: " + _.map(arr, 'name').join(', '));
    }else {
      console.log("SKIPPING AVERAGE RATING CHECK");
    }
    let filtered = _.differenceBy(this.games, arr, 'gameId');
    console.log("TRASHED: " + _.map(filtered, 'name').join(', '))
    _.forEach(arr, game => {
      this.updateGame(game, 'filtered', false);
    })
    _.forEach(filtered, game => {
      this.updateGame(game, 'filtered', true);
    });
  }

  updateGame(game, column, value){
    console.log(
      'UPDATING: ' + game.name + ' (trash: ' +
      game.trash + ', filtered: ' +
      game.filtered + ')'
    );
    this.db.updateGame(game, column, value).subscribe(
      msg => {
        // console.log("FILTER MESSAGE -> " + msg);
      },
      error => {
        console.log(error);
      },
      () => {
        // console.log("FILTER UPDATED");
      }
    );
  }

  fetch(username){
    let prog = 0;
    let loading = Loading.create({
      content: "Please wait"
    });
    this.navController.present(loading);
    this.bgg.fetch(username).then(data => {
      console.log(data);
      let arr = _.values(data);

      this.rawbgg = arr;
      this.procImport(this.rawbgg).subscribe(
        update => {
          console.log(update['msg']);
          prog = update['percentDone'];
        },
        error => console.log(error),
        () => {
          console.log("FINISHING IMPORT -> " + this.added + " games added, " +
           this.dupes.length + " dupes");
          this.db.refresh().subscribe(
            resp => console.log(resp),
            error => console.log(error.err.message),
            () => {
              this.refresh("IMPORT COMPLETE").subscribe(
                resp => console.log(resp),
                error => console.log(error),
                () => {
                  this.games = this.db.games;
                  this.dupes = [];
                  this.added = 0;
                  // update the view based on whether we're looking at trash
                  this.viewingIn ? this.viewIn() : this.viewOut();
                  loading.dismiss();
                }
              );
            }
          );
        }
      );
    })
  }

  procImport(set: Array<Game>){
    return new Observable(obs => {
      let toload = set.length;
      let loaded = 0;
      let prog = 0;

      // iterate through the set of retrieved games
      for(let rawGame of set){
        let game = new Game();
        _.forIn(game, (val, key) => {
          if (typeof rawGame[key] != undefined) {
            game[key] = rawGame[key];
          }
        });
        loaded++;
        prog = _.floor(loaded/toload);
        if(this.add(game, false)){
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
          this.dupes.push(game);
        }
      }
      obs.complete();
    })
  }

  add(game: Game, refresh: boolean = true){
    this.db.insert(game).subscribe(
      result => {
        console.log(result);
      },
      error => {
        console.log("DB INSERTION ERROR")
        console.log(error);
        return false;
      },
      () => {
        console.log("INSERTION COMPLETE");
        if (refresh) {
          this.refresh("DONE ADDING").subscribe(
            resp => console.log(resp),
            error => console.log(error),
            () => {
              this.games = this.db.games;
            });
        }
        return true;
      }
    );
  }

  trash(game: Game){
    this.updateGame(game, 'trash', true);
  }

  restore(game: Game) {
    this.updateGame(game, 'trash', false);
    this.updateGame(game, 'filtered', false);
  }

  refresh(msg: string = "refreshing"){
    console.log(msg);
    return this.db.refresh();
  }

  purge(){
    this.db.recreateTable();
  }

  detail(game){
    console.log(game);
  }

}
/*
  Modal for importing games from BGG
 */
@Component({
  template: `
  <ion-content padding>
    <h2>Import your collection from BGG</h2>
    <ion-list>
      <ion-item>
        <ion-label stacked title="{{schema.description}}">{{schema.prettyname}}</ion-label>
        <ion-input [(ngModel)]="username"></ion-input>
      </ion-item>

      <ion-item>
        <button (click)=close()>Fetch</button>
        <button (click)=cancel()>Cancel</button>
      </ion-item>
    </ion-list>
  </ion-content>`
})
class importGames {

  username: 'Your BGG username';

  schema = {
    name: 'username',
    prettyname: 'BGG Username',
    description: 'BGG username for collection to import.',
  }


  constructor(private viewCtrl: ViewController, private params: NavParams) {
      this.username = params.get('username');
    }

  close() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.username);
  }

  cancel(){
    this.viewCtrl.dismiss();
  }
}
/*
  Modal for filtering games from BGG
 */
@Component({
  template: `
  <ion-content padding>
    <h2>Filter your game set using BGG data</h2>
    <ion-list>
      <ion-item *ngFor="let field of schema.bool">
        <ion-label inline title="{{field.description}}">{{field.prettyname}}</ion-label>
        <ion-toggle [(ngModel)]="bggOpts[field.name]"></ion-toggle>
      </ion-item>
      <ion-item *ngFor="let field of schema.number">
        <ion-label stacked title="{{field.description}}">{{field.prettyname}}</ion-label>
        <ion-input [disabled]="field.show !== true && bggOpts[field.show] == false" type="number" [(ngModel)]="bggOpts[field.name]"></ion-input>
      </ion-item>
      <ion-item>
        <button (click)=close()>Filter</button>
        <button (click)=cancel()>Cancel</button>
      </ion-item>
    </ion-list>
  </ion-content>`
})
class filterGames {

  bggOpts: BggOpts = {
    minrating: 7,
    maxrank: 0,
    minplays: 0,
    minAverageRating: 7,
    excludeExp: true,
    owned: true,
    rated: true,
    played: false
  };

  schema = {
    text: [
      {
        name: 'username',
        prettyname: 'BGG Username',
        description: 'BGG username for collection to import.',
      }
    ],
    number: [
      {
        name: 'minrating',
        prettyname: 'Minimum rating',
        description:
         "Collection owner's lowest allowed rating for imported games.",
        default:7,
        min: 0,
        max: 10,
        show: 'rated'
      },
      {
        name: 'minrank',
        prettyname: 'Maximum BGG rank',
        description:
         "Highest allowed BGG rank for imported games (0 for any rank).",
        default:0,
        min: 0,
        max: 100000,
        show: true
      },
      {
        name: 'minplays',
        prettyname: 'Minimum plays',
        description:
         "Collection owner's lowest number of plays for imported games",
        default:0,
        min: 0,
        max: 1000,
        show: 'played'
      },
      {
        name: 'minAverageRating',
        prettyname: 'Minimum average rating',
        description:
         "Lowest allowed average rating on BGG for imported games (0 for any rating)",
        default:7,
        min: 0,
        max: 10,
        show: true
      }
    ],
    bool: [
      {
        name : 'excludeExp',
        prettyname : 'Exclude expansions',
        description: "Filter out expansions?",
        default: true
      },
      {
        name: 'owned',
          prettyname: "Owned only",
          description: "Limit to collection owner's owned games?",
          default: true
      },
      {
        name: 'rated',
        prettyname: 'Rated only',
        description: "Limit to games rated by collection owner?",
        default: true
      },
      {
        name: 'played',
        prettyname: 'Must have play(s) logged',
        description: "Limit to games with plays logged by collection owner?",
        default: false
      },
    ]
  }


  constructor(private viewCtrl: ViewController, private params: NavParams) {
      this.bggOpts = params.get('bggOpts');
    }

  close() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.bggOpts);
  }

  cancel(){
    this.viewCtrl.dismiss();
  }
}
