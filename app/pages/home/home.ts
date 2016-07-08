import { Component } from '@angular/core';
import { NavController, Loading, Modal, ViewController, NavParams } from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { BggOpts } from '../../bggopts.class';
import { Observable } from 'rxjs/Observable';

@Component({
  directives: [],
  templateUrl: 'build/pages/home/home.html',
  providers: [Db, BggData]
})

export class HomePage {

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
    minrank: 0,
    minplays: 0,
    minAverageRating: 7,
    excludeExp: true,
    owned: true,
    rated: true,
    played: false
  }

  games = [];
  rawbgg = [];
  dupes = [];
  added = 0;
  loading = Loading.create();

  init(){
    this.db.load().subscribe(
      result => {
        console.log("LOADING DB -> " + result);
      }, error => {
        console.log("ERROR LOADING DB -> " + error);
      }, () => {
        this.games = this.db.games;
        console.log("DONE LOADING DB");
      }
    );
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
        this.filter(this.bggOpts);
      } else {
        console.log('Filtering canceled.');
      }
    });
    this.navController.present(modal);
  }

  filter(arr){
    let loading = Loading.create({
      content: "Please wait..."
    });
    this.navController.present(loading);

    let opts = this.bggOpts;
    if (opts.excludeExp) {
      arr = _.filter(arr, {'isExpansion': false});
    }
    if (opts.owned) {
      arr = _.filter(arr, {'owned': true});
    }
    arr = _.filter(arr, function(g: Game){
      return g.rating >= opts.minrating;
    });
    this.games = arr;
    loading.dismiss();
  }

  fetch(opts){
    let loading = Loading.create({
      content: "Please wait..."
    });
    this.navController.present(loading);
    this.bgg.fetch(opts).then(data => {
      let arr = _.values(data);

      this.rawbgg = arr;
      this.procImport(this.rawbgg).subscribe(
        msg => console.log(msg),
        error => console.log(error),
        () => {
          console.log("FINISHING IMPORT -> " + this.added + "games added, " +
           this.dupes.length + " dupes");
          this.db.refresh().subscribe(
            resp => console.log(resp),
            error => console.log(error),
            () => {
              this.refresh("IMPORT COMPLETE").subscribe(
                resp => console.log(resp),
                error => console.log(error),
                () => {
                  this.games = this.db.games;
                  this.dupes = [];
                  this.added = 0;
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

      for(let game of set){
        loaded++;
        prog = _.floor(loaded/toload);
        if(this.add(game, false)){
          obs.next("IMPORTED GAME -> " + game.name + '(' +
           _.floor(loaded/toload*100) + '%)');
          this.added++;
        } else {
          obs.next("DUPLICATE GAME -> " + game.name + '(' +
           _.floor(loaded/toload*100) + '%)');
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
        console.log("DB INSERTION ERROR -> " + error.message);
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

  kill(game: Game){
    this.db.drop(game).subscribe(
      msg => console.log(msg),
      error => console.log(error),
      () => this.refresh("DONE KILLING").subscribe(
        resp => console.log(resp),
        error => console.log(error),
        () => {
          this.games = this.db.games;
        }
      )
    );
  }

  refresh(msg: string = "refreshing"){
    console.log(msg);
    return this.db.refresh();
  }

  purge(){
    let loading = Loading.create({
      content: "Please wait..."
    });
    this.navController.present(loading);
    this.db.purge().subscribe(
      msg => console.log("PURGING -> " + msg),
      error => console.log("ERROR PURGING -> " + error.message),
      () => {
        this.refresh("DONE PURGING").subscribe(
          resp => console.log(resp),
          error => console.log(error),
          () => {
            this.games = this.db.games;
            loading.dismiss();
          }
        );;
      }
    );
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
        <ion-label inline title="{{schema.description}}">{{schema.prettyname}}</ion-label>
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
        <ion-label inline title="{{field.description}}">{{field.name}}</ion-label>
        <ion-input type="number" [(ngModel)]="bggOpts[field.name]"></ion-input>
      </ion-item>
      <ion-item>
        <button (click)=close()>Fetch</button>
        <button (click)=cancel()>Cancel</button>
      </ion-item>
    </ion-list>
  </ion-content>`
})
class filterGames {

  bggOpts: BggOpts = {
    minrating: 7,
    minrank: 0,
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
        max: 10
      },
      {
        name: 'minrank',
        prettyname: 'Minimum rank',
        description:
         "Lowest allowed BGG rank for imported games (0 for any rank).",
        default:0,
        min: 0,
        max: 100000
      },
      {
        name: 'minplays',
        prettyname: 'Minimum plays',
        description:
         "Collection owner's lowest number of plays for imported games",
        default:0,
        min: 0,
        max: 1000,
      },
      {
        name: 'minAverageRating',
        prettyname: 'Minimum average rating',
        description:
         "Lowest allowed average rating on BGG for imported games (0 for any rating)",
        default:7,
        min: 0,
        max: 10,
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
