import { Injectable } from '@angular/core';
import { Storage, SqlStorage } from 'ionic-angular';
import { Game, WrappedGame } from '../../game.class';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import * as PouchDB from 'pouchdb';


/*
  Generated class for the List provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class List {
  data: any;

  constructor() {
    this.data = null;
  }

  load() {

  }
}
