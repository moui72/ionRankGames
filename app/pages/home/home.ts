import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Db } from '../../providers/db/db';
import { BggData } from '../../providers/bgg-data/bgg-data';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { Observable } from 'rxjs/Observable';

@Component({
  templateUrl: 'build/pages/home/home.html',
  providers: [Db, BggData]
})

export class HomePage {
  constructor(
    private navController: NavController,
    private db: Db,
    private bgg: BggData)
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

  init(){
    this.db.load().subscribe(
      result => {
        console.log("LOADING DB -> " + result);
      }, error => {
        console.log("ERROR LOADING DB -> " + error);
      }, () => {
        console.log("DONE LOADING DB");
      }
    );
  }

  fetch(opts){
    this.bgg.fetch(opts).then(data => {
      var arr = _.values(data);
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
          console.log(JSON.stringify(this.dupes));
          this.db.refresh().subscribe(
            resp => console.log(resp),
            error => console.log(error),
            () => {
              this.refresh("IMPORT COMPLETE");
              this.dupes = [];
              this.added = 0;
            }
          );
        }
      );
    });
  }

  procImport(set: Array<Game>){
    return new Observable(obs => {
      for(let game of set){
        if(this.add(game, false)){
          obs.next("IMPORTED GAME -> " + game.name);
          this.added++;
        } else {
          obs.next("DUPLICATE GAME -> " + game.name);
          this.dupes.push(game);
        }
      }
      obs.complete();
    })
  }

  add(game: Game, refresh: boolean = true){
    this.db.insert(game, refresh).subscribe(
      result => {
        console.log(result);
      },
      error => {
        console.log("DB INSERTION ERROR -> " + error.message);
        return false;
      },
      () => {
        console.log("INSERTION COMPLETE");
        return true;
      }
    );
  }

  kill(game: Game){
    this.db.drop(game).subscribe(
      msg => console.log(msg),
      error => console.log(error),
      () => this.refresh("DONE KILLING")
    );
  }

  refresh(msg: string = "refreshing"){
    console.log(msg);
    this.db.refresh().subscribe(
      resp => console.log(resp),
      error => console.log(error),
      () => { this.games = this.db.games; });
  }

  purge(){
    this.db.purge().subscribe(
      msg => console.log("PURGING -> " + msg),
      error => console.log("ERROR PURGING -> " + error.message),
      () => { this.refresh("DONE PURGING") }
    );
  }
}
