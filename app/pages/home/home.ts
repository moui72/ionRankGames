import { Component } from '@angular/core';
import { NavController, Loading, Modal, ViewController, NavParams } from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { Observable } from 'rxjs/Observable';

@Component({
  directives: [],
  templateUrl: 'build/pages/home/home.html',
  providers: [Db, BggData]
})

export class HomePage {

  /**
   * TODO move fetch and filter functionalities to modals
   */

  constructor(
    private navController: NavController,
    private db: Db,
    private bgg: BggData
  )
  {
    this.init();
  }

  bggOpts = {
    username: '',
    excludeExp: true,
    minrating: 7,
    minrank: 1000
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
    let modal = Modal.create(importGames, {bggOpts: this.bggOpts});
    modal.onDismiss(data => {
      this.bggOpts = data;
    });
    this.navController.present(modal);
  }

  fetch(opts){
    let loading = Loading.create({
      content: "Please wait..."
    });
    this.navController.present(loading);
    this.bgg.fetch(opts).then(data => {
      let arr = _.values(data);
      if (opts.excludeExp) {
        arr = _.filter(arr, {'isExpansion': false});
      }
      arr = _.filter(arr, function(g: Game){
        return g.rating >= opts.minrating;
      });
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
  <ion-content padding class="home">
    <h2>Import your collection from BGG</h2>
    <ion-list>
      <ion-item>
        <ion-label stacked>BGG Username</ion-label>
        <ion-input type="text" [(ngModel)]="bggOpts.username"></ion-input>
      </ion-item>
      <ion-item>
        <button (click)=close(bggOpts)>Fetch</button>
        <button (click)=cancel()>Cancel</button>
      </ion-item>
    </ion-list>
  </ion-content>`
})
class importGames {

  bggOpts: Object = {
    username: '',
    excludeExp: true,
    minrating: 7,
    minrank: 1000
  };

  constructor(private viewCtrl: ViewController, private params: NavParams) {
      this.bggOpts = params.get('bggOpts');
    }

  close() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.bggOpts);
  }

  cancel(){
    this.viewCtrl.dismiss(this.params.get('bggOpts'));
  }
}
