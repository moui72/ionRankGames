import { Injectable } from '@angular/core';
import { List, WrappedList } from '../../list.class';
import * as PouchDB from 'pouchdb';
import * as _ from 'lodash';
import { Storage, LocalStorage } from 'ionic-angular';
/*
  Generated class for the Listdb provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class Listdb {
  lists: Array<List>;
  list_db: PouchDB;
  local: Storage;

  constructor() {
    this.list_db = new PouchDB('rankGames_lists');
    this.local = new Storage(LocalStorage);
  }

  getLists(){
    return new Promise((resolve, reject) => {
      this.list_db.allDocs({include_docs: true}, (err, response) => {
        if(err){reject(err)}
        let arr: Array<List> = _.map(response.rows, row => {
          return row['doc'].list;
        });
        this.lists = arr;
        resolve(arr);
      })
    })
  }

  create(list){
    let listDoc = new WrappedList(list);
    this.list_db.put(listDoc, (error, response) => {
      if(error){
        // handle error
      }
      // handle success
    });
  }

  update(list){
    let now = Date.now();
    if(list.lastEdit == undefined || list.lastEdit == null || list.lastEdit < now){
      list.lastEdit = now;
      this.local.set('lastList', JSON.stringify(list));
    }
    this.list_db.get('li_'+list.key, (error, doc) => {
      if(error){
        // handle error
      }
      // handle success
      doc['list'] = list;
      return this.list_db.put(doc, (error) => {
        if(error){
          // handle error
        }
        // handle success
      })
    })
  }

  destroy(list){
    let listDoc = new WrappedList(list);
    this.list_db.get(listDoc._id, (error, doc) => {
      if(error){
        // handle error
      }
      // handle success
      return this.list_db.remove(doc, (error, resp) => {
        if(error){
          // handle error
        }
        // handle success
      })
    });
  }

  thereAreLists(){
    if(this.lists && this.lists.length > 0){
      return true;
    }
    return false;
  }

}
