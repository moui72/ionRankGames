import { Component, Input } from '@angular/core';
import { NavController, NavParams, Loading } from 'ionic-angular';
import { Game } from '../../game.class';
import { List, WrappedList } from '../../list.class';
import { ListPage } from '../list/list'
import { Listdb } from '../../providers/listdb/listdb';
import * as _ from 'lodash';
/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/lists/lists.html',
  providers: [Listdb]
})
/* TODO: figure out how to pass pool, newName to list */
export class ListsPage {
  lists: Array<List> = [];
  pool: Array<Game> = [];
  newName: string = 'New list';

  constructor(
      private nav: NavController,
      private params: NavParams,
      private listdb: Listdb
    )
  {
    this.lists = [];
    this.pool = params.get('pool');
    this.getLists();
  }

  getLists(){
    this.listdb.getLists().then(lists => {
      this.lists = this.listdb.lists;
    });
  }

  create(){
    let list = new List(this.nextKey());
    list.name = this.newName;
    if(this.pool){
      list.set = this.pool;
    }
    this.lists.push(list);
    this.listdb.create(list);
  }

  edit(list){
    this.nav.push(ListPage, {list: list});
  }

  destroy(list){
    console.log("deleting list with id " + list.key);
    _.remove(this.lists, li => {
      return li.key == list.key;
    })
    let key: string = 'li_' + list.key;
    this.listdb.destroy(list);
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

  rankedCount(list){
    if(list.rankedSet.length < 1){
      return 0;
    }
    return list.rankedSet.length;
  }
  unrankedCount(list){
    if(list.set.length < 1){
      return 0;
    }
    return list.set.length;
  }
}
