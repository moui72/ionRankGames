import { Component, Input } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Game } from '../../game.class';
import { List, WrappedList } from '../../list.class';
import { ListPage } from '../list/list'
import * as PouchDB from 'pouchdb';
import * as _ from 'lodash';
/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/lists/lists.html',
})
/* TODO: figure out how to pass pool, newName to list */
export class ListsPage {
  lists: Array<List> = [];
  pool: Array<Game> = [];
  newName: string = 'New list';
  list_db: PouchDB;

  constructor(private nav: NavController, private params: NavParams) {
    this.lists = [];
    this.pool = params.get('pool');
    this.list_db = new PouchDB('rankGames_lists');
  }

  create(){
    let list = new List(this.nextKey());
    console.log(list);
    list.name = this.newName;
    if(this.pool){
      list.set = this.pool;
    }
    this.lists.push(list);
    let listDoc = new WrappedList(list);
    this.list_db.put(listDoc, (error, response) => {
      if(error){return console.log(error)}
      console.log(response);
      console.log('Insertion complete.');
    });
  }

  edit(list){
    this.nav.push(ListPage, list);
  }

  delete(list){
    console.log("deleting list with id " + list.key);
    _.remove(this.lists, li => {
      return li.key == list.key;
    })
    let key: string = 'li_' + list.key;
    this.list_db.get(key, (error, doc) => {
      if(error){return console.log(error)}
      return this.list_db.remove(doc, (error, resp) => {
        if(error){return console.log(error)}
        console.log('Deletion complete.')
      })
    });
  }

  thereAreLists(){
    if(this.lists && this.lists.length > 0){
      return true;
    }
    return false;
  }

  nextKey(){
    if(this.lists.length > 0){
      let last =  _.last(_.sortBy(this.lists, list => {return list.key})).key;
      return (Number(last) + 1).toString();
    }
    return '1';
  }

}
